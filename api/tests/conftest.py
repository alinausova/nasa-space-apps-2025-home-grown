import math
import os
import sys
from datetime import date, timedelta

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main  # noqa: E402


def synthetic_nasa_year(year: int = 2023) -> dict:
    """A temperate year in NASA POWER's daily JSON shape: warm summer, cold winter, steady rain and sun."""
    tmax, tmin, solar, precip = {}, {}, {}, {}
    day = date(year, 1, 1)
    while day.year == year:
        key = day.strftime("%Y%m%d")
        season = math.sin((day.timetuple().tm_yday - 105) / 365 * 2 * math.pi)
        tmax[key] = 14 + 11 * season
        tmin[key] = tmax[key] - 9
        solar[key] = 12 + 8 * season
        precip[key] = 2.5
        day += timedelta(days=1)
    return {"properties": {"parameter": {"T2M_MAX": tmax, "T2M_MIN": tmin, "ALLSKY_SFC_SW_DWN": solar, "PRECTOTCORR": precip}}}


@pytest.fixture
def stubs(monkeypatch):
    """Stub NASA POWER, Planetary Computer and Mistral. Returns call counters."""
    calls = {"nasa": 0, "landsat": 0, "summary": 0}

    async def fake_nasa(latitude, longitude, year=2023):
        calls["nasa"] += 1
        return synthetic_nasa_year(year)

    async def fake_stac(*args, **kwargs):
        calls["landsat"] += 1
        return None

    def fake_summary(response):
        calls["summary"] += 1
        return "Cool summers suit leafy greens."

    monkeypatch.setattr(main, "fetch_nasa_power_data", fake_nasa)
    monkeypatch.setattr(main, "query_planetary_stac_async", fake_stac)
    monkeypatch.setattr(main, "generate_crop_summary", fake_summary)
    main.limiter.reset()
    return calls
