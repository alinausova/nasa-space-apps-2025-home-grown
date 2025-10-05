/**
 * API Client for Home Grown Backend
 * Handles all communication with the FastAPI backend
 */

// Environment-aware API URL - configured via VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch('/api/health');
}

/**
 * Example endpoint
 */
export async function getExample(): Promise<any> {
  return apiFetch('/api/example');
}

/**
 * Get data from external API (via backend)
 */
export async function getExternalData(): Promise<any> {
  return apiFetch('/api/external-example');
}

/**
 * Get cached data
 */
export async function getCachedData(): Promise<any> {
  return apiFetch('/api/cached-data');
}

/**
 * Types for crop recommendations API
 */
export interface CropRecommendation {
  crop_id: string;
  crop_name: string;
  season: string;
  frost_tolerance: string;
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
    metrics: {
      total_gdd: number;
      required_gdd: number;
      avg_sun_hours: number;
      required_sun_hours: number;
      annual_precipitation_mm: number;
      required_water_mm: number;
      irrigation_needed_mm: number;
    };
    yield_estimate: {
      yield_per_m2_kg: number;
      total_yield_kg: number;
      total_yield_tons: number;
      yield_category: string;
      yield_range: {
        lower_kg_m2: number;
        average_kg_m2: number;
        upper_kg_m2: number;
      };
    };
  };
}

export interface RecommendationsResponse {
  location: {
    center_latitude: number;
    center_longitude: number;
    area_m2: number;
    area_hectares: number;
  };
  year: number;
  climate_summary: {
    avg_temp_max: number;
    avg_temp_min: number;
    annual_precipitation_mm: number;
    avg_sun_hours_daily: number;
  };
  recommendations: CropRecommendation[];
  total_suitable_crops: number;
  data_source: string;
}

/**
 * Get crop recommendations for a polygon
 * Coordinates should be in [lon, lat] format (GeoJSON standard)
 */
export async function getCropRecommendations(
  coordinates: number[][][]
): Promise<RecommendationsResponse> {
  // Convert from [lon, lat] to [lat, lon] for API
  const apiCoordinates = coordinates[0].map(([lon, lat]) => [lat, lon]);

  return apiFetch('/recommendations/polygon?limit=25', {
    method: 'POST',
    body: JSON.stringify({
      coordinates: apiCoordinates,
    }),
  });
}
