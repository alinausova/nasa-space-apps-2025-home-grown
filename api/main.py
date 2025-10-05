"""CROP DATABASE TAKEN FROM https://www.sciencedirect.com/science/article/pii/S037837742500469X"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Dict, Optional, List, Tuple
import statistics

from summary_gen import generate_crop_summary
from crop_database import CROP_DATABASE
from pydantic import BaseModel, Field
import math
from collections import defaultdict
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


# next to Munich coordinates to tell that the NASA POWER data is not sufficient
OBERPFRAMMERN_LAT = 48.0216
OBERPFRAMMERN_LON = 11.8131

# ============================================================================
# GEOMETRY FUNCTIONS
# ============================================================================

def calculate_polygon_centroid(coordinates: List[Tuple[float, float]]) -> Tuple[float, float]:
    """
    Calculate the centroid (center point) of a polygon.

    Args:
        coordinates: List of (latitude, longitude) tuples

    Returns:
        Tuple of (latitude, longitude) for the centroid
    """
    lat_sum = sum(lat for lat, lon in coordinates)
    lon_sum = sum(lon for lat, lon in coordinates)
    count = len(coordinates)
    return (lat_sum / count, lon_sum / count)


def calculate_polygon_area_m2(coordinates: List[Tuple[float, float]]) -> float:
    """
    Calculate the area of a polygon in square meters using the Shoelace formula
    with equirectangular approximation for geographic coordinates.

    This method is accurate for small polygons (< 10 km per side). For larger areas,
    consider using a proper geographic projection.

    Args:
        coordinates: List of (latitude, longitude) tuples defining the polygon

    Returns:
        Area in square meters

    Algorithm:
    1. Convert lat/lon to planar coordinates using equirectangular projection
    2. Apply the Shoelace formula (also known as surveyor's formula)
    3. Return absolute area

    Reference: https://en.wikipedia.org/wiki/Shoelace_formula
    """
    if len(coordinates) < 3:
        return 0.0

    # Earth radius in meters (mean radius)
    EARTH_RADIUS = 6371000

    # Calculate center latitude for the equirectangular projection
    # This minimizes distortion for the local area
    center_lat = sum(lat for lat, lon in coordinates) / len(coordinates)
    center_lat_rad = math.radians(center_lat)

    # Convert geographic coordinates to planar meters using equirectangular approximation
    # x = R * λ * cos(φ₀)  where λ is longitude, φ₀ is center latitude
    # y = R * φ  where φ is latitude
    points_m = []
    for lat, lon in coordinates:
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)

        # Convert to meters from the reference meridian/parallel
        x = lon_rad * EARTH_RADIUS * math.cos(center_lat_rad)
        y = lat_rad * EARTH_RADIUS
        points_m.append((x, y))

    # Apply Shoelace formula: A = 1/2 * |Σ(x_i * y_{i+1} - x_{i+1} * y_i)|
    area = 0.0
    n = len(points_m)

    for i in range(n):
        j = (i + 1) % n  # Wrap around to first point
        area += points_m[i][0] * points_m[j][1]
        area -= points_m[j][0] * points_m[i][1]

    area = abs(area) / 2.0
    return area


# ============================================================================
# SUNSHINE CALCULATION FUNCTIONS
# ============================================================================

def calculate_growing_season_sunshine(nasa_raw_data: Dict, crop_base_temp: float,
                                      sunshine_factor: float = 1.0) -> Dict:
    """
    Calculate available sunshine hours during the crop's growing season only.

    This is the centralized function for all sunshine-related calculations.
    Key insight: We only care about sunshine when crops can actually grow!

    Args:
        nasa_raw_data: Raw NASA POWER data with daily temperature and solar radiation
        crop_base_temp: Crop's base temperature - growth only occurs above this
        sunshine_factor: Reduction factor for local shade/obstructions (0-1)
                        1.0 = full sun, 0.7 = 30% shaded, 0.5 = heavily shaded

    Returns:
        Dictionary containing:
        - estimated_sun_hours: Average sunshine during growing season (before shade)
        - adjusted_sun_hours: Final available sun hours after applying sunshine_factor
        - sunshine_factor: The factor that was applied
        - growing_days: Number of days when crop can grow
        - total_days: Total days in dataset
        - avg_solar_radiation: Average solar radiation during growing season (MJ/m²/day)

    Algorithm:
        1. Filter days where avg temp > crop base temp (growing season)
        2. Calculate sunshine only for those days
        3. Use improved conversion: 1 sunshine hour ≈ 0.35 kWh/m² (not 1.0)
           This accounts for the fact that average solar intensity during sunny
           hours is ~350 W/m², not 1000 W/m² (peak noon value)
    """
    parameters = nasa_raw_data.get("properties", {}).get("parameter", {})
    solar_data = parameters.get("ALLSKY_SFC_SW_DWN", {})
    temp_max_data = parameters.get("T2M_MAX", {})
    temp_min_data = parameters.get("T2M_MIN", {})

    # Collect sunshine hours only for growing days
    growing_season_sunshine = []
    growing_season_solar_rad = []
    total_days = 0

    for date_key in solar_data.keys():
        if date_key in temp_max_data and date_key in temp_min_data:
            total_days += 1

            # Calculate average temperature for the day
            avg_temp = (temp_max_data[date_key] + temp_min_data[date_key]) / 2

            # Only count days when crop can grow
            if avg_temp > crop_base_temp:
                solar_radiation_mjm2 = solar_data[date_key]

                # Improved conversion formula:
                # 1 sunshine hour ≈ 0.35 kWh/m² (average intensity during sunny periods)
                # This is more realistic than assuming peak intensity (1.0 kWh/m²)
                kwh_per_m2 = solar_radiation_mjm2 * 0.278  # MJ to kWh
                sunshine_hours = kwh_per_m2 / 0.35  # More accurate conversion

                # Cap at reasonable daylight hours (varies by season and latitude)
                sunshine_hours = max(0, min(16, sunshine_hours))

                growing_season_sunshine.append(sunshine_hours)
                growing_season_solar_rad.append(solar_radiation_mjm2)

    # Calculate averages for growing season
    if growing_season_sunshine:
        estimated_hours = statistics.mean(growing_season_sunshine)
        avg_solar_rad = statistics.mean(growing_season_solar_rad)
        growing_days = len(growing_season_sunshine)
    else:
        # No growing days - crop cannot grow here
        estimated_hours = 0
        avg_solar_rad = 0
        growing_days = 0

    # Apply sunshine factor to account for local obstructions
    adjusted_hours = estimated_hours * sunshine_factor

    return {
        "estimated_sun_hours": round(estimated_hours, 2),
        "adjusted_sun_hours": round(adjusted_hours, 2),
        "sunshine_factor": round(sunshine_factor, 2),
        "growing_days": growing_days,
        "total_days": total_days,
        "avg_solar_radiation": round(avg_solar_rad, 2)
    }


# ============================================================================
# GROWING DEGREE DAYS CALCULATION
# ============================================================================

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


# ============================================================================
# DATA FETCHING FUNCTIONS
# ============================================================================

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

    # Fetch multi-year data if requested
    if include_multi_year:
        nasa_data_multi_year = []
        years_fetched = []

        for y in [year]: # here we could potentially loop over more past years to get more reliable averages
            try:
                data = await fetch_nasa_power_data(latitude, longitude, y)
                nasa_data_multi_year.append(data)
                years_fetched.append(y)
            except Exception as e:
                # Log but continue with available years
                print(f"Warning: Could not fetch data for year {y}: {e}")

        if nasa_data_multi_year:
            result["monthly_averages"] = calculate_monthly_averages(nasa_data_multi_year)
            result["years_analyzed"] = years_fetched

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


# ============================================================================
# CROP SUITABILITY CALCULATIONS
# ============================================================================

def calculate_yield_estimate(crop_data: Dict, suitability_score: float, area_m2: float) -> Dict:
    """
    Calculate expected yield based on suitability score and area.

    Args:
        crop_data: Crop information from database
        suitability_score: Overall suitability score (0-100)
        area_m2: Growing area in square meters

    Returns:
        Dictionary with yield estimates and categorization
    """
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
        ratio = (suitability_score - 80) / 10
        yield_per_m2 = avg_yield + (upper_yield - avg_yield) * ratio
        yield_category = "Average to Upper"
    elif suitability_score >= 70:
        # Moderate-good conditions - interpolate between lower and average
        ratio = (suitability_score - 70) / 10
        yield_per_m2 = lower_yield + (avg_yield - lower_yield) * ratio
        yield_category = "Lower to Average"
    elif suitability_score >= 50:
        # Marginal conditions - use lower bound with reduction
        ratio = (suitability_score - 50) / 20
        yield_per_m2 = lower_yield * (0.5 + 0.5 * ratio)
        yield_category = "Below Lower (Challenging conditions)"
    else:
        # Poor conditions - minimal yield
        yield_per_m2 = lower_yield * 0.5 * (suitability_score / 50)
        yield_category = "Minimal (Poor conditions)"

    # Calculate total yield (0.7 factor accounts for walkways, equipment, etc.)
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


def calculate_crop_suitability(crop_data: Dict, climate_analysis: Dict,
                               nasa_raw_data: Dict, sunshine_factor: float = 1.0,
                               area_m2: float = None) -> Dict:
    """
    Calculate suitability score for a specific crop based on climate data.

    Args:
        crop_data: Crop information from database
        climate_analysis: Analyzed climate data
        nasa_raw_data: Raw NASA POWER data (for GDD calculation and growing-season sunshine)
        sunshine_factor: Factor to adjust available sunshine (0-1) for shade/obstructions
        area_m2: Area in square meters (optional, for yield estimation)

    Returns:
        Dictionary with suitability scores, metrics, and optional yield estimate
    """
    # Extract climate metrics
    avg_temp_max = climate_analysis["temperature_max"]["mean"]
    avg_temp_min = climate_analysis["temperature_min"]["mean"]
    annual_precip = climate_analysis["precipitation"]["total_annual"]

    # Calculate sunshine during growing season only (when crop can actually grow)
    sunshine_data = calculate_growing_season_sunshine(
        nasa_raw_data,
        crop_data["base_temp"],
        sunshine_factor
    )
    adjusted_sun_hours = sunshine_data["adjusted_sun_hours"]

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

    # Sun Hours Score - using adjusted sun hours from growing season
    # Use optimal_sun_hours for scoring (what the crop ideally wants)
    sun_ratio = adjusted_sun_hours / crop_data["optimal_sun_hours"]
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
    irrigation_needed = max(0, required_water - annual_precip)

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
            "estimated_sun_hours": sunshine_data["estimated_sun_hours"],
            "adjusted_sun_hours": sunshine_data["adjusted_sun_hours"],
            "sunshine_factor": sunshine_data["sunshine_factor"],
            "growing_days": sunshine_data["growing_days"],
            "min_sun_hours": crop_data["min_sun_hours"],
            "optimal_sun_hours": crop_data["optimal_sun_hours"],
            "annual_precipitation_mm": round(annual_precip, 1),
            "required_water_mm": required_water,
            "irrigation_needed_mm": round(irrigation_needed, 1)
        }
    }

    # Add yield estimate if area is provided
    if area_m2 is not None:
        result["yield_estimate"] = calculate_yield_estimate(crop_data, overall_score, area_m2)

    return result


# ============================================================================
# CROP RECOMMENDATION PROCESSING
# ============================================================================

def process_crop_recommendations(climate_data: Dict, sunshine_factor: float,
                                 area_m2: float, min_score: float = 50.0) -> Dict:
    """
    Process all crops and generate recommendations based on climate suitability.

    This is the main processing function that evaluates all crops.

    Args:
        climate_data: Climate data from fetch_all_climate_data()
        sunshine_factor: Sunshine adjustment factor for shade/obstructions
        area_m2: Growing area in square meters
        min_score: Minimum suitability score threshold

    Returns:
        Dictionary containing:
        - recommendations: List of suitable crops sorted by score
        - filtered_crops: List of crops excluded due to insufficient sunlight
        - total_suitable: Count of suitable crops
        - total_filtered: Count of filtered crops
    """
    climate_analysis = climate_data["climate_analysis"]
    nasa_raw_data = climate_data["primary_year_data"]

    recommendations = []
    filtered_crops = []

    for crop_id, crop_data in CROP_DATABASE.items():
        # Calculate growing-season sunshine for this specific crop
        # (each crop has different base temp, so growing season differs)
        sunshine_data = calculate_growing_season_sunshine(
            nasa_raw_data,
            crop_data["base_temp"],
            sunshine_factor
        )
        adjusted_sun_hours = sunshine_data["adjusted_sun_hours"]

        # Check if crop meets MINIMUM sunlight requirement
        # Use min_sun_hours directly from database (no approximation)
        if adjusted_sun_hours < crop_data["min_sun_hours"]:
            print(f"Filtered crop {crop_id} due to sunlight adjustment {adjusted_sun_hours}<{crop_data['min_sun_hours']}")
            # Crop doesn't have enough sunlight - skip it
            filtered_crops.append({
                "crop_id": crop_id,
                "crop_name": crop_data["name"],
                "reason": "insufficient_sunlight",
                "min_sun_hours": crop_data["min_sun_hours"],
                "available_sun_hours": round(adjusted_sun_hours, 1),
                "growing_days": sunshine_data["growing_days"]
            })
            continue

        # Calculate suitability
        suitability = calculate_crop_suitability(
            crop_data, climate_analysis, nasa_raw_data, sunshine_factor, area_m2
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

    return {
        "recommendations": recommendations,
        "filtered_crops": filtered_crops,
        "total_suitable": len(recommendations),
        "total_filtered": len(filtered_crops)
    }


# ============================================================================
# API ENDPOINTS
# ============================================================================

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
    climate_data = await fetch_all_climate_data(MUNICH_LAT, MUNICH_LON, year, include_multi_year=False)

    # Calculate sunshine for a moderate base temp (10°C) for display purposes
    sunshine_data = calculate_growing_season_sunshine(
        climate_data["primary_year_data"],
        crop_base_temp=10.0,
        sunshine_factor=1.0
    )

    return {
        "location": {
            "city": "Munich",
            "latitude": OBERPFRAMMERN_LAT,
            "longitude": OBERPFRAMMERN_LON
        },
        "year": year,
        "climate_analysis": climate_data["climate_analysis"],
        "sunshine_analysis": {
            **sunshine_data,
            "note": "Calculated for growing season when avg temp > 10°C"
        },
        "data_source": "NASA POWER API",
        "raw_data_sample": {
            "note": "First 7 days of data as example",
            "parameters": {
                param: dict(list(values.items())[:7])
                for param, values in climate_data["primary_year_data"].get("properties", {}).get("parameter", {}).items()
            }
        }
    }


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

    # ========== GEOMETRY CALCULATIONS ==========
    center_lat, center_lon = calculate_polygon_centroid(polygon.coordinates)
    area_m2 = calculate_polygon_area_m2(polygon.coordinates)
    area_hectares = area_m2 / 10000

    # ========== AREA VALIDATION ==========
    MAX_AREA_M2 = 1000000  # 1 km²
    if area_m2 > MAX_AREA_M2:
        raise HTTPException(
            status_code=400,
            detail=f"Selection area is too large. Maximum allowed: {MAX_AREA_M2} m² ({MAX_AREA_M2/1_000_000:.2f} km²). "
                   f"Your selection: {area_m2:.2f} m² ({area_m2/1_000_000:.4f} km²). "
                   f"Please select a smaller area."
        )

    # ========== SUNSHINE FACTOR CALCULATION ==========
    if polygon.sunshine_duration is not None and len(polygon.sunshine_duration) > 0:
        sunshine_factor = statistics.mean(polygon.sunshine_duration)
    else:
        sunshine_factor = 0.7  # Default value

    # ========== DATA FETCHING ==========
    climate_data = await fetch_all_climate_data(
        center_lat, center_lon, year, include_multi_year=include_monthly_temps
    )

    # ========== CROP PROCESSING ==========
    # Note: Sunshine calculation is now done per-crop during processing
    # because each crop has different growing seasons (different base temps)
    crop_results = process_crop_recommendations(
        climate_data, sunshine_factor, area_m2, min_score
    )

    # ========== RESPONSE CONSTRUCTION ==========
    climate_analysis = climate_data["climate_analysis"]

    # Calculate a representative sunshine value for display (using moderate base temp of 10°C)
    # This gives a general sense of sunshine availability
    display_sunshine = calculate_growing_season_sunshine(
        climate_data["primary_year_data"],
        crop_base_temp=10.0,  # Representative moderate base temp
        sunshine_factor=sunshine_factor
    )

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
            "representative_sun_hours_daily": display_sunshine["adjusted_sun_hours"],
            "note": "Sunshine shown for growing season when avg temp > 10°C. Each crop has specific sunshine calculated for its growing season."
        },
        "recommendations": crop_results["recommendations"][:limit],
        "total_suitable_crops": crop_results["total_suitable"],
        "total_filtered_by_sunlight": crop_results["total_filtered"],
        "data_source": "NASA POWER API"
    }

    # Add monthly temperature data if available
    if climate_data["monthly_averages"]:
        response["monthly_temperature_averages"] = climate_data["monthly_averages"]
    try:
        llm_summary = generate_crop_summary(response)
        response["llm_summary"] = llm_summary
    except Exception as e:
        response["llm_summary"] = "The LLM in charge of assembling your summary was asleep. We did not want to wake it."
        response["llm_err"] = str(e)

    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)