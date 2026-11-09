"""Crop scoring: growing-season sunshine, growing degree days, suitability, yield, ranking."""
import logging
import statistics
from typing import Dict

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
            "irrigation_needed_mm": round(irrigation_needed, 1),
            "optimal_temp_min": crop_data["optimal_temp_min"],
            "optimal_temp_max": crop_data["optimal_temp_max"],
            "base_temp": crop_data["base_temp"],
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
