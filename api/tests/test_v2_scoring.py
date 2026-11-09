from datetime import date

import pytest

from climate import FILL_VALUE, analyze_climate_data, drop_fill_values, latest_complete_year
from geometry import calculate_polygon_centroid
from crop_database import CROP_DATABASE
from scoring import (
    HEAT_MARGIN,
    WEAKEST_FACTOR_MARGIN,
    calculate_crop_suitability,
    growing_season_climate,
    heat_score,
    temperature_response,
    temperature_score,
    water_score,
)
from tests.golden import nasa as nasa_fixture


def nasa(days):
    """[(tmax, tmin, precip), ...] in NASA POWER shape."""
    keys = [f"2025{(d // 28) + 1:02d}{(d % 28) + 1:02d}" for d in range(len(days))]
    return {
        "properties": {
            "parameter": {
                "T2M_MAX": dict(zip(keys, [d[0] for d in days])),
                "T2M_MIN": dict(zip(keys, [d[1] for d in days])),
                "PRECTOTCORR": dict(zip(keys, [d[2] for d in days])),
            }
        }
    }


class TestGrowingSeasonClimate:
    def test_only_days_above_base_count(self):
        season = growing_season_climate(nasa([(24, 16, 3), (22, 14, 2), (4, -4, 10)]), crop_base_temp=8)
        assert season["days"] == 2
        assert season["mean_temp"] == pytest.approx(19)
        assert season["precipitation_mm"] == pytest.approx(5)  # winter rain is not counted

    def test_no_growing_days(self):
        season = growing_season_climate(nasa([(2, -6, 4)]), crop_base_temp=8)
        assert season == {"days": 0, "mean_temp": None, "precipitation_mm": 0.0}


class TestTemperatureResponse:
    # base 10, optimal 20–30, upper 40
    @pytest.mark.parametrize(("t", "r"), [(10, 0), (15, 0.5), (20, 1), (25, 1), (30, 1), (35, 0.5), (40, 0), (5, 0), (45, 0)])
    def test_trapezoid(self, t, r):
        assert temperature_response(t, 10, 20, 30, 40) == pytest.approx(r)


class TestTemperatureScore:
    crop = {"base_temp": 10, "upper_temp": 40, "optimal_temp_min": 20, "optimal_temp_max": 30}

    def test_averages_over_growing_days_only(self):
        # Two days at 25 (ideal), one at 15 (half), one at 5 (below base: not a growing day).
        score, days, mean = temperature_score(nasa([(28, 22, 0), (28, 22, 0), (18, 12, 0), (8, 2, 0)]), self.crop)
        assert days == 3
        assert score == pytest.approx(100 * (1 + 1 + 0.5) / 3)
        assert mean == pytest.approx((25 + 25 + 15) / 3)

    def test_only_the_calendar_months_count(self):
        # Days 0–27 are January (cool, 15), days 28–55 February (ideal, 25); the crop grows in February only.
        data = nasa([(18, 12, 0)] * 28 + [(28, 22, 0)] * 28)
        assert temperature_score(data, self.crop, {2})[:2] == (100.0, 28)
        assert temperature_score(data, self.crop)[0] == pytest.approx(75)

    def test_no_growing_days(self):
        assert temperature_score(nasa([(4, -4, 0)]), self.crop) == (0.0, 0, None)


class TestHeatScore:
    def test_margin(self):
        assert heat_score(HEAT_MARGIN) == 100
        assert heat_score(2.0) == 100
        assert heat_score(1.0) == 80
        assert heat_score(0.5) == 40
        assert 80 < heat_score(1.1) < 100


class TestWeakestFactor:
    def test_too_cold_cannot_be_outvoted(self):
        # Okra in Munich: plenty of heat units, sun and rain, but too cold while growing.
        data = nasa_fixture("munich")
        okra = calculate_crop_suitability(CROP_DATABASE["okra"], analyze_climate_data(data), data, 0.7, 1_000)
        s = okra["scores"]
        assert okra["overall_score"] <= min(s["gdd"], s["sunlight"], s["temperature"]) + WEAKEST_FACTOR_MARGIN + 0.05
        assert okra["metrics"]["limited_by"] == "temperature"
        assert okra["overall_score"] < 80

    def test_water_is_not_a_limit(self):
        # Cairo's dry climate: crops that need watering are not dragged down to their water score.
        data = nasa_fixture("cairo")
        okra = calculate_crop_suitability(CROP_DATABASE["okra"], analyze_climate_data(data), data, 0.7, 1_000)
        assert okra["metrics"]["limited_by"] != "water"
        assert okra["overall_score"] > okra["scores"]["water"] + WEAKEST_FACTOR_MARGIN


class TestWaterScore:
    def test_on_target(self):
        assert water_score(500, 500) == 100

    def test_surplus_costs_less_than_shortfall(self):
        for gap in (100, 200, 300, 500, 800):
            assert water_score(500 + gap, 500) > water_score(500 - gap, 500), gap

    def test_shortfall_bands_unchanged(self):
        assert water_score(400, 500) == pytest.approx(80)
        assert water_score(250, 500) == pytest.approx(50)

    def test_heavy_surplus_floors_at_60(self):
        assert water_score(2_000, 250) == 60

    def test_munich_lettuce_no_longer_punished_for_rain(self):
        # ~1,000 mm over the growing days against a 250 mm need used to score 20.
        assert water_score(1_000, 250) >= 60


class TestCentroid:
    # L-shaped plot: the corner average sits away from the true centre of the shape.
    l_shape = [(0, 0), (0, 3), (1, 3), (1, 1), (3, 1), (3, 0)]

    def test_uses_area_centroid(self):
        lat, lon = calculate_polygon_centroid(self.l_shape)
        assert (lat, lon) == pytest.approx((1.1, 1.1), abs=0.01)

    def test_closing_point_does_not_bias(self):
        assert calculate_polygon_centroid(self.l_shape + [self.l_shape[0]]) == pytest.approx(calculate_polygon_centroid(self.l_shape))


class TestNasaData:
    def test_fill_values_are_dropped(self):
        data = {"properties": {"parameter": {"T2M_MAX": {"20251230": 3.1, "20251231": FILL_VALUE}}}}
        assert drop_fill_values(data)["properties"]["parameter"]["T2M_MAX"] == {"20251230": 3.1}

    def test_latest_complete_year(self):
        assert latest_complete_year(date(2026, 11, 9)) == 2025
        assert latest_complete_year(date(2027, 1, 2)) == 2026


class TestHeatCap:
    def svalbard(self, crop_id):
        data = nasa_fixture("svalbard")
        from climate import analyze_climate_data

        return calculate_crop_suitability(CROP_DATABASE[crop_id], analyze_climate_data(data), data, 0.7, 1_000)

    def test_crop_short_of_heat_cannot_outscore_its_heat_score(self):
        radish = self.svalbard("radishes")
        assert radish["scores"]["gdd"] < 50
        assert radish["overall_score"] <= radish["scores"]["gdd"]
        assert radish["metrics"]["heat_capped"] is True
        assert radish["category"] == "Poor"

    def test_crops_with_enough_heat_are_not_capped(self):
        data = nasa_fixture("munich")
        from climate import analyze_climate_data

        lettuce = calculate_crop_suitability(CROP_DATABASE["lettuce"], analyze_climate_data(data), data, 0.7, 1_000)
        assert lettuce["scores"]["gdd"] == 100
        assert lettuce["metrics"]["heat_capped"] is False
