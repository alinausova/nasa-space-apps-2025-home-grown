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

from climate import fetch_all_climate_data, latest_complete_year
from crop_database import CROP_DATABASE
from geometry import calculate_polygon_area_m2, calculate_polygon_centroid
from landsat import fetch_landsat, surface_heat
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
        include_monthly_temps: bool = True,
        use_landsat: bool = Query(True, description="Read Landsat surface temperature (false = NASA POWER only)"),
):
    """
    Get crop recommendations for a specific polygon area based on NASA climate data.

    Parameters:
    - polygon: Polygon coordinates defining the field area
    - year: Year to analyse (default: the latest complete year)
    - min_score: Minimum suitability score (0-100, default: 50)
    - limit: Maximum number of recommendations to return
    - include_monthly_temps: Include monthly average temperatures for the analysed year (default: True)
    - use_landsat: Read Landsat surface temperature over the plot (default: True)
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
    # Landsat is reported as surface heat; it does not change the NASA POWER data the scores use.
    logger.info(f"Fetching {year} data for ({center_lat:.5f}, {center_lon:.5f})")
    climate_data, landsat = await asyncio.gather(
        fetch_all_climate_data(center_lat, center_lon, year, include_multi_year=include_monthly_temps),
        fetch_landsat(polygon, year, enabled=use_landsat),
    )
    heat = surface_heat(landsat.readings, climate_data["primary_year_data"]) if landsat.status == "ok" else None
    logger.info(f"Landsat: {landsat.status}, {len(landsat.readings)} scenes")

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
            "landsat_surface_temp": heat is not None,
            "landsat_dates_available": len(landsat.readings),
        },
        "landsat": {
            "status": landsat.status,
            "scenes": [vars(r) for r in landsat.readings],
            "surface_heat": heat,
        },
        "climate_summary": {
            "avg_temp_max": round(climate_analysis["temperature_max"]["mean"], 1),
            "avg_temp_min": round(climate_analysis["temperature_min"]["mean"], 1),
            "annual_precipitation_mm": round(climate_analysis["precipitation"]["total_annual"], 1),
            "representative_sun_hours_daily": display_sunshine["adjusted_sun_hours"],
            "note": "Daily NASA POWER data for the plot's centre; Landsat surface temperature is reported separately under 'landsat'"
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
