CROP_DATABASE = {
    "tomatoes": {
        "name": "Tomatoes",
        "base_temp": 8.5,
        "upper_temp": 30.5,
        "gdd_required": 1500,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 27,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 500,  # 400-600mm for 90-120 day cycle
        "drought_resistance": "sensitive",  # Extremely drought sensitive
        "germination_temp_min": 10,
        "germination_temp_optimal": 25,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Land & Water - Tomato crop information (https://www.fao.org/land-water/databases-and-software/crop-information/tomato/en/)",
            "germination": "UC Davis, J.F. Harrington - Vegetable Seed Germination",
            "drought": "Agronomy 2019, 9(8):447 - Physiological Responses of Vegetable Crops to Water Stress"
        }
    },
    "lettuce": {
        "name": "Lettuce",
        "base_temp": 4,
        "upper_temp": 28,
        "gdd_required": 600,
        "min_sun_hours": 4,
        "optimal_temp_min": 7,
        "optimal_temp_max": 24,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 250,  # ~250-300mm typical
        "drought_resistance": "moderate",
        "germination_temp_min": 2,
        "germination_temp_optimal": 20,
        "germination_temp_max": 27,
        "sources": {
            "water": "FAO Irrigation and Drainage Paper 56",
            "germination": "UC Davis, J.F. Harrington - Vegetable Seed Germination",
            "drought": "Estimated from crop coefficients"
        }
    },
    "spinach": {
        "name": "Spinach",
        "base_temp": 4.2,
        "upper_temp": 24.5,
        "gdd_required": 500,
        "min_sun_hours": 3,
        "optimal_temp_min": 10,
        "optimal_temp_max": 21,
        "frost_tolerance": "very_hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 200,  # ~200-250mm
        "drought_resistance": "moderate",
        "germination_temp_min": 2,
        "germination_temp_optimal": 18,
        "germination_temp_max": 30,
        "sources": {
            "water": "FAO Irrigation and Drainage Paper 56",
            "germination": "UC Davis - Vegetable Seed Germination",
            "drought": "Estimated from crop type"
        }
    },
    "peppers": {
        "name": "Peppers",
        "base_temp": 10,
        "upper_temp": 34.5,
        "gdd_required": 1400,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 29,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 600,  # 600-900mm depending on variety
        "drought_resistance": "moderate",
        "germination_temp_min": 16,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Irrigation and Drainage Paper 56",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Estimated from solanaceae family characteristics"
        }
    },
    "carrots": {
        "name": "Carrots",
        "base_temp": 5,
        "upper_temp": 29,
        "gdd_required": 800,
        "min_sun_hours": 4,
        "optimal_temp_min": 16,
        "optimal_temp_max": 21,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 350,  # 350-500mm
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Irrigation and Drainage Paper 56",
            "germination": "UC Davis - Vegetable Seed Germination",
            "drought": "Estimated from root crop characteristics"
        }
    },
    "beans": {
        "name": "Beans",
        "base_temp": 9.5,
        "upper_temp": 32.5,
        "gdd_required": 900,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 27,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 300,  # 300-500mm
        "drought_resistance": "moderate_sensitive",  # Moderately water stress sensitive
        "germination_temp_min": 16,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Irrigation and Drainage Paper 24",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Agronomy 2019, 9(8):447 - beans moderately sensitive to water stress"
        }
    },
    "kale": {
        "name": "Kale",
        "base_temp": 4.2,
        "upper_temp": 27,
        "gdd_required": 700,
        "min_sun_hours": 4,
        "optimal_temp_min": 15,
        "optimal_temp_max": 23,
        "frost_tolerance": "very_hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 380,  # Similar to cabbage 350-500mm
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 - Brassica group",
            "germination": "UC Davis - similar to cabbage",
            "drought": "Estimated from brassica family"
        }
    },
    "cucumbers": {
        "name": "Cucumbers",
        "base_temp": 10,
        "upper_temp": 35,
        "gdd_required": 1100,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 29,
        "frost_tolerance": "tender",
        "water_needs": "high",
        "season": "warm",
        "seasonal_water_mm": 500,  # 400-600mm
        "drought_resistance": "sensitive",
        "germination_temp_min": 16,
        "germination_temp_optimal": 30,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Irrigation and Drainage Paper 56",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Cucurbits generally drought sensitive"
        }
    },
    "radishes": {
        "name": "Radishes",
        "base_temp": 4,
        "upper_temp": 32.5,
        "gdd_required": 350,
        "min_sun_hours": 4,
        "optimal_temp_min": 10,
        "optimal_temp_max": 18,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 200,  # Short season ~200-300mm
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 27,
        "germination_temp_max": 32,
        "sources": {
            "water": "FAO Paper 33 - short season vegetables",
            "germination": "UC Davis - Vegetable Seed Germination",
            "drought": "Root crops generally moderate tolerance"
        }
    },
    "arugula": {
        "name": "Arugula",
        "base_temp": 4,
        "upper_temp": 27,
        "gdd_required": 400,
        "min_sun_hours": 3,
        "optimal_temp_min": 10,
        "optimal_temp_max": 21,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 250,  # Similar to lettuce
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 20,
        "germination_temp_max": 30,
        "sources": {
            "water": "Estimated from leafy greens group",
            "germination": "Similar to other brassicas",
            "drought": "Leafy greens moderate tolerance"
        }
    },

    # Additional crops from the paper
    "eggplant": {
        "name": "Eggplant",
        "base_temp": 10.5,
        "upper_temp": 35,
        "gdd_required": 1300,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 29,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 550,  # Similar to tomato, 500-600mm
        "drought_resistance": "moderate",
        "germination_temp_min": 16,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 - Solanaceae",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Similar to tomato family"
        }
    },
    "broccoli": {
        "name": "Broccoli",
        "base_temp": 4.7,
        "upper_temp": 27,
        "gdd_required": 800,
        "min_sun_hours": 5,
        "optimal_temp_min": 15,
        "optimal_temp_max": 21,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 450,  # 350-500mm
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 - Cole crops",
            "germination": "UC Davis - Vegetable Seed Germination",
            "drought": "Brassicas moderate tolerance"
        }
    },
    "cabbage": {
        "name": "Cabbage",
        "base_temp": 4.2,
        "upper_temp": 27,
        "gdd_required": 900,
        "min_sun_hours": 5,
        "optimal_temp_min": 15,
        "optimal_temp_max": 21,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 450,  # 350-500mm
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 Table 12",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Sustainability 2020, 12(10):3945"
        }
    },
    "cauliflower": {
        "name": "Cauliflower",
        "base_temp": 4.2,
        "upper_temp": 30,
        "gdd_required": 850,
        "min_sun_hours": 5,
        "optimal_temp_min": 15,
        "optimal_temp_max": 21,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 450,
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56",
            "germination": "UC Davis",
            "drought": "Similar to cabbage"
        }
    },
    "onions": {
        "name": "Onions",
        "base_temp": 3,
        "upper_temp": 35,
        "gdd_required": 1000,
        "min_sun_hours": 5,
        "optimal_temp_min": 13,
        "optimal_temp_max": 24,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 500,  # 350-550mm
        "drought_resistance": "moderate",
        "germination_temp_min": 2,
        "germination_temp_optimal": 24,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 - bulb vegetables",
            "germination": "UC Davis",
            "drought": "Shallow roots, moderate tolerance"
        }
    },
    "garlic": {
        "name": "Garlic",
        "base_temp": 3,
        "upper_temp": 29,
        "gdd_required": 1200,
        "min_sun_hours": 5,
        "optimal_temp_min": 13,
        "optimal_temp_max": 24,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 450,
        "drought_resistance": "moderate",
        "germination_temp_min": 2,
        "germination_temp_optimal": 20,
        "germination_temp_max": 30,
        "sources": {
            "water": "FAO Paper 56",
            "germination": "Similar to onions",
            "drought": "Similar to onions"
        }
    },
    "potato": {
        "name": "Potato",
        "base_temp": 3.5,
        "upper_temp": 30,
        "gdd_required": 1100,
        "min_sun_hours": 5,
        "optimal_temp_min": 15,
        "optimal_temp_max": 21,
        "frost_tolerance": "half_hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 500,  # 500-700mm
        "drought_resistance": "moderate",
        "germination_temp_min": 7,
        "germination_temp_optimal": 24,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 Table 12",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Moderate sensitivity, critical during tuber initiation"
        }
    },
    "sweet_potato": {
        "name": "Sweet Potato",
        "base_temp": 8,
        "upper_temp": 34,
        "gdd_required": 1400,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 29,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 600,  # 500-700mm
        "drought_resistance": "tolerant",  # More drought tolerant than potato
        "germination_temp_min": 16,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56",
            "germination": "UC Davis",
            "drought": "International Journal of AgriScience 2021 - orange fleshed sweet potato drought tolerance"
        }
    },
    "squash": {
        "name": "Squash",
        "base_temp": 9,
        "upper_temp": 35,
        "gdd_required": 1000,
        "min_sun_hours": 6,
        "optimal_temp_min": 18,
        "optimal_temp_max": 27,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 450,  # 400-600mm
        "drought_resistance": "moderate",
        "germination_temp_min": 16,
        "germination_temp_optimal": 30,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Paper 56 - cucurbits",
            "germination": "UC Davis",
            "drought": "Cucurbits moderate sensitivity"
        }
    },
    "pumpkin": {
        "name": "Pumpkin",
        "base_temp": 8.6,
        "upper_temp": 35,
        "gdd_required": 1100,
        "min_sun_hours": 6,
        "optimal_temp_min": 18,
        "optimal_temp_max": 27,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 500,  # 400-650mm
        "drought_resistance": "moderate",
        "germination_temp_min": 16,
        "germination_temp_optimal": 30,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Paper 56",
            "germination": "UC Davis",
            "drought": "Similar to squash"
        }
    },
    "melon": {
        "name": "Melon",
        "base_temp": 10,
        "upper_temp": 38,  # Adjusted from 41.5 which seems too high
        "gdd_required": 1200,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 29,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 400,  # 400-600mm
        "drought_resistance": "moderate",
        "germination_temp_min": 16,
        "germination_temp_optimal": 30,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Paper 56 - melon, cantaloupe",
            "germination": "UC Davis",
            "drought": "Cucurbits moderate"
        }
    },
    "watermelon": {
        "name": "Watermelon",
        "base_temp": 11.35,
        "upper_temp": 37,
        "gdd_required": 1300,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 32,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 500,  # 400-600mm
        "drought_resistance": "moderate",
        "germination_temp_min": 16,
        "germination_temp_optimal": 32,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Paper 56",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Deep roots, moderate tolerance"
        }
    },
    "strawberries": {
        "name": "Strawberries",
        "base_temp": 3,
        "upper_temp": 30,
        "gdd_required": 800,
        "min_sun_hours": 6,
        "optimal_temp_min": 15,
        "optimal_temp_max": 26,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 450,  # 400-500mm
        "drought_resistance": "sensitive",  # Shallow roots
        "germination_temp_min": 10,
        "germination_temp_optimal": 21,
        "germination_temp_max": 30,
        "sources": {
            "water": "FAO Paper 56 - berries",
            "germination": "UC Davis",
            "drought": "Shallow-rooted, sensitive"
        }
    },
    "peas": {
        "name": "Peas",
        "base_temp": 4.75,
        "upper_temp": 27,
        "gdd_required": 700,
        "min_sun_hours": 5,
        "optimal_temp_min": 10,
        "optimal_temp_max": 21,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 350,  # 350-500mm
        "drought_resistance": "moderate_sensitive",  # Moderately sensitive
        "germination_temp_min": 4,
        "germination_temp_optimal": 24,
        "germination_temp_max": 30,
        "sources": {
            "water": "FAO Paper 56 - legumes",
            "germination": "UC Davis",
            "drought": "Agronomy 2019 - peas moderately sensitive"
        }
    },
    "corn": {
        "name": "Corn/Maize",
        "base_temp": 9,
        "upper_temp": 34.5,
        "gdd_required": 1400,
        "min_sun_hours": 6,
        "optimal_temp_min": 21,
        "optimal_temp_max": 32,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 550,  # 500-800mm depending on variety
        "drought_resistance": "moderate_sensitive",
        "germination_temp_min": 10,
        "germination_temp_optimal": 30,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Paper 56 Table 12 - maize",
            "germination": "UC Davis, J.F. Harrington",
            "drought": "Agronomy 2019 - moderately sensitive, critical at tasseling"
        }
    },
    "basil": {
        "name": "Basil",
        "base_temp": 10.95,
        "upper_temp": 35,
        "gdd_required": 600,
        "min_sun_hours": 6,
        "optimal_temp_min": 18,
        "optimal_temp_max": 27,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 300,  # Herbs ~250-400mm
        "drought_resistance": "moderate",
        "germination_temp_min": 18,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "Estimated from herb requirements",
            "germination": "UC Davis",
            "drought": "Aromatic herbs moderate tolerance"
        }
    },
    "parsley": {
        "name": "Parsley",
        "base_temp": 4,
        "upper_temp": 27,
        "gdd_required": 500,
        "min_sun_hours": 4,
        "optimal_temp_min": 10,
        "optimal_temp_max": 21,
        "frost_tolerance": "hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 300,
        "drought_resistance": "moderate",
        "germination_temp_min": 4,
        "germination_temp_optimal": 21,
        "germination_temp_max": 30,
        "sources": {
            "water": "Estimated from herb crops",
            "germination": "UC Davis",
            "drought": "Moderate tolerance"
        }
    },
    "wheat": {
        "name": "Wheat",
        "base_temp": 0,
        "upper_temp": 33,
        "gdd_required": 2000,
        "min_sun_hours": 5,
        "optimal_temp_min": 15,
        "optimal_temp_max": 24,
        "frost_tolerance": "very_hardy",
        "water_needs": "moderate",
        "season": "cool",
        "seasonal_water_mm": 550,  # 450-650mm depending on variety
        "drought_resistance": "moderate_tolerant",
        "germination_temp_min": 4,
        "germination_temp_optimal": 24,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 Table 12 - wheat",
            "germination": "UC Davis",
            "drought": "Frontiers Plant Science 2023 - some varieties drought tolerant"
        }
    },
    "rice": {
        "name": "Rice",
        "base_temp": 10,
        "upper_temp": 38.5,
        "gdd_required": 2200,
        "min_sun_hours": 5,
        "optimal_temp_min": 21,
        "optimal_temp_max": 32,
        "frost_tolerance": "tender",
        "water_needs": "high",
        "season": "warm",
        "seasonal_water_mm": 1000,  # 900-2500mm including flooding
        "drought_resistance": "sensitive",  # Unless aerobic/upland rice
        "germination_temp_min": 10,
        "germination_temp_optimal": 30,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Paper 56 Table 12 - paddy rice",
            "germination": "UC Davis",
            "drought": "Plant Cell Physiol. 2016 - most rice sensitive, breeding efforts ongoing"
        }
    },
    "soybeans": {
        "name": "Soybeans",
        "base_temp": 8.5,
        "upper_temp": 30,
        "gdd_required": 1500,
        "min_sun_hours": 5,
        "optimal_temp_min": 21,
        "optimal_temp_max": 29,
        "frost_tolerance": "tender",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 500,  # 450-700mm
        "drought_resistance": "moderate_sensitive",
        "germination_temp_min": 10,
        "germination_temp_optimal": 30,
        "germination_temp_max": 40,
        "sources": {
            "water": "FAO Paper 56 - soybeans",
            "germination": "UC Davis",
            "drought": "Moderately sensitive to water stress"
        }
    },
    "sunflower": {
        "name": "Sunflower",
        "base_temp": 8,
        "upper_temp": 37.5,
        "gdd_required": 1200,
        "min_sun_hours": 6,
        "optimal_temp_min": 18,
        "optimal_temp_max": 27,
        "frost_tolerance": "half_hardy",
        "water_needs": "moderate",
        "season": "warm",
        "seasonal_water_mm": 500,  # 400-600mm
        "drought_resistance": "tolerant",  # Deep tap root
        "germination_temp_min": 7,
        "germination_temp_optimal": 27,
        "germination_temp_max": 35,
        "sources": {
            "water": "FAO Paper 56 - sunflower",
            "germination": "UC Davis",
            "drought": "Deep rooting system, relatively drought tolerant"
        }
    }
}
