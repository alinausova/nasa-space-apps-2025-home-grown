import pytest

from crop_database import CROP_DATABASE
from geometry import calculate_polygon_area_m2, calculate_polygon_centroid
from scoring import calculate_gdd, calculate_growing_season_sunshine, calculate_yield_estimate


def nasa_days(days):
    """Minimal NASA POWER shape from [(tmax, tmin, solar_mj), ...]."""
    keys = [f"202301{d + 1:02d}" for d in range(len(days))]
    return {
        "properties": {
            "parameter": {
                "T2M_MAX": dict(zip(keys, [d[0] for d in days])),
                "T2M_MIN": dict(zip(keys, [d[1] for d in days])),
                "ALLSKY_SFC_SW_DWN": dict(zip(keys, [d[2] for d in days])),
            }
        }
    }


class TestGdd:
    def test_normal_day(self):
        assert calculate_gdd(20, 10, base_temp=5, upper_temp=30) == 10

    def test_cold_day_gives_nothing(self):
        assert calculate_gdd(4, -2, base_temp=5, upper_temp=30) == 0

    def test_highs_capped_at_upper_limit(self):
        assert calculate_gdd(40, 20, base_temp=10, upper_temp=30) == 15  # (30 + 20) / 2 - 10

    def test_lows_raised_to_base(self):
        assert calculate_gdd(20, 0, base_temp=10, upper_temp=30) == 5  # (20 + 10) / 2 - 10


class TestSunshine:
    def test_only_growing_days_count(self):
        data = nasa_days([(20, 10, 20), (2, -4, 5)])
        result = calculate_growing_season_sunshine(data, crop_base_temp=5, sunshine_factor=1.0)
        assert result["growing_days"] == 1
        assert result["total_days"] == 2
        assert result["estimated_sun_hours"] == pytest.approx(20 * 0.278 / 0.35, abs=0.01)

    def test_shade_factor_applies(self):
        data = nasa_days([(20, 10, 20)])
        result = calculate_growing_season_sunshine(data, crop_base_temp=5, sunshine_factor=0.7)
        assert result["adjusted_sun_hours"] == pytest.approx(result["estimated_sun_hours"] * 0.7, abs=0.01)

    def test_capped_at_16_hours(self):
        data = nasa_days([(25, 15, 40)])
        assert calculate_growing_season_sunshine(data, 5)["estimated_sun_hours"] == 16

    def test_no_growing_days(self):
        data = nasa_days([(0, -10, 5)])
        result = calculate_growing_season_sunshine(data, 5)
        assert result["growing_days"] == 0
        assert result["adjusted_sun_hours"] == 0


class TestYield:
    crop = CROP_DATABASE["tomatoes"]  # 3.0 / 5.0 / 8.0 kg/m²

    @pytest.mark.parametrize(
        ("score", "per_m2"),
        [(95, 8.0), (90, 8.0), (85, 6.5), (80, 5.0), (75, 4.0), (70, 3.0), (60, 2.25), (50, 1.5), (25, 0.75)],
    )
    def test_bands(self, score, per_m2):
        assert calculate_yield_estimate(self.crop, score, 100)["yield_per_m2_kg"] == pytest.approx(per_m2, abs=0.01)

    def test_seventy_percent_planted(self):
        result = calculate_yield_estimate(self.crop, 95, 1_000)
        assert result["total_yield_kg"] == pytest.approx(8.0 * 1_000 * 0.7)


class TestGeometry:
    # ~100 m × 100 m square near Munich, as (lat, lon).
    square = [(48.14, 11.56), (48.14, 11.56135), (48.1409, 11.56135), (48.1409, 11.56)]

    def test_area(self):
        assert calculate_polygon_area_m2(self.square) == pytest.approx(10_000, rel=0.02)

    def test_degenerate(self):
        assert calculate_polygon_area_m2(self.square[:2]) == 0

    def test_centroid_is_corner_average(self):
        lat, lon = calculate_polygon_centroid(self.square)
        assert lat == pytest.approx(48.14045)
        assert lon == pytest.approx(11.560675)
