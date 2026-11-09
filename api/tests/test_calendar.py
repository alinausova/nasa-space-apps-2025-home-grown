import json
from pathlib import Path

from crop_database import CROP_DATABASE
from growing_calendar import FROST_KILL_C, _daily, calendars, crop_calendar

FIXTURES = Path(__file__).parent / "fixtures"


def nasa(city):
    return json.loads((FIXTURES / f"nasa_{city}_2023.json").read_text())


def synthetic_year(mean_by_month, spread=5.0):
    """A flat daily year from monthly mean temperatures."""
    days_in = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    t_max, t_min = {}, {}
    for m, (n, mean) in enumerate(zip(days_in, mean_by_month), start=1):
        for d in range(1, n + 1):
            key = f"2023{m:02d}{d:02d}"
            t_max[key], t_min[key] = mean + spread, mean - spread
    return {"properties": {"parameter": {"T2M_MAX": t_max, "T2M_MIN": t_min}}}


def test_every_crop_has_a_calendar_entry():
    cal = calendars(nasa("munich"), CROP_DATABASE)
    assert set(cal) == set(CROP_DATABASE)
    for c in cal.values():
        if c is None:
            continue
        for key in ("sow", "grow", "harvest"):
            assert c[key] == sorted(set(c[key]))
            assert all(1 <= m <= 12 for m in c[key])
        assert set(c["sow"]) <= set(c["grow"])


def test_munich_tomatoes_go_out_after_the_frosts():
    tomatoes = calendars(nasa("munich"), CROP_DATABASE)["tomatoes"]
    assert tomatoes is not None
    assert min(tomatoes["sow"]) >= 4
    assert all(m >= 6 for m in tomatoes["harvest"])


def test_cairo_grows_lettuce_in_winter_not_summer():
    lettuce = calendars(nasa("cairo"), CROP_DATABASE)["lettuce"]
    assert lettuce is not None
    assert {12, 1} <= set(lettuce["sow"])
    assert not {6, 7, 8} & set(lettuce["sow"])


def test_nothing_can_be_sown_on_svalbard():
    assert all(c is None for c in calendars(nasa("svalbard"), CROP_DATABASE).values())


def test_a_frost_kills_tender_crops_but_not_hardy_ones():
    # Mild all year except one cold month (mean 2 °C, nights down to -3 °C).
    year = synthetic_year([12, 12, 12, 12, 12, 2, 12, 12, 12, 12, 12, 12])
    days = _daily(year)
    tender = {**CROP_DATABASE["lettuce"], "frost_tolerance": "tender"}
    hardy = {**CROP_DATABASE["lettuce"], "frost_tolerance": "hardy"}
    assert FROST_KILL_C["tender"] > -3 > FROST_KILL_C["hardy"]
    tender_cal, hardy_cal = crop_calendar(tender, days), crop_calendar(hardy, days)
    # Hardy lettuce can be sown right before the cold month; tender lettuce cannot.
    assert 5 in hardy_cal["sow"]
    assert 5 not in tender_cal["sow"]


def test_seeds_need_their_germination_temperature():
    cold = synthetic_year([3] * 12, spread=2)
    days = _daily(cold)
    crop = {**CROP_DATABASE["tomatoes"]}
    assert crop_calendar(crop, days) is None


def test_tender_crops_fall_back_to_planting_out_seedlings():
    cal = calendars(nasa("munich"), CROP_DATABASE)
    peppers = cal["peppers"]
    assert peppers is not None and peppers["mode"] == "plant_out"
    assert min(peppers["sow"]) >= 5  # after the last spring frost
    # Crops that can be sown outdoors stay direct sown.
    assert cal["lettuce"]["mode"] == "sow"


def test_planting_out_wins_when_it_gives_a_longer_harvest():
    tomatoes = calendars(nasa("munich"), CROP_DATABASE)["tomatoes"]
    assert tomatoes["mode"] == "plant_out"
    assert min(tomatoes["harvest"]) <= 8  # picking starts in summer, not in November


def test_too_hot_uses_the_daily_mean():
    # Days of 22–38 °C (mean 30): above basil's 30 °C upper limit only at midday, so still growable.
    year = synthetic_year([30] * 12, spread=8)
    days = _daily(year)
    basil = {**CROP_DATABASE["basil"], "upper_temp": 30}
    assert crop_calendar(basil, days) is not None
    hotter = synthetic_year([33] * 12, spread=8)
    assert crop_calendar(basil, _daily(hotter)) is None


def test_cassava_is_planted_from_cuttings():
    cairo = calendars(nasa("cairo"), CROP_DATABASE)
    cassava = cairo["cassava"]
    assert cassava is not None and cassava["mode"] == "plant"
    assert cairo["taro"] is not None and cairo["taro"]["mode"] == "plant"
    assert calendars(nasa("munich"), CROP_DATABASE)["cassava"] is None


def test_new_crops_carry_sources_for_every_number():
    for cid in ["okra", "cassava", "sorghum", "pearl_millet", "groundnut", "barley", "beetroot",
                "chickpea", "lentil", "cowpea", "fava_bean", "taro", "oats", "turnip"]:
        sources = CROP_DATABASE[cid]["sources"]
        for key in ["temperature_thresholds", "heat_units", "optimal_temperature", "sunlight", "frost", "water", "germination", "yield"]:
            assert sources.get(key), (cid, key)
