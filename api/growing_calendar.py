"""Sow / grow / harvest months per crop, simulated on the plot's own year of daily NASA POWER weather.

For sowing dates on the 1st and 15th of each month:
- the seed has to germinate: the week after sowing averages within its germination range;
- the crop then grows by heat units (same GDD method as the scores) until it reaches `gdd_required`;
- a frost below the crop's tolerance before maturity kills it (that sowing does not count);
- more than a third of the growing days with a daily mean above the crop's upper temperature counts as
  too hot (development stops above that threshold; Paredes et al. 2025b, Eq. 1);
- maturity has to come within a year.
Each sowing that works marks its sow month, the months it grows through, and a harvest window of
HARVEST_DAYS after maturity (cut short by a killing frost). The year repeats, so winter sowings
(garlic in October) can mature the next summer.

Frost-tender crops are also tried as seedlings planted out: TRANSPLANT_WEEKS indoors at
INDOOR_TEMP_C give them a head start in heat units. Planting out wins when sowing outdoors does not
work or gives a shorter harvest (tomatoes in Munich), and the first row then reads "plant out".
"""
from typing import Dict, List, Optional

from scoring import calculate_gdd

# Lowest night temperature each frost class survives. Rough thresholds for a calendar, not a survival model.
FROST_KILL_C = {"tender": 0.0, "half_hardy": -3.0, "hardy": -8.0, "very_hardy": -15.0}
GERMINATION_DAYS = 7
HARVEST_DAYS = 28
MAX_HOT_SHARE = 1 / 3
SOW_DAYS_OF_MONTH = (1, 15)
TRANSPLANT_WEEKS = 6
INDOOR_TEMP_C = 20.0
# Seedlings do not carry more than this share of the heat units they need.
MAX_HEAD_START = 0.4


def _daily(nasa_data: Dict) -> List[Dict]:
    p = nasa_data.get("properties", {}).get("parameter", {})
    t_max, t_min = p.get("T2M_MAX", {}), p.get("T2M_MIN", {})
    days = []
    for key in sorted(t_max):
        lo = t_min.get(key)
        if lo is None:
            continue
        hi = t_max[key]
        days.append({"month": int(key[4:6]), "day": int(key[6:8]), "max": hi, "min": lo, "mean": (hi + lo) / 2})
    return days


def _months(days: List[Dict], start: int, end: int) -> set:
    """Months touched by day indexes start..end inclusive, wrapping around the year."""
    n = len(days)
    if end - start + 1 >= n:
        return set(range(1, 13))
    return {days[i % n]["month"] for i in range(start, end + 1)}


def head_start(crop: Dict) -> float:
    """Heat units a seedling gathers indoors before it is planted out."""
    indoors = max(0.0, INDOOR_TEMP_C - crop["base_temp"]) * TRANSPLANT_WEEKS * 7
    return min(indoors, crop["gdd_required"] * MAX_HEAD_START)


def crop_calendar(crop: Dict, days: List[Dict], transplant: bool = False) -> Optional[Dict]:
    """
    {"mode", "sow", "grow", "harvest"} with month numbers, or None when no sowing works.
    `transplant` plants out seedlings: no germination check, a head start in heat units,
    and the first week has to be warm enough to grow in.
    """
    n = len(days)
    if n < 300:
        return None
    gdd = [calculate_gdd(d["max"], d["min"], crop["base_temp"], crop["upper_temp"]) for d in days]
    kill_below = FROST_KILL_C.get(crop.get("frost_tolerance", "tender"), 0.0)
    germ_min, germ_max = crop["germination_temp_min"], crop["germination_temp_max"]

    sow, grow, harvest = set(), set(), set()
    for start, d in enumerate(days):
        if d["day"] not in SOW_DAYS_OF_MONTH:
            continue
        week = sum(days[(start + k) % n]["mean"] for k in range(GERMINATION_DAYS)) / GERMINATION_DAYS
        if transplant and week < crop["base_temp"]:
            continue
        if not transplant and not germ_min <= week <= germ_max:
            continue

        total = head_start(crop) if transplant else 0.0
        i, mature, hot = start, None, 0
        while i < start + n:
            today = days[i % n]
            if today["min"] < kill_below:
                break
            hot += today["mean"] > crop["upper_temp"]
            total += gdd[i % n]
            if total >= crop["gdd_required"]:
                mature = i
                break
            i += 1
        if mature is None or hot > (mature - start + 1) * MAX_HOT_SHARE:
            continue

        last = mature
        while last < mature + HARVEST_DAYS and days[(last + 1) % n]["min"] >= kill_below:
            last += 1

        sow.add(d["month"])
        grow |= _months(days, start, mature)
        harvest |= _months(days, mature, last)

    if not sow:
        return None
    return {
        "mode": "plant_out" if transplant else "sow",
        "sow": sorted(sow),
        "grow": sorted(grow),
        "harvest": sorted(harvest),
    }


def calendar_for(crop: Dict, days: List[Dict]) -> Optional[Dict]:
    direct = crop_calendar(crop, days)
    if crop.get("propagation") == "vegetative":
        return {**direct, "mode": "plant"} if direct else None
    if crop.get("frost_tolerance") != "tender":
        return direct
    planted = crop_calendar(crop, days, transplant=True)
    if direct is None or (planted and len(planted["harvest"]) > len(direct["harvest"])):
        return planted
    return direct


def calendars(nasa_data: Dict, crops: Dict[str, Dict]) -> Dict[str, Optional[Dict]]:
    days = _daily(nasa_data)
    return {crop_id: calendar_for(crop, days) for crop_id, crop in crops.items()}
