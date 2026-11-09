export type LngLat = [number, number];

/** "48.146 N · 11.562 E" */
export function formatLatLng(lat: number, lng: number, digits = 3): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(digits)} ${ns} · ${Math.abs(lng).toFixed(digits)} ${ew}`;
}

/** Centre of a ring's corners (closing point ignored). */
export function ringCenter(ring: LngLat[]): LngLat {
  const closed = ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1];
  const corners = closed ? ring.slice(0, -1) : ring;
  const lng = corners.reduce((s, p) => s + p[0], 0) / corners.length;
  const lat = corners.reduce((s, p) => s + p[1], 0) / corners.length;
  return [lng, lat];
}

interface GeocodeContextPart {
  name?: string;
}

export interface GeocodeFeature {
  properties?: {
    name?: string;
    feature_type?: string;
    context?: {
      neighborhood?: GeocodeContextPart;
      locality?: GeocodeContextPart;
      place?: GeocodeContextPart;
      region?: GeocodeContextPart;
      country?: GeocodeContextPart;
    };
  };
}

/** "Maxvorstadt, Munich" from a Mapbox Geocoding v6 reverse result; null when nothing useful. */
export function placeNameFrom(features: GeocodeFeature[]): string | null {
  const ctx = features[0]?.properties?.context;
  if (!ctx) return features[0]?.properties?.name ?? null;

  const area = ctx.neighborhood?.name ?? ctx.locality?.name;
  const city = ctx.place?.name ?? ctx.region?.name ?? ctx.country?.name;

  if (area && city && area !== city) return `${area}, ${city}`;
  return city ?? area ?? features[0]?.properties?.name ?? null;
}
