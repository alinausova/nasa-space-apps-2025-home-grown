// Result shape the screens read; built from the v2 analysis responses by toResults() in analysis.ts.

export type Season = 'warm' | 'cool' | string;
export type FrostTolerance = 'tender' | 'half_hardy' | 'hardy' | 'very_hardy' | string;

export interface SuitabilityMetrics {
  total_gdd: number;
  required_gdd: number;
  estimated_sun_hours: number;
  adjusted_sun_hours: number;
  sunshine_factor: number;
  growing_days: number;
  min_sun_hours: number;
  optimal_sun_hours: number;
  annual_precipitation_mm: number;
  required_water_mm: number;
  irrigation_needed_mm: number;
  /** Added in the v1 back end; absent on older deployments. */
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  base_temp?: number;
  /** v2 back end: growing-season figures and whether the score was capped by missing heat. */
  season_mean_temp?: number | null;
  season_precipitation_mm?: number;
  heat_capped?: boolean;
}

export interface YieldEstimate {
  yield_per_m2_kg: number;
  total_yield_kg: number;
  total_yield_tons: number;
  yield_category: string;
  yield_range: {
    lower_kg_m2: number;
    average_kg_m2: number;
    upper_kg_m2: number;
  };
}

/** Months (1–12) to sow or plant out, grow and harvest, simulated on the plot's year. */
export interface CropCalendar {
  /** "plant_out": seedlings started indoors; the first row is when they go outside. */
  mode: 'sow' | 'plant_out';
  sow: number[];
  grow: number[];
  harvest: number[];
}

export interface CropRecommendation {
  /** Null when no sowing works outdoors here; absent in responses from before v3. */
  calendar?: CropCalendar | null;
  crop_id: string;
  crop_name: string;
  season: Season;
  frost_tolerance: FrostTolerance;
  drought_resistance: string;
  suitability: {
    overall_score: number;
    category: string;
    scores: {
      gdd: number;
      sunlight: number;
      temperature: number;
      water: number;
    };
    metrics: SuitabilityMetrics;
    yield_estimate: YieldEstimate;
  };
}

export interface MonthlyTemperature {
  month: number;
  month_name: string;
  avg_temp_max: number;
  avg_temp_min: number;
  avg_temp: number;
}

export interface RecommendationsResponse {
  location: {
    center_latitude: number;
    center_longitude: number;
    area_m2: number;
    area_hectares: number;
  };
  year: number;
  sunshine_factor: number;
  data_sources?: {
    nasa_power: boolean;
    landsat_surface_temp: boolean;
    landsat_dates_available: number;
  };
  climate_summary: {
    avg_temp_max: number;
    avg_temp_min: number;
    annual_precipitation_mm: number;
    representative_sun_hours_daily: number;
    note?: string;
  };
  recommendations: CropRecommendation[];
  total_suitable_crops: number;
  total_filtered_by_sunlight?: number;
  monthly_temperature_averages?: {
    monthly_averages: MonthlyTemperature[];
    years_analyzed: number;
  };
  llm_summary?: string;
  llm_err?: string;
}
