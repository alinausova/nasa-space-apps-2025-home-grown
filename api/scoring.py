"""Crop scoring: growing-season sunshine, growing degree days, suitability, yield, ranking."""
import logging
import statistics
from typing import Dict, Optional, Set, Tuple

from crop_database import CROP_DATABASE

logger = logging.getLogger(__name__)


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

def growing_season_climate(nasa_raw_data: Dict, crop_base_temp: float) -> Dict:
    """
    Mean temperature and rainfall over the crop's growing days (daily mean above its base temperature),
    the same window the sunshine score uses.
    """
    parameters = nasa_raw_data.get("properties", {}).get("parameter", {})
    temp_max_data = parameters.get("T2M_MAX", {})
    temp_min_data = parameters.get("T2M_MIN", {})
    precip_data = parameters.get("PRECTOTCORR", {})

    temps = []
    precip = 0.0
    for date_key, t_max in temp_max_data.items():
        t_min = temp_min_data.get(date_key)
        if t_min is None:
            continue
        avg = (t_max + t_min) / 2
        if avg > crop_base_temp:
            temps.append(avg)
            precip += precip_data.get(date_key, 0.0)

    return {
        "days": len(temps),
        "mean_temp": statistics.mean(temps) if temps else None,
        "precipitation_mm": precip,
    }


# Overall score: the weakest of the factors a gardener cannot change (heat, sun, temperature) limits it,
# so plenty of rain cannot make up for a crop being too cold. Water is left out: watering fixes it.
WEAKEST_FACTOR_MARGIN = 12
# Heat: "just enough" heat units score 80; full marks need this much to spare (our choice, so one cool
# year does not lose a crop that only just makes it).
HEAT_MARGIN = 1.25


def temperature_response(t: float, t_base: float, opt_min: float, opt_max: float, t_upper: float) -> float:
    """
    How well a crop grows at a daily mean of t, 0–1: 1 inside its optimal range, falling linearly to 0 at its
    base and upper temperature (the response used by the FAO EcoCrop model).
    """
    if t <= t_base or t >= t_upper:
        return 0.0
    if t < opt_min:
        return (t - t_base) / (opt_min - t_base)
    if t > opt_max:
        return (t_upper - t) / (t_upper - opt_max)
    return 1.0


def temperature_score(nasa_raw_data: Dict, crop_data: Dict, grow_months: Optional[Set[int]] = None) -> Tuple[float, int, Optional[float]]:
    """
    Average daily temperature response over the crop's growing days (0–100), how many days counted, and
    their mean temperature.
    Growing days: warm enough to grow (above base) and, when the calendar knows them, inside its growing
    months; dormant winter days of hardy crops do not count against them.
    """
    base, upper = crop_data["base_temp"], crop_data["upper_temp"]
    opt_min = max(crop_data["optimal_temp_min"], base + 0.5)
    opt_max = min(crop_data["optimal_temp_max"], upper - 0.5)
    parameters = nasa_raw_data.get("properties", {}).get("parameter", {})
    t_max, t_min = parameters.get("T2M_MAX", {}), parameters.get("T2M_MIN", {})
    responses, means = [], []
    for key, hi in t_max.items():
        lo = t_min.get(key)
        if lo is None:
            continue
        mean = (hi + lo) / 2
        if mean <= base or (grow_months and int(key[4:6]) not in grow_months):
            continue
        responses.append(temperature_response(mean, base, opt_min, opt_max, upper))
        means.append(mean)
    if not responses:
        return 0.0, 0, None
    return 100 * sum(responses) / len(responses), len(responses), sum(means) / len(means)


def heat_score(gdd_ratio: float) -> float:
    """Heat units available ÷ needed: 80 at exactly enough, 100 from HEAT_MARGIN up, proportionally less below."""
    if gdd_ratio >= HEAT_MARGIN:
        return 100.0
    if gdd_ratio >= 1.0:
        return 80 + (gdd_ratio - 1.0) / (HEAT_MARGIN - 1.0) * 20
    return gdd_ratio * 80


def water_score(season_precip: float, required_water: float) -> float:
    """
    Rain over the growing days against the crop's seasonal need.
    A shortfall is scored as before; a surplus costs far less, because rain beyond the need
    only becomes a problem when it is extreme.
    """
    shortfall = required_water - season_precip
    if shortfall > 0:
        if shortfall <= 50:
            return 100.0
        if shortfall <= 150:
            return 90 - ((shortfall - 50) / 100) * 20
        if shortfall <= 300:
            return 70 - ((shortfall - 150) / 150) * 30
        return max(20.0, 40 - ((shortfall - 300) / 100) * 5)

    surplus = -shortfall
    if surplus <= 150:
        return 100.0
    if surplus <= 400:
        return 100 - ((surplus - 150) / 250) * 20
    return max(60.0, 80 - ((surplus - 400) / 100) * 5)


