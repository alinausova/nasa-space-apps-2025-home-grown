from collections import defaultdict

from crop_database import CROP_DATABASE


def test_crop_names_are_unique():
    names = [c["name"].strip().lower() for c in CROP_DATABASE.values()]
    assert len(names) == len(set(names))


def test_every_crop_names_its_species():
    for crop_id, crop in CROP_DATABASE.items():
        assert crop.get("species"), crop_id


def test_a_species_repeats_only_as_distinct_groups():
    # Kale, broccoli, cabbage and cauliflower are all Brassica oleracea: fine, as long as each says which group it is.
    # A second entry for the same plant (chilli next to peppers, courgette next to squash) has to declare a group too.
    by_species = defaultdict(list)
    for crop_id, crop in CROP_DATABASE.items():
        by_species[crop["species"]].append(crop_id)
    for species, ids in by_species.items():
        if len(ids) == 1:
            continue
        groups = [CROP_DATABASE[i].get("group") for i in ids]
        assert all(groups), f"{species} appears as {ids}; each needs a group"
        assert len(set(groups)) == len(groups), f"{species}: groups repeat in {ids}"


def test_every_crop_has_an_icon():
    import json
    from pathlib import Path

    icons = json.loads((Path(__file__).parents[2] / "src/assets/crop-icons/crop-icons.json").read_text())
    missing = [c["name"] for c in CROP_DATABASE.values() if c["name"] not in icons]
    assert not missing, f"No icon in src/assets/crop-icons/crop-icons.json for {missing}"
