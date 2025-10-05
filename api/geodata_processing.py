from datetime import datetime
import geopandas as gpd
import pandas as pd
import planetary_computer
from pystac_client import Client
import pystac
import rasterio
from rasterio.merge import merge
from rasterio.windows import from_bounds
from shapely import Polygon, wkt
import shapely

from dotenv import load_dotenv



load_dotenv()

MICROSOFT_PLANETARY_API_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"



def query_planetary_stac(api_url: str,
                         collection: str,
                         aoi: Polygon,
                         time_range: str,
                         max_cloud_coverage: int | None) -> pystac.ItemCollection:
    """Query the Microsoft Planetary Geospatial Catalog using STAC
    
    Args:
        api_url: Url of the API to use.
        collection: Name of the collection/data source to use. The name should be as it is mentionned on
                    the API documentation.
        aoi: Polygon represnting the area of interest.
        time_range: Time range to be used to fetch the data. Ex.: "2025-01-01/2025-12-31"
        max_cloud_coverage: Value in percentage that will set the maximum percentage of cloud coverage 
                            the scene can have.

    Returns:
        Search results in the form of item_collection.
    """
    # Opens the connection to the api.
    catalog = Client.open(api_url, modifier=planetary_computer.sign_inplace,)

    # Search engine to query the api catalog
    search = catalog.search(
        collections=[collection], intersects=shapely.to_geojson(aoi), datetime=time_range
        )
    
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


def calculate_gdd(temp_max: float, temp_min: float, base_temp: float, upper_temp: float) -> float:
    """
    Calculate Growing Degree Days for a single day using the method from FAO56rev.
    This accounts for both base temperature (Tbase) and upper temperature (Tupper) limits.

    Based on Equation 2 from the paper which adjusts temperatures before calculating GDD.
    https://www.sciencedirect.com/science/article/pii/S037837742500469X
    Args:
        temp_max: Maximum daily temperature (°C)
        temp_min: Minimum daily temperature (°C)
        base_temp: Base temperature below which growth stops (°C)
        upper_temp: Upper temperature above which growth stops (°C)

    Returns:
        Growing Degree Days for the day
    """
    # Adjust Tmax
    if temp_max > upper_temp:
        adj_tmax = upper_temp
    elif temp_max < base_temp:
        adj_tmax = base_temp
    else:
        adj_tmax = temp_max

    # Adjust Tmin
    if temp_min > upper_temp:
        adj_tmin = upper_temp
    elif temp_min < base_temp:
        adj_tmin = base_temp
    else:
        adj_tmin = temp_min

    # Calculate average temperature from adjusted values
    avg_temp = (adj_tmax + adj_tmin) / 2

    # Calculate GDD
    if avg_temp < base_temp:
        return 0.0
    else:
        return avg_temp - base_temp



def calculate_surface_temperature_landsat(stac_items: pystac.ItemCollection, 
                                          band: str,
                                          polygon: Polygon) -> pd.DataFrame:
    """Calculates the surface temperature in Celsius and generate a daily min and max temperature.

    Args:
        stac_item: Items fetched from the STAC api query.
        band: Name of the band to be used to extract the relevant data from the catalog
        polygon: Geometry of the aoi

        Returns:
            Dataframe with a daily minimum and maximum temperature.

    """
    # Coefficient to use to convert the data to the real values
    scale = 0.00341802
    offset =  149

    # Factor to convert K to C.
    kelvin_to_celsius = -273.15

    # Used to store the images URL of the same dates together. This is used to merge the same date scenes together.
    date_with_scene_dict = {}
    for i in stac_items:
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

            # Make sure that the crs of the polygon is the same as the image.
            polygon_reproj= gpd.GeoSeries(polygon).set_crs(4326).to_crs(datasets[0].crs).geometry[0]

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

                polygon_reproj= gpd.GeoSeries(polygon).set_crs(4326).to_crs(src.crs).geometry[0]

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
    
        # Gather the dict to a pd.DataFrame
        df = pd.DataFrame(date_with_daily_temperature)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)

        all_dates = pd.date_range(start=df.index.min(), end=df.index.max(), freq='D')
        df = df.reindex(all_dates)

        # Forward filling of missing values. That means day without values are filled with the previous closest date
        df['tmin'] = df['tmin'].ffill()
        df['tmax'] = df['tmax'].ffill()

    return df
            

# test section
def main():
    poly_small = "POLYGON ((11.56781761431533262 48.12978723465923281, 11.56856190677252982 48.12976197492466923, 11.56853667651974327 48.12927361761428813, 11.56776715380976128 48.1292399376286113, 11.56781761431533262 48.12978723465923281))"
    stac_items_landsat = query_planetary_stac(MICROSOFT_PLANETARY_API_URL, "landsat-c2-l2", wkt.loads(poly_small), "2025-01-01/2025-12-31", 10)
    
    polygon = wkt.loads(poly_small)

    st_landsat = calculate_surface_temperature_landsat(stac_items_landsat, "lwir11", polygon)

    test = calculate_gdd(st_landsat["tmax"].iloc[200], st_landsat["tmin"].iloc[200], 10.0, 35.0 )


    breakpoint()

if __name__ == "__main__":
    main()


    # Fetch surface temperature from Landsat data (Higher Resolution)
    stac_items_landsat = query_planetary_stac(MICROSOFT_PLANETARY_API_URL, "landsat-c2-l2", PolygonInput, "2025-01-01/2025-12-31", 10)

    # Get the min and max daily temperature
    st_landsat_daily_min_max_temp = calculate_surface_temperature_landsat(stac_items_landsat, "lwir11", PolygonInput)


from datetime import datetime
import geopandas as gpd
import pandas as pd
import planetary_computer
from pystac_client import Client
import pystac
import rasterio
from rasterio.merge import merge
from rasterio.windows import from_bounds
from shapely import Polygon, wkt
import shapely

MICROSOFT_PLANETARY_API_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"