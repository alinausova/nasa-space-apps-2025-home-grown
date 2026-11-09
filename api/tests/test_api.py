from fastapi.testclient import TestClient

import main
from crop_database import CROP_DATABASE

client = TestClient(main.app)

# ~100 m × 100 m in Munich, as (lat, lon).
SMALL = [[48.1478, 11.5640], [48.1478, 11.5653], [48.1469, 11.5653], [48.1469, 11.5640]]
# ~1.5 km × 1.5 km, over the 1 km² limit.
LARGE = [[48.10, 11.50], [48.10, 11.52], [48.1135, 11.52], [48.1135, 11.50]]


def post(coordinates=SMALL, params="", **body):
    return client.post(f"/recommendations/polygon{params}", json={"coordinates": coordinates, **body})


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_recommendations_fetch_nasa_once(stubs):
    response = post(params="?limit=50")
    assert response.status_code == 200, response.text
    assert stubs["nasa"] == 1
    assert stubs["landsat"] == 1
    assert stubs["summary"] == 1


def test_landsat_is_reported_as_surface_heat(stubs):
    body = post().json()
    assert body["landsat"]["status"] == "ok"
    heat = body["landsat"]["surface_heat"]
    # Synthetic NASA year peaks around 25 °C in mid July; the stub scene reads 41.2 °C at the surface.
    assert heat["scenes"] == 1
    assert heat["offset_c"] == round(41.2 - heat["mean_air_temp_max_c"], 1)
    assert body["data_sources"]["landsat_surface_temp"] is True


def test_use_landsat_false_skips_it(stubs):
    body = post(params="?use_landsat=false").json()
    assert stubs["landsat_enabled"] is False
    assert body["landsat"] == {"status": "disabled", "scenes": [], "surface_heat": None}
    assert body["recommendations"]


def test_recommendations_include_crop_temperatures(stubs):
    body = post(params="?limit=50").json()
    assert body["recommendations"], "expected at least one recommendation for a temperate year"
    for rec in body["recommendations"]:
        metrics = rec["suitability"]["metrics"]
        crop = CROP_DATABASE[rec["crop_id"]]
        assert metrics["optimal_temp_min"] == crop["optimal_temp_min"]
        assert metrics["optimal_temp_max"] == crop["optimal_temp_max"]
        assert metrics["base_temp"] == crop["base_temp"]


def test_recommendations_return_monthly_averages(stubs):
    body = post().json()
    months = body["monthly_temperature_averages"]["monthly_averages"]
    assert [m["month"] for m in months] == list(range(1, 13))
    assert body["monthly_temperature_averages"]["years_analyzed"] == 1


def test_recommendations_sorted_and_limited(stubs):
    body = post(params="?limit=5").json()
    scores = [r["suitability"]["overall_score"] for r in body["recommendations"]]
    assert len(scores) <= 5
    assert scores == sorted(scores, reverse=True)


def test_summary_failure_is_reported_not_raised(stubs, monkeypatch):
    def broken(_):
        raise RuntimeError("401 Invalid API Key")

    monkeypatch.setattr(main, "generate_crop_summary", broken)
    body = post().json()
    assert "llm_err" in body
    assert body["recommendations"]


def test_area_limit(stubs):
    response = post(LARGE)
    assert response.status_code == 400
    assert "too large" in response.json()["detail"]


def test_rejects_out_of_range_coordinates(stubs):
    assert post([[95, 11], [48, 11.1], [48.1, 11]]).status_code == 422
    assert post([[48, 200], [48, 11.1], [48.1, 11]]).status_code == 422


def test_rejects_too_few_points(stubs):
    assert post(SMALL[:2]).status_code == 422


def test_rejects_bad_sunshine_factor(stubs):
    assert post(sunshine_duration=[1.5]).status_code == 422
    assert post(sunshine_duration=[0.5]).status_code == 200


def test_rejects_bad_query_params(stubs):
    assert post(params="?limit=500").status_code == 422
    assert post(params="?limit=0").status_code == 422
    assert post(params="?year=1900").status_code == 422
    assert post(params="?min_score=150").status_code == 422


def test_rate_limit_per_client(stubs, monkeypatch):
    # The limit is read at import time; check it behaves at its configured value.
    limit = int(main.RECOMMENDATION_RATE_LIMIT.split("/")[0])
    headers = {"X-Forwarded-For": "203.0.113.7, 10.0.0.1"}
    statuses = [client.post("/recommendations/polygon", json={"coordinates": SMALL}, headers=headers).status_code for _ in range(limit + 1)]
    assert statuses[:limit] == [200] * limit
    assert statuses[-1] == 429
    # A different client is not affected.
    other = client.post("/recommendations/polygon", json={"coordinates": SMALL}, headers={"X-Forwarded-For": "198.51.100.2"})
    assert other.status_code == 200
