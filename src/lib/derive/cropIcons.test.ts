import { describe, expect, it } from 'vitest';
import munich from '../../../e2e/fixtures/v2/munich-crops.json';
import { FALLBACK_ICON, cropIcon, cropIconFile } from './cropIcons';

const crops: { crop_name: string }[] = munich.crops;

describe('crop icons', () => {
  it('every crop the API returns has its own icon', () => {
    expect(crops.length).toBeGreaterThanOrEqual(45);
    for (const c of crops) expect(cropIconFile(c.crop_name), c.crop_name).not.toBe(FALLBACK_ICON);
  });

  it('falls back to the sprout for unknown crops', () => {
    expect(cropIconFile('Dragonfruit')).toBe(FALLBACK_ICON);
    expect(cropIcon('Dragonfruit')).toBeTruthy();
    expect(cropIcon('Dragonfruit')).not.toBe(cropIcon('Tomatoes'));
  });

  it('resolves to an svg url', () => {
    // Small SVGs are inlined by Vite as data URLs; larger ones are files.
    expect(cropIcon('Corn/Maize')).toMatch(/corn-maize.*\.svg|^data:image\/svg/);
  });
});
