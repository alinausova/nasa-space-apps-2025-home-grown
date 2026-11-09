from datetime import date

import pytest

from climate import FILL_VALUE, drop_fill_values, latest_complete_year
from geometry import calculate_polygon_centroid
from crop_database import CROP_DATABASE
from scoring import calculate_crop_suitability, growing_season_climate, temperature_score, water_score
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


class TestTemperatureScore:
    @pytest.mark.parametrize(("mean", "score"), [(18, 100), (21, 100), (23, 80), (26, 60), (30, 50), (32, 40), (None, 0)])
    def test_bands_around_ideal_middle(self, mean, score):
        assert temperature_score(mean, 15, 21) == score  # middle 18


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
