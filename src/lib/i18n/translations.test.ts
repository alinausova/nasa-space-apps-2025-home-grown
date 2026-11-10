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

describe('French in context', () => {
  it('compares areas with the right gender and plural', () => {
    i18n.locale = 'fr';
    expect(areaComparison(12)).toBe('Environ une place de parking');
    expect(areaComparison(40)).toBe('Environ trois places de parking');
    expect(areaComparison(3_400)).toBe('Environ 13 courts de tennis');
  });

  it('treats 0 and 1 as singular', () => {
    i18n.locale = 'fr';
    expect(i18n.m.nothing.days(0)).toBe('0 jour');
    expect(i18n.m.nothing.days(1)).toBe('1 jour');
    expect(i18n.m.nothing.days(2)).toBe('2 jours');
  });

  it('lower-cases crop names and bed counts inside sentences', () => {
    i18n.locale = 'fr';
    expect(inSentence(cropName({ crop_id: 'potato', crop_name: 'Potato' }))).toBe('pomme de terre');
    expect(inSentence(bedCount(2))).toBe('deux planches');
  });

  it('names month ranges in French', () => {
    i18n.locale = 'fr';
    expect(monthRanges([3, 4, 5])).toBe('mars à mai');
  });

  it('agrees the plan sentence with the number of beds', () => {
    i18n.locale = 'fr';
    expect(i18n.m.results.plan.fill(bedCount(1), '4 kg', 1)).toBe('Une planche remplit votre parcelle, environ 4 kg par saison.');
    expect(i18n.m.results.plan.fill(bedCount(4), '12 kg', 4)).toBe('Quatre planches remplissent votre parcelle, environ 12 kg par saison.');
  });
});
