import { describe, expect, it } from 'vitest';
import { en } from './messages/en';
import { de } from './messages/de';
import * as learnEn from '../screens/learn/content/en';
import * as learnDe from '../screens/learn/content/de';
import { pseudo, pseudoText } from './pseudo';
import { i18n, LOCALES } from './locale.svelte';
import { learn } from '../screens/learn/content';
import munich from '../../../e2e/fixtures/v2/munich-crops.json';

function leaves(value: unknown, path = ''): [string, unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  return [[path, value]];
}

describe('catalogs', () => {
  it('every locale resolves to a catalog and Learn content', () => {
    for (const locale of LOCALES) {
      i18n.locale = locale;
      expect(i18n.m.landing.title).toBeTruthy();
      expect(learn().UI.layout.openMap).toBeTruthy();
    }
    i18n.locale = 'en';
  });

  it('the English catalog has no empty strings', () => {
    const empty = leaves(en).filter(([, v]) => typeof v === 'string' && v.trim() === '' );
    // The one intentional empty string: the first progress step has no detail line.
    expect(empty.map(([k]) => k)).toEqual(['progress[0].detail']);
  });

  it('names every crop the API returns', () => {
    for (const crop of munich.crops) expect(en.crops[crop.crop_id], crop.crop_id).toBe(crop.crop_name);
  });

  // Translations, checked the same way for each language.
  const TRANSLATED = { de: { m: de, learn: learnDe } };

  for (const [lang, { m, learn: content }] of Object.entries(TRANSLATED)) {
    describe(lang, () => {
      it('has no empty strings except the intentional one', () => {
        const empty = leaves(m).filter(([, v]) => typeof v === 'string' && v.trim() === '');
        expect(empty.map(([k]) => k)).toEqual(['progress[0].detail']);
      });

      it('names every crop', () => {
        expect(Object.keys(m.crops).sort()).toEqual(Object.keys(en.crops).sort());
      });

      it('names every sample city and climate', () => {
        expect(Object.keys(m.place.cities).sort()).toEqual(Object.keys(en.place.cities).sort());
        expect(Object.keys(m.place.climates).sort()).toEqual(Object.keys(en.place.climates).sort());
      });

      it('uses no em dashes in prose', () => {
        const strings = [...leaves(m), ...leaves({ ...content })].filter(([, v]) => typeof v === 'string');
        expect(strings.filter(([, v]) => (v as string).includes('—')).map(([k]) => k)).toEqual([]);
      });

      it('keeps the Learn tables the same length as English', () => {
        for (const key of ['QUESTIONS', 'TEAM', 'RECOGNITION', 'SCORE_PARTS', 'FORMULAS', 'DATA_USED', 'CROP_DATA', 'DATA_RESEARCHED', 'PIPELINE', 'STACK', 'SDGS'] as const) {
          expect(content[key].length, key).toBe(learnEn[key].length);
        }
      });

      it('keeps formulas, links and references untouched', () => {
        expect(content.FORMULAS.map((f) => f.code)).toEqual(learnEn.FORMULAS.map((f) => f.code));
        expect(content.CONTACT.map((c) => c.href)).toEqual(learnEn.CONTACT.map((c) => c.href));
        expect([...leaves(content.CROP_DATA), ...leaves(content.DATA_USED)].filter(([k]) => k.endsWith('refs'))).toEqual(
          [...leaves(learnEn.CROP_DATA), ...leaves(learnEn.DATA_USED)].filter(([k]) => k.endsWith('refs')),
        );
      });
    });
  }
});

describe('pseudo language', () => {
  it('accents, stretches and brackets text', () => {
    expect(pseudoText('Heat')).toBe('⟦Ĥééááţ⟧');
    expect(pseudoText('')).toBe('');
  });

  it('wraps message functions and leaves data alone', () => {
    const m = pseudo({ beds: (n: number) => `${n} beds`, href: 'https://example.com', flag: true });
    expect(m.beds(2)).toBe('⟦2 ƀééðš⟧');
    expect(m.href).toBe('https://example.com');
    expect(m.flag).toBe(true);
  });
});

