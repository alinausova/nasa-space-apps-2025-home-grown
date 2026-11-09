"""
Builders for the three-call analysis API (climate → crops → summary) and its in-memory plot cache.
Pure functions over NASA POWER data and scoring results; the routes live in main.py.
"""
import hashlib
import json
import statistics
import threading
import time
from collections import OrderedDict, defaultdict
from typing import Any, Dict, List, Optional

from crop_database import CROP_DATABASE
from growing_calendar import calendars
from scoring import calculate_crop_suitability, calculate_growing_season_sunshine, growing_season_climate

USABLE_SCORE = 50.0
SEASON_BASE_C = 5.0
DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


# ---------------------------------------------------------------------------- cache


class PlotCache:
    """Small thread-safe LRU with expiry. Single Render instance, so memory is enough; a miss just refetches."""

    def __init__(self, max_entries: int = 256, ttl_s: float = 3600):
        self.max_entries = max_entries
        self.ttl_s = ttl_s
        self._items: "OrderedDict[str, tuple[float, Dict[str, Any]]]" = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            entry = self._items.get(key)
            if entry is None:
                return None
            created, value = entry
            if time.monotonic() - created > self.ttl_s:
                del self._items[key]
                return None
            self._items.move_to_end(key)
            return value

    def put(self, key: str, value: Dict[str, Any]) -> None:
        with self._lock:
            self._items[key] = (time.monotonic(), value)
            self._items.move_to_end(key)
            while len(self._items) > self.max_entries:
                self._items.popitem(last=False)


