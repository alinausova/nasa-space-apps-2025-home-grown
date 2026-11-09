import json

from climate import analyze_climate_data
from scoring import process_crop_recommendations
from tests.golden import FIXTURES, snapshot


def test_scores_match_golden_snapshot():
    """Scores for real 2023 NASA POWER data must not change unless golden_scores.json is regenerated on purpose."""
    expected = json.loads((FIXTURES / "golden_scores.json").read_text())
    actual = json.loads(json.dumps(snapshot(analyze_climate_data, process_crop_recommendations), sort_keys=True))

    for plot in expected:
        assert actual[plot]["filtered_by_sunlight"] == expected[plot]["filtered_by_sunlight"], plot
        changed = {
            crop: (expected[plot]["crops"][crop], actual[plot]["crops"].get(crop))
            for crop in expected[plot]["crops"]
            if actual[plot]["crops"].get(crop) != expected[plot]["crops"][crop]
        }
        assert not changed, f"{plot}: {len(changed)} crops changed, e.g. {next(iter(changed.items()))}"
        assert set(actual[plot]["crops"]) == set(expected[plot]["crops"]), plot
