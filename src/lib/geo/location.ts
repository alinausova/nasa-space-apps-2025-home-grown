import type { LngLat } from '../derive/geo';

export type LocateResult = { status: 'ok'; center: LngLat } | { status: 'denied' | 'unavailable' };

/** The browser's position. "denied" when location is switched off for the site. */
export function locate(geolocation: Geolocation | undefined = globalThis.navigator?.geolocation, timeoutMs = 10_000): Promise<LocateResult> {
  if (!geolocation) return Promise.resolve({ status: 'unavailable' });
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => resolve({ status: 'ok', center: [position.coords.longitude, position.coords.latitude] }),
      (error) => resolve({ status: error.code === error.PERMISSION_DENIED || error.code === 1 ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
