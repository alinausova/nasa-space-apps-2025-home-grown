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
from models import CropsRequest, PlotRef, PolygonInput, TipsRequest
from summary_gen import generate_crop_summary
from tips_gen import generate_crop_tips, tips_input

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
TIPS_RATE_LIMIT = os.getenv("TIPS_RATE_LIMIT", "10/minute")
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
        "https://home-grown.app",  # Custom domain
        "https://www.home-grown.app",
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


@app.post("/analysis/tips")
@limiter.limit(TIPS_RATE_LIMIT)
async def analysis_tips(request: Request, body: TipsRequest):
    """Three or four plain sentences of tips for one crop on this plot, by Mistral AI. Cached per plot and crop."""
    entry = cached_plot(body.plot_id)
    crop_data = CROP_DATABASE.get(body.crop_id)
    if crop_data is None:
        raise HTTPException(status_code=404, detail="Unknown crop.")
    if "crops" not in entry:
        raise HTTPException(status_code=409, detail="Score the crops first (POST /analysis/crops).")
    tips = entry.setdefault("tips", {})
    if body.crop_id not in tips:
        crop_entry = next(c for c in entry["crops"]["crops"] if c["crop_id"] == body.crop_id)
        facts = tips_input(body.crop_id, crop_data, crop_entry, entry["climate"], entry["location"])
        try:
            tips[body.crop_id] = await asyncio.to_thread(generate_crop_tips, facts)
        except Exception as e:  # noqa: BLE001 - tips are optional
            logger.warning(f"Tips failed for {body.crop_id}: {e}")
            return {"plot_id": body.plot_id, "crop_id": body.crop_id, "tips": None, "error": "Tips are not available right now."}
    return {"plot_id": body.plot_id, "crop_id": body.crop_id, "tips": tips[body.crop_id]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
