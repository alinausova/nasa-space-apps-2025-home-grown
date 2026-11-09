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
from landsat import LandsatResult, fetch_landsat, surface_heat
from analysis import PlotCache, climate_block, crops_block, legacy_summary_input, plot_id
from models import CropsRequest, PlotRef, PolygonInput
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
SUMMARY_RATE_LIMIT = os.getenv("SUMMARY_RATE_LIMIT", "10/minute")
MAX_AREA_M2 = 1_000_000  # 1 km²
plot_cache = PlotCache()
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


def check_area(area_m2: float) -> None:
    if area_m2 > MAX_AREA_M2:
        raise HTTPException(
            status_code=400,
            detail=f"Selection area is too large. Maximum allowed: {MAX_AREA_M2} m² ({MAX_AREA_M2/1_000_000:.2f} km²). "
                   f"Your selection: {area_m2:.2f} m² ({area_m2/1_000_000:.4f} km²). "
                   f"Please select a smaller area."
        )


def sunshine_factor_of(polygon: PolygonInput) -> float:
    """Mean of the per-point shade factors, or 0.7 (30% of sunlight assumed lost to buildings)."""
    return statistics.mean(polygon.sunshine_duration) if polygon.sunshine_duration else 0.7


def cached_plot(pid: str) -> dict:
    entry = plot_cache.get(pid)
    if entry is None:
        raise HTTPException(status_code=404, detail="This plot is no longer in memory. Please analyse it again.")
    return entry


@app.post("/analysis/climate")
@limiter.limit(RECOMMENDATION_RATE_LIMIT)
async def analysis_climate(
        request: Request,
        polygon: PolygonInput,
        year: int | None = Query(None, ge=1984, le=datetime.now().year - 1, description="Defaults to the latest complete year"),
):
    """Step 1: measure the plot and read a year of NASA POWER climate. Returns a plot_id for the next steps."""
    year = year or latest_complete_year()
    center_lat, center_lon = calculate_polygon_centroid(polygon.coordinates)
    area_m2 = calculate_polygon_area_m2(polygon.coordinates)
    check_area(area_m2)
    sunshine_factor = sunshine_factor_of(polygon)

    pid = plot_id(polygon.coordinates, year, sunshine_factor)
    entry = plot_cache.get(pid)
    if entry is None:
        climate_data = await fetch_all_climate_data(center_lat, center_lon, year, include_multi_year=False)
        entry = {
            "polygon": polygon,
            "year": year,
            "sunshine_factor": sunshine_factor,
            "area_m2": area_m2,
            "location": {
                "center_latitude": round(center_lat, 6),
                "center_longitude": round(center_lon, 6),
                "area_m2": round(area_m2, 2),
                "area_hectares": round(area_m2 / 10_000, 4),
            },
            "nasa": climate_data["primary_year_data"],
            "analysis": climate_data["climate_analysis"],
        }
        entry["climate"] = climate_block(entry["nasa"], entry["analysis"], sunshine_factor, center_lat)
        plot_cache.put(pid, entry)

    return {"plot_id": pid, "location": entry["location"], "year": year, **entry["climate"]}


@app.post("/analysis/crops")
@limiter.limit(RECOMMENDATION_RATE_LIMIT)
async def analysis_crops(request: Request, body: CropsRequest):
    """Step 2: Landsat surface heat (optional) and every crop scored. Retrying never refetches the climate."""
    entry = cached_plot(body.plot_id)

    previous = entry.get("landsat")
    if not body.use_landsat:
        landsat = LandsatResult("disabled")
    elif previous is not None:
        landsat = previous  # only successful reads are kept, so failures are retried
    else:
        landsat = await fetch_landsat(entry["polygon"], entry["year"])
        if landsat.status == "ok":
            entry["landsat"] = landsat
    heat = surface_heat(landsat.readings, entry["nasa"]) if landsat.status == "ok" else None

    if "crops" not in entry:
        entry["crops"] = crops_block(entry["nasa"], entry["analysis"], entry["sunshine_factor"], entry["area_m2"])

    return {
        "plot_id": body.plot_id,
        "landsat": {"status": landsat.status, "scenes": [vars(r) for r in landsat.readings], "surface_heat": heat},
        **entry["crops"],
    }


@app.post("/analysis/summary")
@limiter.limit(SUMMARY_RATE_LIMIT)
async def analysis_summary(request: Request, body: PlotRef):
    """Step 3: two or three plain sentences by Mistral AI. `summary` is null if the model is unavailable."""
    entry = cached_plot(body.plot_id)
    if "crops" not in entry:
        raise HTTPException(status_code=409, detail="Score the crops first (POST /analysis/crops).")
    if "summary" not in entry:
        source = legacy_summary_input(entry["location"], entry["climate"]["climate"], entry["crops"]["crops"], entry["sunshine_factor"])
        try:
            entry["summary"] = await asyncio.to_thread(generate_crop_summary, source)
        except Exception as e:  # noqa: BLE001 - the summary is optional; the results stand without it
            logger.warning(f"Summary failed: {e}")
            return {"plot_id": body.plot_id, "summary": None, "error": "The summary is not available right now."}
    return {"plot_id": body.plot_id, "summary": entry["summary"]}


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

    check_area(area_m2)
    sunshine_factor = sunshine_factor_of(polygon)

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
