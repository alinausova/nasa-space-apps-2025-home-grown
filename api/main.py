"""CROP DATABASE TAKEN FROM https://www.sciencedirect.com/science/article/pii/S037837742500469X"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Dict, Optional
import statistics
from crop_database import CROP_DATABASE
from pydantic import BaseModel, Field, field_validator
from typing import List, Tuple
import math
from collections import defaultdict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

load_dotenv()


class PolygonInput(BaseModel):
    """Polygon with coordinate points [(lat, lon), ...]"""
    coordinates: List[Tuple[float, float]] = Field(..., min_length=3,
                                                   description="List of (latitude, longitude) tuples")
    sunshine_duration: Optional[List[float]] = Field(None,
                                                     description="List of sunshine duration factors (0-1) for each point. If not provided, defaults to 0.7")


app = FastAPI(title="Home Grown API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://alinausova.github.io",  # GitHub Pages
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "status": "healthy",
        "message": "Home Grown API is running",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.get("/api/example")
async def example_endpoint():
    """Example endpoint demonstrating response structure"""
    return {
        "message": "This is an example endpoint",
        "data": {
            "sample": "data",
            "nested": {
                "value": 123
            }
        }
    }


@app.get("/api/external-example")
async def external_api_example():
    """
    Example endpoint that calls an external API
    Replace this with actual NASA API calls
    """
    try:
        async with httpx.AsyncClient() as client:
            # Example: Replace with NASA API endpoint
            response = await client.get(
                "https://api.github.com/zen",
                timeout=30.0  # No timeout limits on Render!
            )
            return {
                "success": True,
                "data": response.text,
                "status_code": response.status_code
            }
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "External API request timed out"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Example endpoint with caching (implement with Redis or in-memory for production)
_cache = {}


@app.get("/api/cached-data")
async def get_cached_data():
    """
    Example of cached data endpoint
    In production, use Redis or proper caching library
    """
    if "data" in _cache:
        return {
            "cached": True,
            "data": _cache["data"]
        }

    # Simulate fetching from external API
    data = {"timestamp": "2025-10-04", "value": 42}
    _cache["data"] = data

    return {
        "cached": False,
        "data": data
    }


# Munich coordinates
MUNICH_LAT = 48.1351
MUNICH_LON = 11.5820


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


def estimate_sun_hours(solar_radiation: float) -> float:
    """
    Estimate daily sun hours from solar radiation.
    Rough conversion: 1 kWh/m²/day ≈ 1 hour of full sun
    NASA POWER provides MJ/m²/day, convert to kWh/m²/day (1 MJ = 0.278 kWh)
    but with 0.278 the atacama desert got only 5 hours of sunshine
    so lets assume 0.5

    This does not yet include the shade casted by buildings, todo we need to offset this with a shade index.
    """
    kwh_per_m2_day = solar_radiation * 0.5
    estimated_hours = kwh_per_m2_day / 1.0  # Assuming 1 kW/m² as "full sun"
    return max(0, min(16, estimated_hours))  # Cap at reasonable daylight hours


async def fetch_nasa_power_data(latitude: float, longitude: float, year: int = 2023) -> Dict:
    """Fetch climate data from NASA POWER API."""
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

    # Add User-Agent header (some APIs require this)
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


def analyze_climate_data(nasa_data: Dict) -> Dict:
    """Analyze NASA POWER data to extract useful metrics."""
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
        },
        "estimated_sun_hours_daily": estimate_sun_hours(statistics.mean(solar_values))
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


@app.get("/crops")
async def list_crops():
    """List all available crops in the database."""
    return {
        "crops": [
            {
                "id": crop_id,
                **crop_data
            }
            for crop_id, crop_data in CROP_DATABASE.items()
        ]
    }


@app.get("/climate-data")
async def get_climate_data(year: int = 2023):
    """
    Fetch and analyze climate data for Munich from NASA POWER API.
    """
    nasa_data = await fetch_nasa_power_data(MUNICH_LAT, MUNICH_LON, year)
    climate_analysis = analyze_climate_data(nasa_data)

    return {
        "location": {
            "city": "Munich",
            "latitude": MUNICH_LAT,
            "longitude": MUNICH_LON
        },
        "year": year,
        "climate_analysis": climate_analysis,
        "data_source": "NASA POWER API",
        "raw_data_sample": {
            "note": "First 7 days of data as example",
            "parameters": {
                param: dict(list(values.items())[:7])
                for param, values in nasa_data.get("properties", {}).get("parameter", {}).items()
            }
        }
    }


# we need this to make the request to NASA POWER
def calculate_polygon_centroid(coordinates: List[Tuple[float, float]]) -> Tuple[float, float]:
    """
    Calculate the centroid (center point) of a polygon.
    Returns (latitude, longitude)
    """
    lat_sum = sum(lat for lat, lon in coordinates)
    lon_sum = sum(lon for lat, lon in coordinates)
    count = len(coordinates)

    return (lat_sum / count, lon_sum / count)


# we need this to calculate the average projected yield
def calculate_polygon_area_m2(coordinates: List[Tuple[float, float]]) -> float:
    """
    Calculate the area of a polygon in square meters using the Shoelace formula
    with geographic coordinates. Uses equirectangular approximation.

    Args:
        coordinates: List of (latitude, longitude) tuples

    Returns:
        Area in square meters
    """
    if len(coordinates) < 3:
        return 0.0

    # Earth radius in meters
    EARTH_RADIUS = 6371000

    # Get approximate center latitude for the projection
    center_lat = sum(lat for lat, lon in coordinates) / len(coordinates)
    center_lat_rad = math.radians(center_lat)

    # Convert lat/lon to meters using equirectangular approximation
    points_m = []
    for lat, lon in coordinates:
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)

        # Convert to meters from center
        x = lon_rad * EARTH_RADIUS * math.cos(center_lat_rad)
        y = lat_rad * EARTH_RADIUS
        points_m.append((x, y))

    # Apply Shoelace formula
    area = 0.0
    n = len(points_m)

    for i in range(n):
        j = (i + 1) % n
        area += points_m[i][0] * points_m[j][1]
        area -= points_m[j][0] * points_m[i][1]

    area = abs(area) / 2.0
    return area


# this is the updated version with the actual precipitation values per veggie
def calculate_yield_estimate(crop_data: Dict, suitability_score: float, area_m2: float) -> Dict:
    """Calculate expected yield based on suitability score and area."""

    # Get yield boundaries from crop data
    lower_yield = crop_data.get("yield_kg_m2_lower", 0)
    avg_yield = crop_data.get("yield_kg_m2_average", 0)
    upper_yield = crop_data.get("yield_kg_m2_upper", 0)

    # Determine yield per m2 based on suitability score
    if suitability_score >= 90:
        # Excellent conditions - use upper bound
        yield_per_m2 = upper_yield
        yield_category = "Upper (Optimal conditions)"
    elif suitability_score >= 80:
        # Good conditions - interpolate between average and upper
        # Linear interpolation: at 80% use average, at 90% use upper
        ratio = (suitability_score - 80) / 10
        yield_per_m2 = avg_yield + (upper_yield - avg_yield) * ratio
        yield_category = "Average to Upper"
    elif suitability_score >= 70:
        # Moderate-good conditions - interpolate between lower and average
        # Linear interpolation: at 70% use lower, at 80% use average
        ratio = (suitability_score - 70) / 10
        yield_per_m2 = lower_yield + (avg_yield - lower_yield) * ratio
        yield_category = "Lower to Average"
    elif suitability_score >= 50:
        # Marginal conditions - use lower bound with reduction
        # Linear decrease: at 70% use lower, at 50% use 50% of lower
        ratio = (suitability_score - 50) / 20
        yield_per_m2 = lower_yield * (0.5 + 0.5 * ratio)
        yield_category = "Below Lower (Challenging conditions)"
    else:
        # Poor conditions - minimal yield
        yield_per_m2 = lower_yield * 0.5 * (suitability_score / 50)
        yield_category = "Minimal (Poor conditions)"

    # Calculate total yield for the area, area is corrected by 0.7 (walkways, equipment,..)
    total_yield_kg = yield_per_m2 * area_m2 * 0.70

    return {
        "yield_per_m2_kg": round(yield_per_m2, 2),
        "total_yield_kg": round(total_yield_kg, 2),
        "total_yield_tons": round(total_yield_kg / 1000, 3),
        "yield_category": yield_category,
        "yield_range": {
            "lower_kg_m2": lower_yield,
            "average_kg_m2": avg_yield,
            "upper_kg_m2": upper_yield
        }
    }


def calculate_crop_suitability_with_water(crop_data: Dict, climate_analysis: Dict,
                                          nasa_raw_data: Dict, area_m2: float = None,
                                          sunshine_factor: float = 1.0) -> Dict:
    """Calculate suitability score for a specific crop based on climate data with actual water requirements.

    Args:
        crop_data: Crop information from database
        climate_analysis: Analyzed climate data
        nasa_raw_data: Raw NASA POWER data
        area_m2: Area in square meters (optional)
        sunshine_factor: Factor to adjust available sunshine (0-1), accounts for shade from buildings etc.
    """

    # Extract climate metrics
    avg_temp_max = climate_analysis["temperature_max"]["mean"]
    avg_temp_min = climate_analysis["temperature_min"]["mean"]
    avg_sun_hours = climate_analysis["estimated_sun_hours_daily"]
    annual_precip = climate_analysis["precipitation"]["total_annual"]

    # Apply sunshine factor to account for shade, obstructions, etc.
    adjusted_sun_hours = avg_sun_hours * sunshine_factor

    # Calculate total GDD for the year
    parameters = nasa_raw_data.get("properties", {}).get("parameter", {})
    temp_max_data = parameters.get("T2M_MAX", {})
    temp_min_data = parameters.get("T2M_MIN", {})

    total_gdd = 0
    for date_key in temp_max_data.keys():
        if date_key in temp_min_data:
            gdd = calculate_gdd(
                temp_max_data[date_key],
                temp_min_data[date_key],
                crop_data["base_temp"],
                crop_data["upper_temp"]
            )
            total_gdd += gdd

    # Score components (0-100 each)
    scores = {}

    # GDD Score
    gdd_ratio = total_gdd / crop_data["gdd_required"]
    if gdd_ratio >= 1.0:
        scores["gdd"] = 100
    elif gdd_ratio >= 0.8:
        scores["gdd"] = 80 + (gdd_ratio - 0.8) * 100
    else:
        scores["gdd"] = gdd_ratio * 100

    # Sun Hours Score - using adjusted sun hours
    sun_ratio = adjusted_sun_hours / crop_data["min_sun_hours"]
    scores["sunlight"] = min(100, sun_ratio * 100)

    # Temperature Range Score
    avg_temp = (avg_temp_max + avg_temp_min) / 2
    optimal_mid = (crop_data["optimal_temp_min"] + crop_data["optimal_temp_max"]) / 2
    temp_diff = abs(avg_temp - optimal_mid)

    if temp_diff <= 3:
        scores["temperature"] = 100
    elif temp_diff <= 6:
        scores["temperature"] = 80
    elif temp_diff <= 10:
        scores["temperature"] = 60
    else:
        scores["temperature"] = max(0, 60 - (temp_diff - 10) * 5)

    # Water availability score using actual crop requirements
    required_water = crop_data.get("seasonal_water_mm", 500)
    water_diff = abs(annual_precip - required_water)

    # Calculate irrigation needs
    irrigation_needed = max(0, required_water - annual_precip)

    # Score based on how close precipitation is to requirements
    if water_diff <= 50:
        scores["water"] = 100
    elif water_diff <= 150:
        scores["water"] = 90 - ((water_diff - 50) / 100) * 20
    elif water_diff <= 300:
        scores["water"] = 70 - ((water_diff - 150) / 150) * 30
    else:
        scores["water"] = max(20, 40 - ((water_diff - 300) / 100) * 5)

    # Drought resistance adjustment
    drought_resistance = crop_data.get("drought_resistance", "moderate")
    if drought_resistance in ["tolerant", "moderate_tolerant"] and irrigation_needed > 0:
        scores["water"] = min(100, scores["water"] * 1.1)
    elif drought_resistance in ["sensitive"] and irrigation_needed > 100:
        scores["water"] = scores["water"] * 0.9

    # Overall suitability (weighted average)
    overall_score = (
            scores["gdd"] * 0.35 +
            scores["sunlight"] * 0.25 +
            scores["temperature"] * 0.25 +
            scores["water"] * 0.15
    )

    # Determine suitability category
    if overall_score >= 80:
        category = "Excellent"
    elif overall_score >= 65:
        category = "Good"
    elif overall_score >= 50:
        category = "Moderate"
    else:
        category = "Poor"

    result = {
        "overall_score": round(overall_score, 1),
        "category": category,
        "scores": {k: round(v, 1) for k, v in scores.items()},
        "metrics": {
            "total_gdd": round(total_gdd, 1),
            "required_gdd": crop_data["gdd_required"],
            "avg_sun_hours": round(avg_sun_hours, 1),
            "adjusted_sun_hours": round(adjusted_sun_hours, 1),
            "sunshine_factor": round(sunshine_factor, 2),
            "required_sun_hours": crop_data["min_sun_hours"],
            "annual_precipitation_mm": round(annual_precip, 1),
            "required_water_mm": required_water,
            "irrigation_needed_mm": round(irrigation_needed, 1)
        }
    }

    # Add yield estimate if area is provided
    if area_m2 is not None:
        result["yield_estimate"] = calculate_yield_estimate(crop_data, overall_score, area_m2)

    return result


@app.post("/recommendations/polygon")
async def get_polygon_crop_recommendations(
        polygon: PolygonInput,
        year: int = 2023,
        min_score: float = 50.0,
        limit: int = 10,
        include_monthly_temps: bool = True
):
    """
    Get crop recommendations for a specific polygon area based on NASA climate data.

    Parameters:
    - polygon: Polygon coordinates defining the field area
    - year: Year to analyze (default: 2023)
    - min_score: Minimum suitability score (0-100, default: 50)
    - limit: Maximum number of recommendations to return
    - include_monthly_temps: Include 3-year average monthly temperatures (default: True)
    """

    # Calculate polygon center and area
    center_lat, center_lon = calculate_polygon_centroid(polygon.coordinates)
    area_m2 = calculate_polygon_area_m2(polygon.coordinates)
    area_hectares = area_m2 / 10000

    # Calculate average sunshine factor
    if polygon.sunshine_duration is not None and len(polygon.sunshine_duration) > 0:
        sunshine_factor = statistics.mean(polygon.sunshine_duration)
    else:
        sunshine_factor = 0.7  # Default value

    # Fetch NASA POWER data for the specified year
    nasa_data = await fetch_nasa_power_data(center_lat, center_lon, year)
    climate_analysis = analyze_climate_data(nasa_data)

    # Calculate adjusted sun hours for filtering
    avg_sun_hours = climate_analysis["estimated_sun_hours_daily"]
    adjusted_sun_hours = avg_sun_hours * sunshine_factor

    # Fetch multi-year data for monthly averages if requested
    monthly_temperature_data = None
    if include_monthly_temps:
        # Fetch data for the last 3 years
        nasa_data_multi_year = []
        for y in [year - 2, year - 1, year]:
            try:
                data = await fetch_nasa_power_data(center_lat, center_lon, y)
                nasa_data_multi_year.append(data)
            except Exception as e:
                # If we can't fetch a year, continue with what we have
                print(f"Warning: Could not fetch data for year {y}: {e}")

        if nasa_data_multi_year:
            monthly_temperature_data = calculate_monthly_averages(nasa_data_multi_year)

    # Calculate suitability for each crop
    recommendations = []
    filtered_crops = []  # Track crops filtered out due to insufficient sunlight

    for crop_id, crop_data in CROP_DATABASE.items():
        # Check if crop meets minimum sunlight threshold (80% of required)
        min_required_sun_hours = crop_data["min_sun_hours"] * 0.8

        if adjusted_sun_hours < min_required_sun_hours:
            # Crop doesn't have enough sunlight - skip it
            filtered_crops.append({
                "crop_id": crop_id,
                "crop_name": crop_data["name"],
                "reason": "insufficient_sunlight",
                "required_sun_hours": crop_data["min_sun_hours"],
                "available_sun_hours": round(adjusted_sun_hours, 1),
                "threshold_sun_hours": round(min_required_sun_hours, 1)
            })
            continue

        # Calculate suitability with sunshine factor
        suitability = calculate_crop_suitability_with_water(
            crop_data, climate_analysis, nasa_data, area_m2, sunshine_factor
        )

        if suitability["overall_score"] >= min_score:
            recommendations.append({
                "crop_id": crop_id,
                "crop_name": crop_data["name"],
                "season": crop_data["season"],
                "frost_tolerance": crop_data["frost_tolerance"],
                "drought_resistance": crop_data.get("drought_resistance", "unknown"),
                "suitability": suitability
            })

    # Sort by overall score
    recommendations.sort(key=lambda x: x["suitability"]["overall_score"], reverse=True)

    response = {
        "location": {
            "center_latitude": round(center_lat, 6),
            "center_longitude": round(center_lon, 6),
            "area_m2": round(area_m2, 2),
            "area_hectares": round(area_hectares, 4)
        },
        "year": year,
        "sunshine_factor": round(sunshine_factor, 2),
        "climate_summary": {
            "avg_temp_max": round(climate_analysis["temperature_max"]["mean"], 1),
            "avg_temp_min": round(climate_analysis["temperature_min"]["mean"], 1),
            "annual_precipitation_mm": round(climate_analysis["precipitation"]["total_annual"], 1),
            "avg_sun_hours_daily": round(avg_sun_hours, 1),
            "adjusted_sun_hours_daily": round(adjusted_sun_hours, 1)
        },
        "recommendations": recommendations[:limit],
        "total_suitable_crops": len(recommendations),
        "total_filtered_by_sunlight": len(filtered_crops),
        "data_source": "NASA POWER API"
    }

    # Add monthly temperature data if available
    if monthly_temperature_data:
        response["monthly_temperature_averages"] = monthly_temperature_data

    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)