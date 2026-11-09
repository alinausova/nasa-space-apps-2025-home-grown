import pytest
from fastapi.testclient import TestClient

import analysis
import main
from analysis import PlotCache, crops_block, days_above, growing_season, monthly_climate, winter_sun_hours
from climate import analyze_climate_data
from crop_database import CROP_DATABASE
from tests.golden import nasa

client = TestClient(main.app)
SMALL = [[48.1478, 11.5640], [48.1478, 11.5653], [48.1469, 11.5653], [48.1469, 11.5640]]


def months(avgs):
    return [{"month": i + 1, "temp_avg": a} for i, a in enumerate(avgs)]


class TestClimateBuilders:
    def test_monthly_rain_is_summed(self):
        m = monthly_climate(nasa("munich"))
        assert len(m) == 12
        assert sum(x["precip_mm"] for x in m) == pytest.approx(analyze_climate_data(nasa("munich"))["precipitation"]["total_annual"], abs=0.5)

    @pytest.mark.parametrize(
        ("avgs", "expected"),
        [
            ([1.5, 2.1, 6.0, 6.7, 12.5, 17.7, 19.4, 19.6, 17.8, 13.2, 4.3, 2.2], (3, 10, False)),
            ([14] * 12, (1, 12, True)),
            ([-7, -9, -16, -8, -4, 1.4, 5.6, 4.7, -1.6, -6.9, -9.9, -9.5], (7, 7, False)),
            ([12, 11, 9, 6, 3, 1, 0, 2, 4, 6, 9, 11], (10, 4, False)),  # southern hemisphere wraps
        ],
    )
    def test_growing_season(self, avgs, expected):
        s = growing_season(months(avgs))
        assert (s["start_month"], s["end_month"], s["all_year"]) == expected

    def test_no_growing_season(self):
        assert growing_season(months([-10] * 12)) is None

    def test_days_above_and_winter_sun(self):
        assert days_above(nasa("cairo")) == 365
        assert days_above(nasa("svalbard")) < 60
        assert winter_sun_hours(nasa("svalbard"), 78.2) == 0  # polar night
        assert winter_sun_hours(nasa("cairo"), 30.0) > 6


class TestCrops:
    def block(self, name):
        data = nasa(name)
        return crops_block(data, analyze_climate_data(data), 0.7, 10_000)

    def test_munich_nearly_every_crop_usable_and_sorted(self):
        b = self.block("munich")
        scores = [c["suitability"]["overall_score"] for c in b["crops"]]
        assert len(b["crops"]) == len(CROP_DATABASE)
        assert scores == sorted(scores, reverse=True)
        # Everything but the tropical staples scores well in Munich; every crop that misses says why.
        assert b["total_usable"] >= len(CROP_DATABASE) - 4
        assert all(("miss_reason" in c) != c["usable"] for c in b["crops"])
        # Cassava cannot be brought to harvest in Munich; it says why (too cold, short of heat, or no planting date).
        cassava = next(c for c in b["crops"] if c["crop_id"] == "cassava")
        assert not cassava["usable"] and cassava["miss_reason"]["kind"] in {"no_window", "heat", "temperature"}

    def test_svalbard_nothing_usable_each_with_a_reason(self):
        b = self.block("svalbard")
        assert b["total_usable"] == 0
        kinds = {c["miss_reason"]["kind"] for c in b["crops"]}
        assert kinds <= {"heat", "too_cold", "sun", "temperature", "water"}
        sun = [c for c in b["crops"] if c["miss_reason"]["kind"] == "sun"]
        assert sun and all(c["suitability"]["overall_score"] == 0 for c in sun)
        radish = next(c for c in b["crops"] if c["crop_id"] == "radishes")
        assert radish["miss_reason"]["kind"] == "heat"
        assert radish["miss_reason"]["short_heat_units"] > 0
        # Svalbard's year cannot supply the missing warmth, so no impossible day count is given.
        assert radish["miss_reason"]["beyond_a_year"] is True
        assert radish["miss_reason"]["approx_warm_days"] is None

    def test_close_call_gets_a_day_count(self):
        from analysis import miss_reason
        from crop_database import CROP_DATABASE
        from scoring import calculate_crop_suitability

        data = nasa("munich")
        analysis_ = analyze_climate_data(data)
        base = CROP_DATABASE["watermelon"]
        available = calculate_crop_suitability(base, analysis_, data, 0.7, 1_000)["metrics"]["total_gdd"]
        crop = {**base, "gdd_required": round(available * 1.8)}  # heat-limited: heat becomes its weakest factor
        suit = calculate_crop_suitability(crop, analysis_, data, 0.7, 1_000)
        reason = miss_reason(crop, suit, data, None)
        assert reason["kind"] == "heat"
        assert reason["beyond_a_year"] is False
        season_days = __import__("scoring").growing_season_climate(data, crop["base_temp"])["days"]
        assert 0 < reason["approx_warm_days"] <= season_days


