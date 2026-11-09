import { expect, test } from '@playwright/test';
import { PLOTS, TOO_LARGE, drawPlot, mockApi, waitForMap } from './helpers';

test.describe('app shell', () => {
  test('renders sidebar and map', async ({ page }, info) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('map')).toBeVisible();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-shell.png` });
  });

  test('flows from draw to results with a mocked API', async ({ page }) => {
    const api = await mockApi(page, 'munich');
    await page.goto('app');
    await waitForMap(page);

    await drawPlot(page, PLOTS.munich);
    const analyse = page.getByRole('button', { name: /Analyse this plot/ });
    await expect(analyse).toBeEnabled();
    await analyse.click();

    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    expect(api).toEqual({ climate: 1, crops: 1, summary: 1, tips: 0 });
  });

  test('blocks plots over 1 km²', async ({ page }) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);

    await drawPlot(page, TOO_LARGE);
    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeDisabled();
  });

  test('cancel returns to drawing', async ({ page }) => {
    await mockApi(page, 'munich', { delayMs: 5_000 });
    await page.goto('app');
    await waitForMap(page);

    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeEnabled();
  });
});

test.describe('routing', () => {
  test('crop deep link without results falls back to the app', async ({ page }) => {
    await mockApi(page);
    await page.goto('app/crop/kale');
    await expect(page).toHaveURL(/\/app$/);
  });

  test('unknown paths go to the landing page', async ({ page }) => {
    await mockApi(page);
    await page.goto('nope/nothing');
    await expect(page).toHaveURL(/:\d+\/$/);
  });

  test('GitHub Pages 404 redirect is restored', async ({ page }) => {
    await mockApi(page);
    await page.goto('?/app');
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByTestId('map')).toBeVisible();
  });
});

test.describe('mobile sheet', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('handle toggles the sheet height', async ({ page }) => {
    await mockApi(page);
    await page.goto('app');
    const sheet = page.locator('aside[data-sheet]');
    await expect(sheet).toHaveAttribute('data-sheet', 'mid');

    await page.getByRole('button', { name: 'Expand panel' }).click();
    await expect(sheet).toHaveAttribute('data-sheet', 'high');

    await page.getByRole('button', { name: 'Collapse panel' }).click();
    await expect(sheet).toHaveAttribute('data-sheet', 'mid');
  });
});
