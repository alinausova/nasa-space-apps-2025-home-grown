"""Landsat surface temperature via Microsoft Planetary Computer, and merging it into NASA POWER data."""
import asyncio
import logging
from typing import Dict

import geopandas as gpd
import pandas as pd
import planetary_computer
import pystac
import rasterio
import shapely
from pystac_client import Client
from pystac_client.exceptions import APIError
from rasterio.merge import merge
from rasterio.windows import from_bounds
from shapely import Polygon

from models import PolygonInput

MICROSOFT_PLANETARY_API_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"

logger = logging.getLogger(__name__)


def merge_climate_data(nasa_data: Dict, landsat_df: pd.DataFrame, year: int) -> Dict:
    """
    Merge NASA POWER data with higher-resolution Landsat surface temperature data.

    Strategy:
    1. Landsat provides more accurate local temperature but sparse temporal coverage
    2. NASA POWER provides complete daily coverage but coarse spatial resolution
    3. Use Landsat data where available, NASA POWER as fallback

    Args:
        nasa_data: Raw NASA POWER API response with daily data
        landsat_df: DataFrame with Landsat surface temperatures (columns: tmin, tmax)
                    Index should be datetime
        year: Year of analysis

    Returns:
        Modified nasa_data dict with temperatures updated from Landsat where available
    """
    logger.info("\n=== MERGING CLIMATE DATA ===")
    logger.info(f"NASA POWER data year: {year}")
    logger.info(f"Landsat data shape: {landsat_df.shape}")
    logger.info(f"Landsat date range: {landsat_df.index.min()} to {landsat_df.index.max()}")
    # Extract NASA POWER temperature data
    parameters = nasa_data.get("properties", {}).get("parameter", {})
    nasa_tmax = parameters.get("T2M_MAX", {})
    nasa_tmin = parameters.get("T2M_MIN", {})

    # Track statistics
    merged_count = 0
    nasa_only_count = 0

    # Iterate through Landsat data and update NASA where available
    for date_idx, row in landsat_df.iterrows():
        # Convert datetime index to NASA format: YYYYMMDD
        date_key = date_idx.strftime("%Y%m%d")

        # Check if this date exists in NASA data
        if date_key in nasa_tmax and date_key in nasa_tmin:
            # Only update if Landsat has valid (non-NaN) data
            if pd.notna(row['tmax']) and pd.notna(row['tmin']):
                old_tmax = nasa_tmax[date_key]
                old_tmin = nasa_tmin[date_key]

                # Update with Landsat data
                nasa_tmax[date_key] = float(row['tmax'])
                nasa_tmin[date_key] = float(row['tmin'])

                merged_count += 1

                if merged_count <= 3:  # Show first few merges
                    logger.info(f"  Merged {date_key}: NASA ({old_tmin:.1f}, {old_tmax:.1f}) -> Landsat ({row['tmin']:.1f}, {row['tmax']:.1f})")
    # Count NASA-only dates
    nasa_only_count = len(nasa_tmax) - merged_count

    logger.info("\nMerge Summary:")
    logger.info(f"  - Dates with Landsat data: {merged_count}")
    logger.info(f"  - Dates with NASA POWER only: {nasa_only_count}")
    logger.info(f"  - Total dates: {len(nasa_tmax)}")
    logger.info(f"  - Landsat coverage: {merged_count/len(nasa_tmax)*100:.1f}%")
    logger.info("=== MERGE COMPLETE ===\n")
    # Return the modified NASA data
    # (modifications were made in-place to the dictionaries)
    return nasa_data

async def query_planetary_stac_async(api_url: str,
                                     collection: str,
                                     polygon: PolygonInput,
                                     time_range: str,
                                     max_cloud_coverage: int | None,
                                     max_retries: int = 3) -> pystac.ItemCollection | None:
    """
    Async wrapper for query_planetary_stac to enable parallel execution with retry logic.

    Args:
        api_url: URL of the API to use
        collection: Name of the collection/data source to use
        polygon: Polygon representing the area of interest
        time_range: Time range to be used to fetch the data. Ex.: "2025-01-01/2025-12-31"
        max_cloud_coverage: Value in percentage for maximum cloud coverage
        max_retries: Maximum number of retry attempts (default: 3)

    Returns:
        Search results as item_collection, or None if all retries failed
    """
    for attempt in range(max_retries):
        try:
            # Run the synchronous STAC query in a worker thread
            result = await asyncio.to_thread(
                query_planetary_stac,
                api_url,
                collection,
                polygon,
                time_range,
                max_cloud_coverage
            )
            if result is not None:
                return result
        except (APIError, Exception) as e:
            if attempt < max_retries - 1:
                # Exponential backoff: 1s, 2s, 4s
                wait_time = 2 ** attempt
                logger.warning(f"Planetary Computer API timeout (attempt {attempt + 1}/{max_retries}). Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Planetary Computer API failed after {max_retries} attempts: {str(e)}")
                logger.warning("Continuing without Landsat satellite data")
                return None
        except Exception as e:
            logger.error(f"Unexpected error querying Planetary Computer: {str(e)}")
            return None

    return None

