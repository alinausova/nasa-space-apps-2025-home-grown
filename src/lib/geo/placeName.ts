import { i18n } from '../i18n/locale.svelte';
import { placeNameFrom, type GeocodeFeature, type LngLat } from '../derive/geo';

const ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/reverse';

/** Neighbourhood + city for a point, via Mapbox reverse geocoding. Null on any failure. */
export async function lookupPlaceName(
  [lng, lat]: LngLat,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<string | null> {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  const params = new URLSearchParams({
    longitude: lng.toFixed(6),
    latitude: lat.toFixed(6),
    types: 'neighborhood,locality,place,region',
    language: i18n.language,
    limit: '1',
    access_token: token,
  });

  try {
    const response = await fetchImpl(`${ENDPOINT}?${params}`, { signal });
    if (!response.ok) return null;
    const body = (await response.json()) as { features?: GeocodeFeature[] };
    return placeNameFrom(body.features ?? []);
  } catch {
    return null;
  }
}
