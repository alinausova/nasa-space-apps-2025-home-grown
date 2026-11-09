import { describe, expect, it } from 'vitest';
import { en } from './messages/en';
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
});
