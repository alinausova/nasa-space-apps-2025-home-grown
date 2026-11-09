import { expect, test } from '@playwright/test';
import { mockApi } from './helpers';

test.describe('fonts', () => {
  test('English pages never download the Cyrillic font', async ({ page }) => {
    await mockApi(page);
    const fontRequests: string[] = [];
    page.on('request', (r) => r.url().includes('onest') && fontRequests.push(r.url()));
    await page.goto('');
    await page.waitForLoadState('networkidle');
    expect(fontRequests).toEqual([]);
  });

  test('Cyrillic text loads Onest; Latin text stays Figtree', async ({ page }, info) => {
    await mockApi(page);
    await page.goto('');
    const h1 = page.getByRole('heading', { level: 1 }).filter({ visible: true });
    await h1.evaluate((el) => (el.textContent = 'Что может вырастить ваш город? Home Grown'));
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      await document.fonts.load('400 48px "Onest Cyrillic"', 'Ж');
      return {
        cyrillic: document.fonts.check('400 48px "Onest Cyrillic"', 'Ж'),
        onestFaces: [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Onest Cyrillic' && f.status === 'loaded').length,
        latinUsesOnest: [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Onest Cyrillic' && f.unicodeRange.includes('0041')),
      };
    });
    expect(loaded.cyrillic).toBe(true);
    expect(loaded.onestFaces).toBeGreaterThan(0);
    expect(loaded.latinUsesOnest).toBe(false); // unicode-range covers Cyrillic only
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-cyrillic.png` });
  });
});