def query_planetary_stac(api_url: str,
                         collection: str,
                         polygon: PolygonInput,
                         time_range: str,
                         max_cloud_coverage: int | None) -> pystac.ItemCollection | None:
    """Query the Microsoft Planetary Geospatial Catalog using STAC

    Args:
        api_url: Url of the API to use.
        collection: Name of the collection/data source to use. The name should be as it is mentionned on
                    the API documentation.
        polygon: Polygon representing the area of interest.
        time_range: Time range to be used to fetch the data. Ex.: "2025-01-01/2025-12-31"
        max_cloud_coverage: Value in percentage that will set the maximum percentage of cloud coverage
                            the scene can have.

    Returns:
        Search results in the form of item_collection, or None if the request fails.
    """
    try:
        aoi = Polygon([(lon, lat) for lat, lon in polygon.coordinates])

        # Opens the connection to the api.
        catalog = Client.open(api_url, modifier=planetary_computer.sign_inplace)

        # If the cloud coverage value if provided, the parameter is taken into account.
        if isinstance(max_cloud_coverage, int):
            search = catalog.search(
                collections=[collection],
                intersects=shapely.to_geojson(aoi),
                datetime=time_range,
                query={"eo:cloud_cover": {"lte": [max_cloud_coverage]}}
            )
        else:
            search = catalog.search(
                collections=[collection],
                intersects=shapely.to_geojson(aoi),
                datetime=time_range
            )

        return search.item_collection()
    except APIError as e:
        # Re-raise APIError so the async wrapper can handle retries
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in query_planetary_stac: {str(e)}")
        return None

def calculate_surface_temperature_landsat(stac_items: pystac.ItemCollection,
                                          band: str,
                                          polygon_coord: PolygonInput) -> pd.DataFrame:
    """Calculates the surface temperature in Celsius and generate a daily min and max temperature.

    Args:
        stac_items: Items fetched from the STAC api query.
        band: Name of the band to be used to extract the relevant data from the catalog
        polygon_coord: Geometry of the aoi

    Returns:
        Dataframe with a daily minimum and maximum temperature.
    """
    # Coefficient to use to convert the data to the real values
    scale = 0.00341802
    offset = 149

    # Factor to convert K to C.
    kelvin_to_celsius = -273.15

    # Used to store the images URL of the same dates together. This is used to merge the same date scenes together.
    date_with_scene_dict = {}
    for i in stac_items:
        if band not in i.assets:
            logger.warning(f"Skipping item from {i.datetime} - band '{band}' not available")
            continue
        # Format the date
        date = i.datetime.strftime("%Y-%m-%d")

        if date not in date_with_scene_dict:
            date_with_scene_dict[date] = []

        # Store the band/image/scene URL to its corresponding date.
        date_with_scene_dict[date].append(i.assets[band].href)

    date_with_daily_temperature = {"date": [], "tmin": [], "tmax": []}

    # Fetch the image in an numpy array. The array corresponds to the areas of the aoi.
    for date, urls in date_with_scene_dict.items():

        # Means that there are at least 2 scenes of the same date.
        if len(urls) > 1:
            datasets = [rasterio.open(url) for url in urls]

            polygon = Polygon([(lon, lat) for lat, lon in polygon_coord.coordinates])

            # Make sure that the crs of the polygon is the same as the image.
            polygon_reproj = gpd.GeoSeries(polygon).set_crs(4326).to_crs(datasets[0].crs).geometry[0]

            # Get the bounding box of the polygon
            minx, miny, maxx, maxy = polygon_reproj.bounds

            # Merging the scenes of the same date together.
            array, out_transform = merge(sources=datasets, bounds=(minx, miny, maxx, maxy))

            # Creates a mask to ignore value classified as no data.
            mask = array != 0

            # Apply coefficients to covert the pixel value to real values and coversion from K to C.
            array = (array[mask] * scale) + offset + kelvin_to_celsius

        # Case when only 1 scene is available for a date.
        else:
            with rasterio.open(urls[0]) as src:

                polygon = Polygon([(lon, lat) for lat, lon in polygon_coord.coordinates])

                polygon_reproj = gpd.GeoSeries(polygon).set_crs(4326).to_crs(src.crs).geometry[0]

                # Get the bounding box of the polygon
                minx, miny, maxx, maxy = polygon_reproj.bounds

                # Get the bounding box of the polygon
                window = from_bounds(minx, miny, maxx, maxy, transform=src.transform)

                # Fetch the array from the URL that matches the aoi.
                array = src.read(1, window=window)

                # Creates a mask to ignore value classified as no data.
                mask = array != src.nodata

                # Apply coefficients to covert the pixel value to real values and coversion from K to C.
                array = (array[mask] * scale) + offset + kelvin_to_celsius

        # Append the results in a dict
        date_with_daily_temperature["date"].append(date)
        date_with_daily_temperature["tmin"].append(array.min())
        date_with_daily_temperature["tmax"].append(array.max())

    # Gather the dict to a pd.DataFrame (OUTSIDE the loop - FIXED!)
    df = pd.DataFrame(date_with_daily_temperature)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)

    all_dates = pd.date_range(start=df.index.min(), end=df.index.max(), freq='D')
    df = df.reindex(all_dates)

    # Forward filling of missing values. That means day without values are filled with the previous closest date
    df['tmin'] = df['tmin'].ffill()
    df['tmax'] = df['tmax'].ffill()

    logger.debug(f"Building DataFrame with {len(date_with_daily_temperature['date'])} unique dates")
    logger.debug(f"Date range before reindex: {df.index.min()} to {df.index.max()}")
    logger.debug(f"DataFrame shape after forward fill: {df.shape}")
    logger.debug(f"Any NaN values remaining? tmin: {df['tmin'].isna().sum()}, tmax: {df['tmax'].isna().sum()}")
    return df
