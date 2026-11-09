import { describe, expect, it } from 'vitest';
import { formatLatLng, placeNameFrom, ringCenter } from './geo';

describe('formatLatLng', () => {
  it('formats both hemispheres', () => {
    expect(formatLatLng(48.14612, 11.56234)).toBe('48.146 N · 11.562 E');
    expect(formatLatLng(-1.4218, -48.4566)).toBe('1.422 S · 48.457 W');
  });
});

describe('ringCenter', () => {
  it('ignores the closing point', () => {
    expect(
      ringCenter([
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0],
      ]),
    ).toEqual([1, 1]);
  });
});

describe('placeNameFrom', () => {
  it('joins neighbourhood and city', () => {
    expect(
      placeNameFrom([
        { properties: { name: 'Maxvorstadt', context: { neighborhood: { name: 'Maxvorstadt' }, place: { name: 'Munich' } } } },
      ]),
    ).toBe('Maxvorstadt, Munich');
  });

  it('falls back to the city', () => {
    expect(placeNameFrom([{ properties: { context: { place: { name: 'Cairo' }, country: { name: 'Egypt' } } } }])).toBe('Cairo');
  });

  it('falls back to region or country in remote places', () => {
    expect(placeNameFrom([{ properties: { context: { region: { name: 'Svalbard' }, country: { name: 'Norway' } } } }])).toBe(
      'Svalbard',
    );
  });

  it('returns null for nothing', () => {
    expect(placeNameFrom([])).toBeNull();
  });
});
