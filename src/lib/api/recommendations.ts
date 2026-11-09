import { apiFetch } from './client';

export type LngLat = [number, number];

export function toApiCoordinates(ring: LngLat[]): [number, number][] {
  // GeoJSON rings repeat the first point at the end; the API wants each corner once, as [lat, lon].
  const open = ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1] ? ring.slice(0, -1) : ring;
  return open.map(([lng, lat]) => [lat, lng]);
}

export function wakeServer(): void {
  // Render's free tier sleeps; an early ping shortens the first analysis.
  apiFetch('/api/health').catch(() => {});
}