class TestPlotCache:
    def test_expiry(self, monkeypatch):
        now = [1000.0]
        monkeypatch.setattr(analysis.time, "monotonic", lambda: now[0])
        cache = PlotCache(ttl_s=10)
        cache.put("a", {"x": 1})
        now[0] += 5
        assert cache.get("a") == {"x": 1}
        now[0] += 11
        assert cache.get("a") is None

    def test_least_recently_used_is_evicted(self):
        cache = PlotCache(max_entries=2)
        cache.put("a", {})
        cache.put("b", {})
        cache.get("a")
        cache.put("c", {})
        assert cache.get("b") is None and cache.get("a") is not None and cache.get("c") is not None


class TestApiFlow:
    def climate(self, **params):
        return client.post("/analysis/climate", params=params, json={"coordinates": SMALL})

    def test_three_steps(self, stubs):
        c = self.climate()
        assert c.status_code == 200, c.text
        body = c.json()
        assert len(body["monthly"]) == 12 and "precip_mm" in body["monthly"][0]
        assert body["climate"]["growing_season"]["start_month"] >= 1
        pid = body["plot_id"]

        crops = client.post("/analysis/crops", json={"plot_id": pid}).json()
        assert len(crops["crops"]) == len(CROP_DATABASE)
        assert crops["landsat"]["status"] == "ok"

        summary = client.post("/analysis/summary", json={"plot_id": pid}).json()
        assert summary == {"plot_id": pid, "summary": "Cool summers suit leafy greens."}
        assert stubs["nasa"] == 1

    def test_climate_is_cached_per_plot(self, stubs):
        first = self.climate().json()["plot_id"]
        second = self.climate().json()["plot_id"]
        assert first == second
        assert stubs["nasa"] == 1

    def test_retry_without_landsat_does_not_refetch_climate(self, stubs):
        pid = self.climate().json()["plot_id"]
        off = client.post("/analysis/crops", json={"plot_id": pid, "use_landsat": False}).json()
        assert off["landsat"]["status"] == "disabled"
        on = client.post("/analysis/crops", json={"plot_id": pid}).json()
        again = client.post("/analysis/crops", json={"plot_id": pid}).json()
        assert on["landsat"]["status"] == again["landsat"]["status"] == "ok"
        assert stubs["nasa"] == 1
        assert stubs["landsat"] == 1  # a successful Landsat read is reused

    def test_unknown_plot(self, stubs):
        r = client.post("/analysis/crops", json={"plot_id": "0123456789abcdef"})
        assert r.status_code == 404
        assert "analyse it again" in r.json()["detail"]

    def test_summary_needs_crops_first(self, stubs):
        pid = self.climate().json()["plot_id"]
        assert client.post("/analysis/summary", json={"plot_id": pid}).status_code == 409

    def test_summary_failure_is_null_not_an_error(self, stubs, monkeypatch):
        def broken(_):
            raise RuntimeError("401")

        monkeypatch.setattr(main, "generate_crop_summary", broken)
        pid = self.climate().json()["plot_id"]
        client.post("/analysis/crops", json={"plot_id": pid})
        r = client.post("/analysis/summary", json={"plot_id": pid})
        assert r.status_code == 200
        assert r.json()["summary"] is None

    def test_area_limit_applies(self, stubs):
        big = [[48.10, 11.50], [48.10, 11.52], [48.1135, 11.52], [48.1135, 11.50]]
        assert client.post("/analysis/climate", json={"coordinates": big}).status_code == 400
