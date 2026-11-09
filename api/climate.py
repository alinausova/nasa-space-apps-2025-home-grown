"""NASA POWER: fetching daily data and climate statistics."""
import logging
import statistics
from collections import defaultdict
from typing import Dict, List

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)


async def fetch_nasa_power_data(latitude: float, longitude: float, year: int = 2023) -> Dict:
    """
    Fetch climate data from NASA POWER API for a specific location and year.

    Args:
        latitude: Latitude in decimal degrees
        longitude: Longitude in decimal degrees
        year: Year to fetch data for

    Returns:
        Raw JSON response from NASA POWER API

    Raises:
        HTTPException: If API request fails
    """
    start_date = f"{year}0101"
    end_date = f"{year}1231"

    # Parameters: Solar radiation, Temperature, Precipitation
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M_MAX,T2M_MIN,PRECTOTCORR",
        "community": "AG",
        "latitude": latitude,
        "longitude": longitude,
        "start": start_date,
        "end": end_date,
        "format": "JSON"
    }

    url = "https://power.larc.nasa.gov/api/temporal/daily/point"

    headers = {
        "User-Agent": "SpaceAppsChallenge/1.0 (urban-agriculture-recommender)"
    }

    async with httpx.AsyncClient(timeout=60.0, headers=headers) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"NASA POWER API returned {e.response.status_code}: {e.response.reason_phrase}. "
                       f"The API may be temporarily unavailable or rate-limited. Please try again later."
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error connecting to NASA POWER API: {str(e)}. Please check your internet connection."
            )

async def fetch_all_climate_data(latitude: float, longitude: float, year: int,
                                 include_multi_year: bool = True) -> Dict:
    """
    Fetch and organize all required climate data for crop recommendations.

    This is the main data fetching function that orchestrates all API calls.

    Args:
        latitude: Location latitude
        longitude: Location longitude
        year: Primary year for analysis
        include_multi_year: Whether to fetch 3-year data for monthly averages

    Returns:
        Dictionary containing:
        - primary_year_data: NASA data for the specified year
        - climate_analysis: Analyzed climate metrics
        - monthly_averages: 3-year monthly temperature averages (if requested)
        - years_analyzed: List of years successfully fetched
    """
    # Fetch primary year data
    primary_data = await fetch_nasa_power_data(latitude, longitude, year)
    climate_analysis = analyze_climate_data(primary_data)

    result = {
        "primary_year_data": primary_data,
        "climate_analysis": climate_analysis,
        "monthly_averages": None,
        "years_analyzed": [year]
    }

    # Monthly averages come from the same year's data; no second request.
    # (Averaging over more years would mean fetching those years here.)
    if include_multi_year:
        result["monthly_averages"] = calculate_monthly_averages([primary_data])

    return result

def analyze_climate_data(nasa_data: Dict) -> Dict:
    """
    Analyze NASA POWER data to extract useful climate metrics.

    Args:
        nasa_data: Raw NASA POWER API response

    Returns:
        Dictionary with statistical analysis of temperature, precipitation, and solar radiation
    """
    properties = nasa_data.get("properties", {})
    parameters = properties.get("parameter", {})

    solar_data = parameters.get("ALLSKY_SFC_SW_DWN", {})
    temp_max_data = parameters.get("T2M_MAX", {})
    temp_min_data = parameters.get("T2M_MIN", {})
    precip_data = parameters.get("PRECTOTCORR", {})


    # Convert to lists for analysis
    solar_values = list(solar_data.values())
    temp_max_values = list(temp_max_data.values())
    temp_min_values = list(temp_min_data.values())
    precip_values = list(precip_data.values())

    # Calculate statistics
    analysis = {
        "solar_radiation": {
            "mean": statistics.mean(solar_values),
            "min": min(solar_values),
            "max": max(solar_values),
            "median": statistics.median(solar_values)
        },
        "temperature_max": {
            "mean": statistics.mean(temp_max_values),
            "min": min(temp_max_values),
            "max": max(temp_max_values),
            "median": statistics.median(temp_max_values)
        },
        "temperature_min": {
            "mean": statistics.mean(temp_min_values),
            "min": min(temp_min_values),
            "max": max(temp_min_values),
            "median": statistics.median(temp_min_values)
        },
        "precipitation": {
            "total_annual": sum(precip_values),
            "mean_daily": statistics.mean(precip_values),
            "max_daily": max(precip_values)
        }
    }

    return analysis

def calculate_monthly_averages(nasa_data_list: List[Dict]) -> Dict:
    """
    Calculate average monthly temperatures across multiple years.

    Args:
        nasa_data_list: List of NASA POWER data dictionaries for different years

    Returns:
        Dictionary with monthly averages for plotting
    """
    # Store temps by month across all years
    monthly_max_temps = defaultdict(list)
    monthly_min_temps = defaultdict(list)
    monthly_avg_temps = defaultdict(list)

    for nasa_data in nasa_data_list:
        parameters = nasa_data.get("properties", {}).get("parameter", {})
        temp_max_data = parameters.get("T2M_MAX", {})
        temp_min_data = parameters.get("T2M_MIN", {})

        # Process each day
        for date_key in temp_max_data.keys():
            if date_key in temp_min_data:
                # Extract month from date key (format: YYYYMMDD)
                month = int(date_key[4:6])

                temp_max = temp_max_data[date_key]
                temp_min = temp_min_data[date_key]
                temp_avg = (temp_max + temp_min) / 2

                monthly_max_temps[month].append(temp_max)
                monthly_min_temps[month].append(temp_min)
                monthly_avg_temps[month].append(temp_avg)

    # Calculate averages for each month
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    monthly_data = []
    for month in range(1, 13):
        if month in monthly_avg_temps:
            monthly_data.append({
                "month": month,
                "month_name": month_names[month - 1],
                "avg_temp_max": round(statistics.mean(monthly_max_temps[month]), 1),
                "avg_temp_min": round(statistics.mean(monthly_min_temps[month]), 1),
                "avg_temp": round(statistics.mean(monthly_avg_temps[month]), 1)
            })

    return {
        "monthly_averages": monthly_data,
        "years_analyzed": len(nasa_data_list)
    }
