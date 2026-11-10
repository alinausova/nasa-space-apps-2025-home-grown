import { i18n } from '../i18n/locale.svelte';
import type { LngLat } from '../derive/geo';
import { SEARCH_TYPES, suggestionsFrom, type ForwardFeature, type PlaceSuggestion } from '../derive/search';

const ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';

/** Place suggestions for a typed query, via Mapbox forward geocoding. Null when the search fails. */
export async function searchPlaces(
  query: string,
  { proximity, signal, fetchImpl = fetch }: { proximity?: LngLat; signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<PlaceSuggestion[] | null> {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  const params = new URLSearchParams({
    q: query,
    autocomplete: 'true',
    limit: '5',
    language: i18n.language,
    types: SEARCH_TYPES,
    access_token: token,
  });
  if (proximity) params.set('proximity', `${proximity[0].toFixed(4)},${proximity[1].toFixed(4)}`);

  try {
    const response = await fetchImpl(`${ENDPOINT}?${params}`, { signal });
    if (!response.ok) return null;
    const body = (await response.json()) as { features?: ForwardFeature[] };
    return suggestionsFrom(body.features ?? []);
  } catch {
    return null;
  }
}
