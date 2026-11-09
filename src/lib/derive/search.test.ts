import { describe, expect, it } from 'vitest';
import { suggestionFrom, suggestionsFrom } from './search';

const maxvorstadt = {
  id: 'dXJuOm1ieHBsYzpBVkJv',
  geometry: { coordinates: [11.567, 48.149] },
  properties: {
    mapbox_id: 'dXJuOm1ieHBsYzpBVkJv',
    name: 'Maxvorstadt',
    place_formatted: 'Munich, Bavaria, Germany',
    feature_type: 'locality',
    coordinates: { longitude: 11.5671, latitude: 48.1493 },
    context: { place: { name: 'Munich' } },
  },
};

describe('suggestionFrom', () => {
  it('names the place with its city and kind', () => {
    expect(suggestionFrom(maxvorstadt)).toEqual({
      id: 'dXJuOm1ieHBsYzpBVkJv',
      name: 'Maxvorstadt',
      detail: 'Munich, Bavaria, Germany · district',
      label: 'Maxvorstadt, Munich',
      center: [11.5671, 48.1493],
      zoom: 15,
    });
  });

  it('does not repeat the city when the result is the city', () => {
    const munich = { properties: { name: 'Munich', feature_type: 'place', place_formatted: 'Bavaria, Germany', context: { place: { name: 'Munich' } } }, geometry: { coordinates: [11.57, 48.13] } };
    const s = suggestionFrom(munich)!;
    expect(s.label).toBe('Munich');
    expect(s.zoom).toBe(12);
    expect(s.center).toEqual([11.57, 48.13]);
  });

  it('flies closer for addresses than for countries', () => {
    const at = (feature_type: string) => suggestionFrom({ properties: { name: 'x', feature_type }, geometry: { coordinates: [0, 0] } })!.zoom;
    expect(at('address')).toBeGreaterThan(at('street'));
    expect(at('street')).toBeGreaterThan(at('place'));
    expect(at('place')).toBeGreaterThan(at('country'));
  });

  it('skips results without a name or position', () => {
    expect(suggestionFrom({ properties: { feature_type: 'place' } })).toBeNull();
    expect(suggestionsFrom([maxvorstadt, { properties: { name: 'Nowhere' } }])).toHaveLength(1);
  });
});
