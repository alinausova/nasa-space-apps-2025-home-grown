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

  test('app (leaf): selection green with leaf ink', async ({ page }) => {
    await mockApi(page);
    await page.goto('app');
    await expect(page.getByRole('heading', { name: 'Where do you want to grow?' })).toBeVisible();
    expect(await selectionOf(page)).toEqual({ bg: 'rgb(178, 240, 190)', ink: 'rgb(27, 106, 36)' });
  });

  test('learn more (stone): green tint with stone ink', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/about');
    expect(await selectionOf(page)).toEqual({ bg: 'rgba(34, 197, 94, 0.28)', ink: 'rgb(47, 51, 54)' });
  });
});
