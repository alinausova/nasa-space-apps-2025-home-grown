from fastapi.testclient import TestClient

import main
from crop_database import CROP_DATABASE

client = TestClient(main.app)

# ~100 m × 100 m in Munich, as (lat, lon).
SMALL = [[48.1478, 11.5640], [48.1478, 11.5653], [48.1469, 11.5653], [48.1469, 11.5640]]
# ~1.5 km × 1.5 km, over the 1 km² limit.
LARGE = [[48.10, 11.50], [48.10, 11.52], [48.1135, 11.52], [48.1135, 11.50]]


def climate(coordinates=SMALL, params=None, headers=None, **body):
    return client.post("/analysis/climate", params=params, headers=headers, json={"coordinates": coordinates, **body})


def analyse(**body):
    pid = climate(**body).json()["plot_id"]
    return client.post("/analysis/crops", json={"plot_id": pid}).json()


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_old_endpoint_is_gone(stubs):
    assert client.post("/recommendations/polygon", json={"coordinates": SMALL}).status_code == 404


def test_landsat_is_reported_as_surface_heat(stubs):
    landsat = analyse()["landsat"]
    assert landsat["status"] == "ok"
    heat = landsat["surface_heat"]
    # The stub scene reads 41.2 °C at the surface in mid July.
    assert heat["scenes"] == 1
    assert heat["offset_c"] == round(41.2 - heat["mean_air_temp_max_c"], 1)


def test_crops_include_crop_temperatures_and_are_sorted(stubs):
    crops = analyse()["crops"]
    assert len(crops) == len(CROP_DATABASE)
    scores = [c["suitability"]["overall_score"] for c in crops]
    assert scores == sorted(scores, reverse=True)
    for c in crops:
        metrics = c["suitability"]["metrics"]
        crop = CROP_DATABASE[c["crop_id"]]
        assert metrics["optimal_temp_min"] == crop["optimal_temp_min"]
        assert metrics["optimal_temp_max"] == crop["optimal_temp_max"]
        assert metrics["base_temp"] == crop["base_temp"]


def test_climate_returns_twelve_months_with_rain(stubs):
    monthly = climate().json()["monthly"]
    assert [m["month"] for m in monthly] == list(range(1, 13))
    assert all("precip_mm" in m for m in monthly)


def test_area_limit(stubs):
    response = climate(LARGE)
    assert response.status_code == 400
    assert "too large" in response.json()["detail"]


def test_rejects_out_of_range_coordinates(stubs):
    assert climate([[95, 11], [48, 11.1], [48.1, 11]]).status_code == 422
    assert climate([[48, 200], [48, 11.1], [48.1, 11]]).status_code == 422


def test_rejects_too_few_points(stubs):
    assert climate(SMALL[:2]).status_code == 422


def test_rejects_bad_sunshine_factor(stubs):
    assert climate(sunshine_duration=[1.5]).status_code == 422
    assert climate(sunshine_duration=[0.5]).status_code == 200


def test_rejects_bad_year(stubs):
    assert climate(params={"year": 1900}).status_code == 422


def test_rate_limit_per_client(stubs):
    # The limit is read at import time; check it behaves at its configured value.
    limit = int(main.RECOMMENDATION_RATE_LIMIT.split("/")[0])
    headers = {"X-Forwarded-For": "203.0.113.7, 10.0.0.1"}
    statuses = [climate(headers=headers).status_code for _ in range(limit + 1)]
    assert statuses[:limit] == [200] * limit
    assert statuses[-1] == 429
    # A different client is not affected.
    assert climate(headers={"X-Forwarded-For": "198.51.100.2"}).status_code == 200