def plot_id(coordinates: List[tuple], year: int, sunshine_factor: float) -> str:
    """Stable id for a plot + year + shade assumption (coordinates rounded to ~10 cm)."""
    key = json.dumps({"c": [[round(a, 6), round(b, 6)] for a, b in coordinates], "y": year, "s": round(sunshine_factor, 3)})
    return hashlib.sha1(key.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------- climate


def _params(nasa_data: Dict) -> Dict:
    return nasa_data.get("properties", {}).get("parameter", {})


def monthly_climate(nasa_data: Dict) -> List[Dict]:
    """Per month: mean daily max/min/mean temperature and total rainfall."""
    p = _params(nasa_data)
    t_max, t_min, rain = p.get("T2M_MAX", {}), p.get("T2M_MIN", {}), p.get("PRECTOTCORR", {})
    by_month: Dict[int, Dict[str, list]] = defaultdict(lambda: {"max": [], "min": [], "rain": 0.0})
    for day, hi in t_max.items():
        lo = t_min.get(day)
        if lo is None:
            continue
        month = int(day[4:6])
        by_month[month]["max"].append(hi)
        by_month[month]["min"].append(lo)
        by_month[month]["rain"] += rain.get(day, 0.0)
    out = []
    for month in range(1, 13):
        m = by_month.get(month)
        if not m or not m["max"]:
            continue
        hi, lo = statistics.mean(m["max"]), statistics.mean(m["min"])
        out.append({
            "month": month,
            "temp_max": round(hi, 1),
            "temp_min": round(lo, 1),
            "temp_avg": round((hi + lo) / 2, 1),
            "precip_mm": round(m["rain"], 1),
        })
    return out


def growing_season(monthly: List[Dict], base: float = SEASON_BASE_C) -> Optional[Dict]:
    """Longest run of months averaging at least `base`, wrapping past December. None if no month qualifies."""
    warm = [False] * 12
    for m in monthly:
        warm[m["month"] - 1] = m["temp_avg"] >= base
    if not any(warm):
        return None
    if all(warm):
        return {"start_month": 1, "end_month": 12, "days": 365, "all_year": True}
    best: List[int] = []
    for start in range(12):
        if not warm[start] or warm[(start - 1) % 12]:
            continue
        run = []
        k = 0
        while k < 12 and warm[(start + k) % 12]:
            run.append((start + k) % 12)
            k += 1
        if len(run) > len(best):
            best = run
    return {
        "start_month": best[0] + 1,
        "end_month": best[-1] + 1,
        "days": sum(DAYS_IN_MONTH[m] for m in best),
        "all_year": False,
    }


def days_above(nasa_data: Dict, threshold: float = SEASON_BASE_C) -> int:
    p = _params(nasa_data)
    t_min = p.get("T2M_MIN", {})
    return sum(1 for day, hi in p.get("T2M_MAX", {}).items() if day in t_min and (hi + t_min[day]) / 2 >= threshold)


def winter_sun_hours(nasa_data: Dict, latitude: float) -> float:
    """Mean daily sunshine hours (no shade factor) in the three darkest months for the hemisphere."""
    months = {12, 1, 2} if latitude >= 0 else {6, 7, 8}
    solar = _params(nasa_data).get("ALLSKY_SFC_SW_DWN", {})
    hours = [max(0.0, min(16.0, v * 0.278 / 0.35)) for day, v in solar.items() if int(day[4:6]) in months]
    return round(statistics.mean(hours), 1) if hours else 0.0


def climate_block(nasa_data: Dict, analysis: Dict, sunshine_factor: float, latitude: float) -> Dict:
    monthly = monthly_climate(nasa_data)
    warmest = max(monthly, key=lambda m: m["temp_avg"]) if monthly else None
    display_sun = calculate_growing_season_sunshine(nasa_data, crop_base_temp=10.0, sunshine_factor=sunshine_factor)
    return {
        "climate": {
            "avg_temp_max": round(analysis["temperature_max"]["mean"], 1),
            "avg_temp_min": round(analysis["temperature_min"]["mean"], 1),
            "annual_precipitation_mm": round(analysis["precipitation"]["total_annual"], 1),
            "sun_hours_daily": display_sun["adjusted_sun_hours"],
            "sunshine_factor": round(sunshine_factor, 2),
            "growing_season": growing_season(monthly),
            "warmest_month": {"month": warmest["month"], "temp_avg": warmest["temp_avg"]} if warmest else None,
            "days_above_5c": days_above(nasa_data),
            "winter_sun_hours": winter_sun_hours(nasa_data, latitude),
        },
        "monthly": monthly,
    }


# ---------------------------------------------------------------------------- crops


def miss_reason(crop_data: Dict, suitability: Optional[Dict], nasa_data: Dict, sun_filtered: Optional[Dict]) -> Dict:
    """Why a crop is not usable, as data the front end turns into a sentence."""
    if sun_filtered is not None:
        return {"kind": "sun", "needed_hours": crop_data["min_sun_hours"], "available_hours": sun_filtered["available_sun_hours"]}

    metrics = suitability["metrics"]
    season = growing_season_climate(nasa_data, crop_data["base_temp"])
    if season["days"] == 0:
        return {"kind": "too_cold"}

    scores = suitability["scores"]
    weakest = min(scores, key=lambda k: scores[k])
    if metrics.get("heat_capped") or weakest == "gdd":
        short = max(0.0, metrics["required_gdd"] - metrics["total_gdd"])
        per_day = metrics["total_gdd"] / season["days"] if season["days"] else 0
        extra_days = short / per_day if per_day > 0 else None
        # If the warm season would have to more than double, the missing warmth is beyond what a year here offers.
        beyond_a_year = extra_days is None or extra_days > season["days"]
        return {
            "kind": "heat",
            "short_heat_units": round(short),
            "approx_warm_days": None if beyond_a_year else round(extra_days),
            "beyond_a_year": beyond_a_year,
        }
    if weakest == "temperature":
        return {
            "kind": "temperature",
            "season_mean_temp": metrics.get("season_mean_temp"),
            "ideal_min": crop_data["optimal_temp_min"],
            "ideal_max": crop_data["optimal_temp_max"],
        }
    if weakest == "water":
        return {"kind": "water", "irrigation_mm": metrics["irrigation_needed_mm"]}
    return {"kind": "sun", "needed_hours": crop_data["optimal_sun_hours"], "available_hours": metrics["adjusted_sun_hours"]}


def crops_block(nasa_data: Dict, analysis: Dict, sunshine_factor: float, area_m2: float) -> Dict:
    """Every crop, usable or not, sorted by score; sun-filtered crops get score 0."""
    crop_calendars = calendars(nasa_data, CROP_DATABASE)
    crops = []
    for crop_id, crop_data in CROP_DATABASE.items():
        sun = calculate_growing_season_sunshine(nasa_data, crop_data["base_temp"], sunshine_factor)
        sun_filtered = None
        if sun["adjusted_sun_hours"] < crop_data["min_sun_hours"]:
            sun_filtered = {"available_sun_hours": round(sun["adjusted_sun_hours"], 1)}

        suitability = calculate_crop_suitability(crop_data, analysis, nasa_data, sunshine_factor, area_m2)
        score = 0.0 if sun_filtered else suitability["overall_score"]
        calendar = crop_calendars[crop_id]
        # A crop no sowing date can bring to harvest is not recommended, whatever its yearly score.
        no_window = calendar is None and sun_filtered is None and score >= USABLE_SCORE
        usable = sun_filtered is None and score >= USABLE_SCORE and not no_window
        entry = {
            "crop_id": crop_id,
            "crop_name": crop_data["name"],
            "season": crop_data["season"],
            "frost_tolerance": crop_data["frost_tolerance"],
            "drought_resistance": crop_data.get("drought_resistance", "unknown"),
            "usable": usable,
            "calendar": calendar,
            "suitability": {**suitability, "overall_score": score, "category": suitability["category"] if not sun_filtered else "Poor"},
        }
        if no_window:
            entry["miss_reason"] = {"kind": "no_window"}
        elif not usable:
            entry["miss_reason"] = miss_reason(crop_data, suitability, nasa_data, sun_filtered)
        crops.append(entry)

    crops.sort(key=lambda c: c["suitability"]["overall_score"], reverse=True)
    return {"crops": crops, "total_usable": sum(1 for c in crops if c["usable"])}


def legacy_summary_input(location: Dict, climate: Dict, crops: List[Dict], sunshine_factor: float) -> Dict:
    """The shape generate_crop_summary was written for (POST /recommendations/polygon)."""
    usable = [c for c in crops if c["usable"]]
    return {
        "location": location,
        "climate_summary": {
            "avg_temp_max": climate["avg_temp_max"],
            "avg_temp_min": climate["avg_temp_min"],
            "annual_precipitation_mm": climate["annual_precipitation_mm"],
            "representative_sun_hours_daily": climate["sun_hours_daily"],
        },
        "sunshine_factor": sunshine_factor,
        "recommendations": usable,
        "total_suitable_crops": len(usable),
        "total_filtered_by_sunlight": sum(1 for c in crops if c.get("miss_reason", {}).get("kind") == "sun" and c["suitability"]["overall_score"] == 0),
    }
