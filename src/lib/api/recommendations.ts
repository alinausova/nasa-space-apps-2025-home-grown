import { apiFetch } from './client';
import type { RecommendationsResponse } from './types';

export type LngLat = [number, number];

/** Enough for every crop in the database, so filters and counts see all usable crops. */
const LIMIT = 50;

export function toApiCoordinates(ring: LngLat[]): [number, number][] {
  // GeoJSON rings repeat the first point at the end; the API wants each corner once, as [lat, lon].
  const open = ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1] ? ring.slice(0, -1) : ring;
  return open.map(([lng, lat]) => [lat, lng]);
}

export function getRecommendations(
  ring: LngLat[],
  { signal, fetchImpl }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<RecommendationsResponse> {
  return apiFetch<RecommendationsResponse>(
    `/recommendations/polygon?limit=${LIMIT}`,
    {
      method: 'POST',
      body: JSON.stringify({ coordinates: toApiCoordinates(ring) }),
      signal,
    },
    fetchImpl,
  );
}

export function wakeServer(): void {
  // Render's free tier sleeps; an early ping shortens the first analysis.
  apiFetch('/api/health').catch(() => {});
}
