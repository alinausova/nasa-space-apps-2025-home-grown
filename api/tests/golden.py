"""Golden snapshot of crop scores for real NASA POWER data (2023), without Landsat.

Run `uv run python -m tests.golden` (from api/) to regenerate after an intended scoring change,
then review the diff of tests/fixtures/golden_scores.json in the PR.
"""
import json
from pathlib import Path

FIXTURES = Path(__file__).parent / "fixtures"
PLOTS = ["munich", "cairo", "svalbard"]
SUNSHINE_FACTOR = 0.7
AREA_M2 = 10_000


def nasa(name: str) -> dict:
    return json.loads((FIXTURES / f"nasa_{name}_2023.json").read_text())


def snapshot(analyze_climate_data, process_crop_recommendations) -> dict:
    out = {}
    for name in PLOTS:
        data = nasa(name)
        result = process_crop_recommendations(
            {"climate_analysis": analyze_climate_data(data), "primary_year_data": data},
            SUNSHINE_FACTOR,
            AREA_M2,
            min_score=0,
        )
        out[name] = {
            "crops": {
                r["crop_id"]: {
                    "score": r["suitability"]["overall_score"],
                    "category": r["suitability"]["category"],
                    "scores": r["suitability"]["scores"],
                    "yield_per_m2_kg": r["suitability"]["yield_estimate"]["yield_per_m2_kg"],
                    "irrigation_needed_mm": r["suitability"]["metrics"]["irrigation_needed_mm"],
                }
                for r in result["recommendations"]
            },
            "filtered_by_sunlight": sorted(f["crop_id"] for f in result["filtered_crops"]),
        }
    return out


if __name__ == "__main__":
    from climate import analyze_climate_data
    from scoring import process_crop_recommendations

    path = FIXTURES / "golden_scores.json"
    path.write_text(json.dumps(snapshot(analyze_climate_data, process_crop_recommendations), indent=1, sort_keys=True) + "\n")
    print(f"wrote {path}")