def calculate_crop_suitability(crop_data: Dict, climate_analysis: Dict,
                               nasa_raw_data: Dict, sunshine_factor: float = 1.0,
                               area_m2: float = None, grow_months: Optional[Set[int]] = None) -> Dict:
    """
    Calculate suitability score for a specific crop based on climate data.

    Args:
        crop_data: Crop information from database
        climate_analysis: Analyzed climate data
        nasa_raw_data: Raw NASA POWER data (for GDD calculation and growing-season sunshine)
        sunshine_factor: Factor to adjust available sunshine (0-1) for shade/obstructions
        area_m2: Area in square meters (optional, for yield estimation)
        grow_months: Months the crop's calendar grows through (temperature is judged over those days)

    Returns:
        Dictionary with suitability scores, metrics, and optional yield estimate
    """
    # Extract climate metrics
    annual_precip = climate_analysis["precipitation"]["total_annual"]
    season = growing_season_climate(nasa_raw_data, crop_data["base_temp"])

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
    scores["gdd"] = heat_score(gdd_ratio)

    # Sun Hours Score - using adjusted sun hours from growing season
    # Use optimal_sun_hours for scoring (what the crop ideally wants)
    sun_ratio = adjusted_sun_hours / crop_data["optimal_sun_hours"]
    scores["sunlight"] = min(100, sun_ratio * 100)

    # Temperature: daily response over the crop's own growing days.
    scores["temperature"], temperature_days, temperature_mean = temperature_score(nasa_raw_data, crop_data, grow_months)

    # Water: rain over the growing days against the seasonal need; surplus costs less than shortfall.
    required_water = crop_data.get("seasonal_water_mm", 500)
    irrigation_needed = max(0, required_water - season["precipitation_mm"])
    scores["water"] = water_score(season["precipitation_mm"], required_water)

    # Drought resistance adjustment
    drought_resistance = crop_data.get("drought_resistance", "moderate")
    if drought_resistance in ["tolerant", "moderate_tolerant"] and irrigation_needed > 0:
        scores["water"] = min(100, scores["water"] * 1.1)
    elif drought_resistance in ["sensitive"] and irrigation_needed > 100:
        scores["water"] = scores["water"] * 0.9

    # Overall suitability: weighted average, limited by the weakest factor a gardener cannot change.
    weighted = (
            scores["gdd"] * 0.35 +
            scores["sunlight"] * 0.25 +
            scores["temperature"] * 0.25 +
            scores["water"] * 0.15
    )
    fixed = {"heat": scores["gdd"], "sun": scores["sunlight"], "temperature": scores["temperature"]}
    weakest = min(fixed, key=fixed.get)
    limit = fixed[weakest] + WEAKEST_FACTOR_MARGIN
    limited_by = weakest if weighted > limit else None
    overall_score = min(weighted, limit)

    # A crop that cannot collect enough heat to mature cannot rank above its heat score,
    # however mild or sunny the short season it does get.
    heat_capped = overall_score > scores["gdd"]
    overall_score = min(overall_score, scores["gdd"])

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
            "season_precipitation_mm": round(season["precipitation_mm"], 1),
            "season_mean_temp": round(season["mean_temp"], 1) if season["mean_temp"] is not None else None,
            "heat_capped": heat_capped,
            "limited_by": limited_by,
            "temperature_days": temperature_days,
            "temperature_mean": round(temperature_mean, 1) if temperature_mean is not None else None,
            "required_water_mm": required_water,
            "irrigation_needed_mm": round(irrigation_needed, 1),
            "optimal_temp_min": crop_data["optimal_temp_min"],
            "optimal_temp_max": crop_data["optimal_temp_max"],
            "base_temp": crop_data["base_temp"],
            "upper_temp": crop_data["upper_temp"],
        }
    }

    # Add yield estimate if area is provided
    if area_m2 is not None:
        result["yield_estimate"] = calculate_yield_estimate(crop_data, overall_score, area_m2)

    return result

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
    from growing_calendar import calendars  # local import: growing_calendar imports scoring
    crop_calendars = calendars(nasa_raw_data, CROP_DATABASE)

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
            logger.info(f"Filtered crop {crop_id} due to sunlight adjustment {adjusted_sun_hours}<{crop_data['min_sun_hours']}")
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
        calendar = crop_calendars[crop_id]
        suitability = calculate_crop_suitability(
            crop_data, climate_analysis, nasa_raw_data, sunshine_factor, area_m2,
            grow_months=set(calendar["grow"]) if calendar else None,
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
