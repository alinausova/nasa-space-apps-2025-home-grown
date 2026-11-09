import { describe, expect, it } from 'vitest';
import { locate } from './location';

function fakeGeo(outcome: { coords: [number, number] } | { code: number }): Geolocation {
  return {
    getCurrentPosition(ok: PositionCallback, fail?: PositionErrorCallback | null) {
      if ('coords' in outcome) ok({ coords: { longitude: outcome.coords[0], latitude: outcome.coords[1] } } as GeolocationPosition);
      else fail?.({ code: outcome.code, PERMISSION_DENIED: 1 } as GeolocationPositionError);
    },
  } as Geolocation;
}

describe('locate', () => {
  it('returns the position as [lng, lat]', async () => {
    expect(await locate(fakeGeo({ coords: [11.5, 48.1] }))).toEqual({ status: 'ok', center: [11.5, 48.1] });
  });

  it('tells a refusal apart from other failures', async () => {
    expect(await locate(fakeGeo({ code: 1 }))).toEqual({ status: 'denied' });
    expect(await locate(fakeGeo({ code: 3 }))).toEqual({ status: 'unavailable' });
  });

  it('is unavailable without geolocation', async () => {
    expect(await locate(undefined)).toEqual({ status: 'unavailable' });
  });
});
