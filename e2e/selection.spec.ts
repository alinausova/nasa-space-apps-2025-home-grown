import { expect, test, type Page } from '@playwright/test';
import { mockApi } from './helpers';

/** Computed ::selection colours of the first visible level-1 heading. */
function selectionOf(page: Page) {
  return page.evaluate(() => {
    const h1 = [...document.querySelectorAll('h1')].find((el) => (el as HTMLElement).offsetParent !== null)!;
    const style = getComputedStyle(h1, '::selection');
    return { bg: style.backgroundColor, ink: style.color };
  });
}

test.describe('text selection colour', () => {
  test('landing (night): bright green with dark text', async ({ page }) => {
    await mockApi(page);
    await page.goto('');
    expect(await selectionOf(page)).toEqual({ bg: 'rgb(34, 197, 94)', ink: 'rgb(11, 61, 24)' });
  });

  test('app (leaf): ink and paper swapped', async ({ page }) => {
    await mockApi(page);
    await page.goto('app');
    await expect(page.getByRole('heading', { name: 'Where do you want to grow?' })).toBeVisible();
    expect(await selectionOf(page)).toEqual({ bg: 'rgb(27, 106, 36)', ink: 'rgb(217, 252, 212)' });
  });

  test('learn more (stone): ink and paper swapped', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/about');
    expect(await selectionOf(page)).toEqual({ bg: 'rgb(47, 51, 54)', ink: 'rgb(232, 230, 224)' });
  });
});

test('dark cards on light pages keep a visible highlight', async ({ page }) => {
  await mockApi(page);
  await page.goto('learn/about#recognition');
  const style = await page.locator('.on-ink').evaluate((card) => {
    const s = getComputedStyle(card.querySelector('span span')!, '::selection');
    return { bg: s.backgroundColor, ink: s.color };
  });
  expect(style).toEqual({ bg: 'rgb(34, 197, 94)', ink: 'rgb(11, 61, 24)' });
});
