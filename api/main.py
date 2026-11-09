"""Home Grown API: routes and app setup. Logic lives in the climate, landsat, scoring and geometry modules."""
import asyncio
import logging
import os
import statistics
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from climate import analyze_climate_data, fetch_all_climate_data, latest_complete_year
from crop_database import CROP_DATABASE
from geometry import calculate_polygon_area_m2, calculate_polygon_centroid
from landsat import (
    MICROSOFT_PLANETARY_API_URL,
    calculate_surface_temperature_landsat,
    merge_climate_data,
    query_planetary_stac_async,
)
from models import PolygonInput
from scoring import calculate_growing_season_sunshine, process_crop_recommendations
from summary_gen import generate_crop_summary

load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("home_grown")


def client_ip(request: Request) -> str:
    """Rate-limit key. Render sits behind a proxy, so prefer the first X-Forwarded-For address."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


RECOMMENDATION_RATE_LIMIT = os.getenv("RECOMMENDATION_RATE_LIMIT", "20/minute")
limiter = Limiter(key_func=client_ip)

app = FastAPI(title="Home Grown API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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


@app.post("/recommendations/polygon")
@limiter.limit(RECOMMENDATION_RATE_LIMIT)
async def get_polygon_crop_recommendations(
        request: Request,
        polygon: PolygonInput,
        year: int | None = Query(None, ge=1984, le=datetime.now().year - 1, description="Defaults to the latest complete year"),
        min_score: float = Query(50.0, ge=0, le=100),
        limit: int = Query(10, ge=1, le=50),
        include_monthly_temps: bool = True
):
    """
    Get crop recommendations for a specific polygon area based on NASA climate data.

    Parameters:
    - polygon: Polygon coordinates defining the field area
    - year: Year to analyse (default: the latest complete year)
    - min_score: Minimum suitability score (0-100, default: 50)
    - limit: Maximum number of recommendations to return
    - include_monthly_temps: Include monthly average temperatures for the analysed year (default: True)
    """

    year = year or latest_complete_year()

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

    # ========== PARALLEL DATA FETCHING ==========
    logger.info("\n=== STARTING PARALLEL DATA FETCH ===")
    logger.info(f"Fetching data for year: {year}")
    logger.info(f"Location: ({center_lat}, {center_lon})")
    # Create time range for Landsat query using the correct year
    landsat_time_range = f"{year}-01-01/{year}-12-31"
    logger.info(f"Landsat time range: {landsat_time_range}")
    # Fetch both data sources in parallel
    nasa_task = fetch_all_climate_data(center_lat, center_lon, year, include_multi_year=include_monthly_temps)
    landsat_task = query_planetary_stac_async(
        MICROSOFT_PLANETARY_API_URL,
        "landsat-c2-l2",
        polygon,
        landsat_time_range,
        10  # max cloud coverage
    )

    # Wait for both to complete
    climate_data, stac_items_landsat = await asyncio.gather(nasa_task, landsat_task)

    logger.debug("NASA data fetched successfully")
    # Check if Landsat data was successfully fetched
    if stac_items_landsat is None:
        logger.warning("Landsat data unavailable, continuing with NASA POWER data only")
    else:
        logger.debug(f"Landsat items found: {len(stac_items_landsat)}")
    # ========== PROCESS LANDSAT DATA ==========
    st_landsat_daily_min_max_temp = None
    try:
        if stac_items_landsat is not None and len(stac_items_landsat) > 0:
            # Remote raster reads: keep them off the event loop.
            st_landsat_daily_min_max_temp = await asyncio.to_thread(
                calculate_surface_temperature_landsat,
                stac_items_landsat,
                "lwir",
                polygon
            )
            logger.debug(f"Landsat DataFrame shape: {st_landsat_daily_min_max_temp.shape}")
            logger.debug(f"Landsat date range: {st_landsat_daily_min_max_temp.index.min()} to {st_landsat_daily_min_max_temp.index.max()}")
            logger.debug(f"Landsat sample data:\n{st_landsat_daily_min_max_temp.head()}")
            # ========== MERGE DATA SOURCES ==========
            climate_data["primary_year_data"] = merge_climate_data(
                climate_data["primary_year_data"],
                st_landsat_daily_min_max_temp,
                year
            )

            # Re-analyze climate data after merge
            climate_data["climate_analysis"] = analyze_climate_data(climate_data["primary_year_data"])
        else:
            logger.warning("No Landsat data found for the specified area and time range")
    except Exception as e:
        logger.warning(f"Landsat processing failed, falling back to NASA POWER only. Error: {e}")
        st_landsat_daily_min_max_temp = None

    # ========== CROP PROCESSING ==========
    crop_results = process_crop_recommendations(
        climate_data, sunshine_factor, area_m2, min_score
    )

    # ========== RESPONSE CONSTRUCTION ==========
    climate_analysis = climate_data["climate_analysis"]

    # Calculate a representative sunshine value for display
    display_sunshine = calculate_growing_season_sunshine(
        climate_data["primary_year_data"],
        crop_base_temp=10.0,
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
        "data_sources": {
            "nasa_power": True,
            "landsat_surface_temp": st_landsat_daily_min_max_temp is not None,
            "landsat_dates_available": len(st_landsat_daily_min_max_temp) if st_landsat_daily_min_max_temp is not None else 0
        },
        "climate_summary": {
            "avg_temp_max": round(climate_analysis["temperature_max"]["mean"], 1),
            "avg_temp_min": round(climate_analysis["temperature_min"]["mean"], 1),
            "annual_precipitation_mm": round(climate_analysis["precipitation"]["total_annual"], 1),
            "representative_sun_hours_daily": display_sunshine["adjusted_sun_hours"],
            "note": "Temperatures merged from NASA POWER (coarse) and Landsat (fine-grained) where available"
        },
        "recommendations": crop_results["recommendations"][:limit],
        "total_suitable_crops": crop_results["total_suitable"],
        "total_filtered_by_sunlight": crop_results["total_filtered"],
    }

    # Add monthly temperature data if available
    if climate_data["monthly_averages"]:
        response["monthly_temperature_averages"] = climate_data["monthly_averages"]

    try:
        llm_summary = await asyncio.to_thread(generate_crop_summary, response)
        response["llm_summary"] = llm_summary
    except Exception as e:
        response["llm_summary"] = "The LLM in charge of assembling your summary was asleep. We did not want to wake it."
        response["llm_err"] = str(e)

    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
