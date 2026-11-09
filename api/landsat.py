"""
Landsat surface temperature over the plot, via Microsoft Planetary Computer.

Landsat sees the ground's surface temperature at one moment per overpass (late morning), at 30 m resolution.
That is not air temperature, so it does not replace NASA POWER data in the scores. It is reported as
"surface heat": how much warmer the plot's surface runs than the air on the same days.
"""
import asyncio
import logging
import statistics
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional

import geopandas as gpd
import numpy as np
import planetary_computer
import rasterio
import rasterio.mask
import shapely
from pystac_client import Client
from shapely import Polygon

from models import PolygonInput

logger = logging.getLogger(__name__)

STAC_API_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
COLLECTION = "landsat-c2-l2"
MAX_CLOUD_COVER = 10

# Surface temperature band: Landsat 8/9 call it lwir11, Landsat 4–7 call it lwir.
SURFACE_TEMP_ASSETS = ("lwir11", "lwir")
# Collection 2 Level-2 surface temperature: kelvin = DN * scale + offset; 0 means no data.
ST_SCALE = 0.00341802
ST_OFFSET = 149.0
ST_NODATA = 0
KELVIN = 273.15

SEARCH_TIMEOUT_S = 20
READ_TIMEOUT_S = 40
MAX_RETRIES = 3
READ_WORKERS = 6

Status = Literal["ok", "no_scenes", "timeout", "error", "disabled"]


@dataclass
class SceneReading:
    date: str  # YYYYMMDD, to match NASA POWER keys
    platform: str
    surface_temp_c: float


@dataclass
class LandsatResult:
    status: Status
    readings: List[SceneReading] = field(default_factory=list)


def _plot_polygon(polygon: PolygonInput) -> Polygon:
    return Polygon([(lon, lat) for lat, lon in polygon.coordinates])


def search_scenes(polygon: PolygonInput, year: int) -> list:
    """Scenes over the plot in the given year with little cloud. Raises on API or network errors."""
    catalog = Client.open(STAC_API_URL, modifier=planetary_computer.sign_inplace, timeout=SEARCH_TIMEOUT_S)
    search = catalog.search(
        collections=[COLLECTION],
        intersects=shapely.to_geojson(_plot_polygon(polygon)),
        datetime=f"{year}-01-01/{year}-12-31",
        query={"eo:cloud_cover": {"lte": MAX_CLOUD_COVER}},
    )
    return list(search.items())


def surface_temperature_c(item, polygon: PolygonInput) -> Optional[float]:
    """Median surface temperature (°C) of the pixels inside the plot, or None without usable pixels."""
    asset = next((item.assets[name] for name in SURFACE_TEMP_ASSETS if name in item.assets), None)
    if asset is None:
        return None

    with rasterio.open(asset.href) as src:
        shape = gpd.GeoSeries([_plot_polygon(polygon)], crs=4326).to_crs(src.crs).iloc[0]
        # all_touched: plots can be smaller than one 30 m pixel.
        data, _ = rasterio.mask.mask(src, [shape], crop=True, all_touched=True, filled=False)

    values = np.ma.masked_equal(data[0], ST_NODATA).compressed()
    if values.size == 0:
        return None
    return float(np.median(values) * ST_SCALE + ST_OFFSET - KELVIN)


def read_surface_temperatures(items: list, polygon: PolygonInput) -> List[SceneReading]:
    """Reads every scene in parallel; scenes that fail or have no pixels over the plot are skipped."""

    def read(item) -> Optional[SceneReading]:
        try:
            temp = surface_temperature_c(item, polygon)
        except Exception as e:  # noqa: BLE001 - one bad scene must not sink the rest
            logger.warning(f"Skipping Landsat scene {item.id}: {e}")
            return None
        if temp is None:
            return None
        return SceneReading(item.datetime.strftime("%Y%m%d"), item.properties.get("platform", "landsat"), round(temp, 1))

    with ThreadPoolExecutor(max_workers=READ_WORKERS) as pool:
        readings = [r for r in pool.map(read, items) if r is not None]
    return sorted(readings, key=lambda r: r.date)


async def fetch_landsat(polygon: PolygonInput, year: int, enabled: bool = True) -> LandsatResult:
    """Search with retries, then read surface temperatures. Never raises; the status says what happened."""
    if not enabled:
        return LandsatResult("disabled")

    items = None
    for attempt in range(MAX_RETRIES):
        try:
            items = await asyncio.wait_for(asyncio.to_thread(search_scenes, polygon, year), SEARCH_TIMEOUT_S + 5)
            break
        except Exception as e:  # noqa: BLE001 - timeouts and API errors are retried the same way
            if attempt == MAX_RETRIES - 1:
                logger.warning(f"Landsat search failed after {MAX_RETRIES} attempts: {e!r}")
                return LandsatResult("timeout")
            wait = 2**attempt
            logger.info(f"Landsat search attempt {attempt + 1} failed ({e!r}); retrying in {wait}s")
            await asyncio.sleep(wait)

    if not items:
        return LandsatResult("no_scenes")

    try:
        readings = await asyncio.wait_for(asyncio.to_thread(read_surface_temperatures, items, polygon), READ_TIMEOUT_S)
    except asyncio.TimeoutError:
        logger.warning("Reading Landsat scenes timed out")
        return LandsatResult("timeout")
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Reading Landsat scenes failed: {e!r}")
        return LandsatResult("error")

    return LandsatResult("ok" if readings else "no_scenes", readings)


def surface_heat(readings: List[SceneReading], nasa_data: Dict) -> Optional[Dict]:
    """
    How much warmer the plot's surface runs than the air: Landsat surface temperature against NASA POWER's
    daily maximum air temperature on the same days. None when no scene date has NASA data.
    """
    t_max = nasa_data.get("properties", {}).get("parameter", {}).get("T2M_MAX", {})
    pairs = [(r.surface_temp_c, t_max[r.date]) for r in readings if r.date in t_max]
    if not pairs:
        return None
    surface = statistics.mean(p[0] for p in pairs)
    air = statistics.mean(p[1] for p in pairs)
    return {
        "scenes": len(pairs),
        "mean_surface_temp_c": round(surface, 1),
        "mean_air_temp_max_c": round(air, 1),
        "offset_c": round(surface - air, 1),
        "dates": [r.date for r in readings if r.date in t_max],
    }
