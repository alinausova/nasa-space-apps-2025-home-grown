import asyncio
from datetime import datetime
from types import SimpleNamespace

import numpy as np
import pytest
import rasterio
from rasterio.io import MemoryFile
from rasterio.transform import from_origin

import landsat
from landsat import SceneReading, fetch_landsat, surface_heat, surface_temperature_c
from models import PolygonInput

# 10 × 10 pixels of 30 m in UTM 32N, origin near Munich (691000 E, 5337000 N).
ORIGIN = (691_000, 5_337_000)


def dn_for(celsius: float) -> int:
    return round((celsius + 273.15 - 149.0) / 0.00341802)


@pytest.fixture
def raster():
    """In-memory ST band: left half 20 °C, right half 40 °C, one nodata pixel."""
    data = np.full((10, 10), dn_for(20), dtype=np.uint16)
    data[:, 5:] = dn_for(40)
    data[0, 0] = 0
    memfile = MemoryFile()
    with memfile.open(driver="GTiff", height=10, width=10, count=1, dtype="uint16", crs="EPSG:32632",
                      transform=from_origin(*ORIGIN, 30, 30), nodata=0) as dst:
        dst.write(data, 1)
    yield memfile
    memfile.close()


def polygon_over(x0, x1, y0, y1):
    """PolygonInput (lat, lon) for a UTM 32N box given in pixel columns/rows."""
    import pyproj

    to_wgs = pyproj.Transformer.from_crs(32632, 4326, always_xy=True)
    corners = [(ORIGIN[0] + x * 30, ORIGIN[1] - y * 30) for x, y in [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]]
    return PolygonInput(coordinates=[tuple(reversed(to_wgs.transform(e, n))) for e, n in corners])


def item(href, asset="lwir11", when="2025-07-15"):
    return SimpleNamespace(id="scene", assets={asset: SimpleNamespace(href=href)}, datetime=datetime.fromisoformat(when),
                           properties={"platform": "landsat-9"})


class TestSurfaceTemperature:
    def test_reads_only_pixels_inside_the_plot(self, raster):
        # Plot over the right (40 °C) half only; the bounding box of the whole raster would mix in 20 °C.
        assert surface_temperature_c(item(raster.name), polygon_over(6.2, 8.8, 2.2, 7.8)) == pytest.approx(40, abs=0.05)

    def test_uses_lwir_when_lwir11_is_missing(self, raster):
        assert surface_temperature_c(item(raster.name, asset="lwir"), polygon_over(1.2, 3.8, 2.2, 7.8)) == pytest.approx(20, abs=0.05)

    def test_no_thermal_band(self, raster):
        assert surface_temperature_c(item(raster.name, asset="red"), polygon_over(1, 3, 2, 7)) is None

    def test_ignores_nodata(self, raster):
        # Plot over the nodata corner pixel and its neighbours: only valid 20 °C pixels count.
        assert surface_temperature_c(item(raster.name), polygon_over(0.1, 1.9, 0.1, 1.9)) == pytest.approx(20, abs=0.05)


class TestSurfaceHeat:
    nasa = {"properties": {"parameter": {"T2M_MAX": {"20250715": 26.0, "20250731": 24.0}}}}

    def test_offset_against_air_on_the_same_days(self):
        heat = surface_heat([SceneReading("20250715", "landsat-9", 40.0), SceneReading("20250731", "landsat-8", 34.0)], self.nasa)
        assert heat == {"scenes": 2, "mean_surface_temp_c": 37.0, "mean_air_temp_max_c": 25.0, "offset_c": 12.0, "dates": ["20250715", "20250731"]}

    def test_none_without_matching_days(self):
        assert surface_heat([SceneReading("20250101", "landsat-9", 5.0)], self.nasa) is None


class TestFetchLandsat:
    plot = PolygonInput(coordinates=[(48.14, 11.56), (48.14, 11.561), (48.141, 11.561)])

    def run(self, coro):
        return asyncio.run(coro)

    def test_disabled(self):
        assert self.run(fetch_landsat(self.plot, 2025, enabled=False)).status == "disabled"

    def test_search_keeps_failing_gives_timeout(self, monkeypatch):
        calls = []

        def boom(*args):
            calls.append(1)
            raise TimeoutError("planetary computer did not answer")

        async def no_sleep(_):
            return None

        monkeypatch.setattr(landsat, "search_scenes", boom)
        monkeypatch.setattr(landsat.asyncio, "sleep", no_sleep)
        assert self.run(fetch_landsat(self.plot, 2025)).status == "timeout"
        assert len(calls) == landsat.MAX_RETRIES

    def test_no_scenes(self, monkeypatch):
        monkeypatch.setattr(landsat, "search_scenes", lambda *a: [])
        assert self.run(fetch_landsat(self.plot, 2025)).status == "no_scenes"

    def test_ok_with_readings(self, monkeypatch, raster):
        monkeypatch.setattr(landsat, "search_scenes", lambda *a: [item(raster.name)])
        plot = polygon_over(6.2, 8.8, 2.2, 7.8)
        result = self.run(fetch_landsat(plot, 2025))
        assert result.status == "ok"
        assert result.readings == [SceneReading("20250715", "landsat-9", 40.0)]
