/**
 * API Client for Home Grown Backend
 * Handles all communication with the FastAPI backend
 */

// Environment-aware API URL
const API_URL = import.meta.env.PROD
  ? 'https://home-grown-api.onrender.com'  // Update this when you deploy to Render
  : 'http://localhost:8000';

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

// Add more API functions as needed for your NASA data endpoints
