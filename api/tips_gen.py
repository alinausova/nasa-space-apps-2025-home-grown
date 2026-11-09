"""Short, practical growing tips for one crop on one plot, written by Mistral AI from the analysis data."""
import json
import os
from typing import Dict, List, Optional

from mistralai import Mistral

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

SYSTEM_PROMPT = """You are an urban agriculture advisor. Someone is planning to grow one crop on a plot
(a roof, yard or empty lot) and asks for tips for that crop at that plot.

Write three or four short, plain sentences with practical advice for this crop at this plot:
when to sow or plant out, what the local weather means for it (heat, cold, frost, dry or wet months),
and one care point (watering, shade, harvesting).

Rules: plain text only. No markdown, no bullet points, no headings, no bold, no emojis.
No greeting and no sign-off. Use month names. Only use numbers that appear in the data.
If the calendar says plant_out, tell them to start seeds indoors first; if it says plant, the crop is grown from cuttings or corms."""


def _months(numbers: Optional[List[int]]) -> List[str]:
    return [MONTHS[m - 1] for m in numbers or []]


def tips_input(crop_id: str, crop_data: Dict, crop_entry: Dict, climate: Dict, location: Dict) -> Dict:
    """The facts the model may use, in a compact form."""
    suitability = crop_entry.get("suitability", {})
    metrics = suitability.get("metrics", {})
    calendar = crop_entry.get("calendar")
    return {
        "crop": {
            "name": crop_data["name"],
            "season": crop_data["season"],
            "frost_tolerance": crop_data["frost_tolerance"],
            "ideal_temp_c": [crop_data["optimal_temp_min"], crop_data["optimal_temp_max"]],
            "stops_growing_above_c": crop_data["upper_temp"],
            "germinates_from_c": crop_data["germination_temp_min"],
            "water_need_mm_per_season": crop_data["seasonal_water_mm"],
            "min_sun_hours": crop_data["min_sun_hours"],
        },
        "at_this_plot": {
            "score": suitability.get("overall_score"),
            "factor_scores": suitability.get("scores", {}),
            "irrigation_needed_mm": metrics.get("irrigation_needed_mm"),
            "sun_hours_after_shade": metrics.get("adjusted_sun_hours"),
            "calendar": None if not calendar else {
                "mode": calendar["mode"],
                "sow_or_plant_out": _months(calendar["sow"]),
                "grows": _months(calendar["grow"]),
                "harvest": _months(calendar["harvest"]),
            },
        },
        "climate": {
            "hemisphere": "south" if (location.get("center_latitude") or 0) < 0 else "north",
            "monthly": [
                {"month": MONTHS[m["month"] - 1], "high_c": m["temp_max"], "low_c": m["temp_min"], "rain_mm": m["precip_mm"]}
                for m in climate.get("monthly", [])
            ],
        },
    }


def generate_crop_tips(facts: Dict, api_key: Optional[str] = None) -> str:
    api_key = api_key or os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY not found in environment variables")
    client = Mistral(api_key=api_key)
    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Data for this crop and plot:\n\n{json.dumps(facts, indent=1)}\n\nWrite the tips now."},
        ],
        temperature=0.5,
        max_tokens=220,
    )
    return response.choices[0].message.content
