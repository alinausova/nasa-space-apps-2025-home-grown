import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from './locale.svelte';
import { inSentence } from './format';
import { areaComparison } from '../derive/area';
import { bedCount } from '../derive/format';
import { monthRanges } from '../derive/calendar';
import { cropName } from './crops';

// Each translated language in context: plurals, agreement and lower-casing with real values.
afterEach(() => (i18n.locale = 'en'));

describe('Spanish in context', () => {
  it('compares areas with the right gender and plural', () => {
    i18n.locale = 'es';
    expect(areaComparison(12)).toBe('Alrededor de un espacio de estacionamiento');
    expect(areaComparison(40)).toBe('Alrededor de tres espacios de estacionamiento');
    expect(areaComparison(3_400)).toBe('Alrededor de 13 canchas de tenis');
  });

  it('lower-cases crop names and bed counts inside sentences', () => {
    i18n.locale = 'es';
    expect(inSentence(cropName({ crop_id: 'potato', crop_name: 'Potato' }))).toBe('papa');
    expect(inSentence(bedCount(2))).toBe('dos bancales');
  });

  it('names month ranges in Spanish', () => {
    i18n.locale = 'es';
    expect(monthRanges([3, 4, 5])).toBe('de marzo a mayo');
  });

  it('agrees the plan sentence with the number of beds', () => {
    i18n.locale = 'es';
    expect(i18n.m.results.plan.fill(bedCount(1), '4 kg', 1)).toBe('Un bancal ocupa tu parcela, unos 4 kg por temporada.');
    expect(i18n.m.results.plan.fill(bedCount(4), '12 kg', 4)).toBe('Cuatro bancales ocupan tu parcela, unos 12 kg por temporada.');
  });
});
