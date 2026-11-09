import type { LngLat } from './geo';

/** One row in the search suggestions. */
export interface PlaceSuggestion {
  id: string;
  /** "Maxvorstadt" */
  name: string;
  /** "Munich, Bavaria, Germany · district" */
  detail: string;
  /** "Maxvorstadt, Munich", for the map chip. */
  label: string;
  center: LngLat;
  zoom: number;
}

/** A Mapbox Geocoding v6 forward result (only the fields we read). */
export interface ForwardFeature {
  id?: string;
  geometry?: { coordinates?: number[] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    place_formatted?: string;
    feature_type?: string;
    coordinates?: { longitude?: number; latitude?: number };
    context?: { place?: { name?: string } };
  };
}

const KIND_LABEL: Record<string, string> = {
  address: 'address',
  street: 'street',
  neighborhood: 'neighbourhood',
  locality: 'district',
  place: 'city',
  district: 'county',
  postcode: 'postcode',
  region: 'region',
  country: 'country',
};

/** How close to fly in for each kind of result. Below zoom 14 the chip still says "zoom in to draw". */
const KIND_ZOOM: Record<string, number> = {
  address: 17,
  street: 16,
  neighborhood: 15,
  locality: 15,
  postcode: 14,
  place: 12,
  district: 10,
  region: 7,
  country: 5,
};

export const SEARCH_TYPES = Object.keys(KIND_LABEL).join(',');

export function suggestionFrom(feature: ForwardFeature): PlaceSuggestion | null {
  const p = feature.properties ?? {};
  const lng = p.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const lat = p.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  if (!p.name || typeof lng !== 'number' || typeof lat !== 'number') return null;

  const kind = p.feature_type ?? '';
  const city = p.context?.place?.name;
  const detail = [p.place_formatted, KIND_LABEL[kind]].filter(Boolean).join(' · ');
  return {
    id: p.mapbox_id ?? feature.id ?? `${lng},${lat}`,
    name: p.name,
    detail,
    label: city && city !== p.name ? `${p.name}, ${city}` : p.name,
    center: [lng, lat],
    zoom: KIND_ZOOM[kind] ?? 15,
  };
}

export function suggestionsFrom(features: ForwardFeature[]): PlaceSuggestion[] {
  return features.map(suggestionFrom).filter((s): s is PlaceSuggestion => s !== null);
}
