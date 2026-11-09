import { expect, test } from '@playwright/test';
import { mockApi } from './helpers';

// What shows behind overscroll is the document background; it must match each area's theme.
const bg = () => getComputedStyle(document.documentElement).backgroundColor;
const themeColor = () => document.querySelector('meta[name="theme-color"]')!.getAttribute('content');

test.describe('page background follows the area theme', () => {
  test('landing is night, learn is stone, app is leaf, and it updates on navigation', async ({ page }) => {
    await mockApi(page);
    await page.goto('');
    expect(await page.evaluate(bg)).toBe('rgb(12, 36, 20)');
    expect(await page.evaluate(themeColor)).toBe('#0C2414');

    await page.goto('learn/about');
    expect(await page.evaluate(bg)).toBe('rgb(232, 230, 224)');
    expect(await page.evaluate(themeColor)).toBe('#E8E6E0');

    await page.getByRole('link', { name: 'Open the map' }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect.poll(() => page.evaluate(bg)).toBe('rgb(217, 252, 212)');
    expect(await page.evaluate(themeColor)).toBe('#D9FCD4');
  });
});
