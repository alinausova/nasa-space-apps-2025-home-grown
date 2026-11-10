import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from './locale.svelte';
import { inSentence } from './format';
import { areaComparison } from '../derive/area';
import { bedCount } from '../derive/format';
import { monthRanges } from '../derive/calendar';
import { cropName } from './crops';

describe('German in context', () => {
  beforeEach(() => (i18n.locale = 'de'));
  afterEach(() => (i18n.locale = 'en'));

  it('compares areas with German plurals and numbers', () => {
    expect(areaComparison(12)).toBe('Etwa ein Parkplatz');
    expect(areaComparison(40)).toBe('Etwa drei Parkplätze');
    expect(areaComparison(3_400)).toBe('Etwa 13 Tennisplätze');
    expect(areaComparison(990_000)).toBe('Etwa 139 Fußballfelder');
  });

  it('keeps nouns capitalised inside sentences', () => {
    expect(inSentence(cropName({ crop_id: 'kale', crop_name: 'Kale' }))).toBe('Grünkohl');
    expect(inSentence(bedCount(2))).toBe('Zwei Beete');
  });

  it('names month ranges in German', () => {
    expect(monthRanges([3, 4, 5])).toBe('März bis Mai');
  });

  it('agrees the plan sentence with the number of beds', () => {
    expect(i18n.m.results.plan.fill(bedCount(1), '4 kg', 1)).toBe('Ein Beet füllt deine Fläche, etwa 4 kg pro Saison.');
    expect(i18n.m.results.plan.fill(bedCount(3), '12 kg', 3)).toBe('Drei Beete füllen deine Fläche, etwa 12 kg pro Saison.');
  });

  it('still lower-cases crop names in English', () => {
    i18n.locale = 'en';
    expect(inSentence('Kale')).toBe('kale');
  });
});
