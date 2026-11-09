import { expect, test } from '@playwright/test';
import { PLOTS, drawPlot, mockApi, v2, waitForMap } from './helpers';

test.describe('analysing', () => {
  test('steps advance while waiting, then results arrive', async ({ page, isMobile }, info) => {
    await mockApi(page, 'munich', { delayMs: 6_000 });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByRole('heading', { name: 'Checking a year of sun, heat and rain' })).toBeVisible();
    await expect(page.getByTestId('loader')).toBeVisible();
    await expect(page.getByTestId('scan-overlay')).toBeVisible();

    // Climate is back (the crops call is the slow one), so step 3 runs and a time is promised.
    if (isMobile) {
      await expect(page.getByText('Reading Landsat surface temperature', { exact: true }).filter({ visible: true })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/^3 of 5\s·\s~\d+ s$/)).toBeVisible();
    } else {
      await expect(page.getByText('Step 3 of 5')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/^about \d+ s left$/)).toBeVisible();
      await expect(page.getByText('Fetched NASA POWER climate, done')).toBeAttached();
      await expect(page.getByText('Reading Landsat 8/9, in progress')).toBeAttached();
    }

    // The early climate card shows the real figures from the climate call.
    const early = page.getByTestId('early-climate').filter({ visible: true });
    await expect(early).toBeVisible();
    await expect(early).toContainText(`${v2('munich', 'climate').climate.sun_hours_daily.toFixed(1)} h`);
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-analysing.png` });

    await expect(page.getByTestId('crop-row').first()).toBeVisible({ timeout: 10_000 });
  });

  test('pause button stops the loader', async ({ page }) => {
    await mockApi(page, 'munich', { delayMs: 10_000 });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    const loader = page.getByTestId('loader');
    await expect(loader).toHaveAttribute('data-playing', 'true');
    await page.getByRole('button', { name: 'Pause animation' }).click();
    await expect(loader).toHaveAttribute('data-playing', 'false');
    await page.getByRole('button', { name: 'Play animation' }).click();
    await expect(loader).toHaveAttribute('data-playing', 'true');
  });

  test('reduced motion starts the loader paused', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await mockApi(page, 'munich', { delayMs: 10_000 });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByTestId('loader')).toHaveAttribute('data-playing', 'false');
    await context.close();
  });

  test('climate error: message, try again, success', async ({ page }, info) => {
    let fail = true;
    await mockApi(page);
    await page.route('**/analysis/climate', (route) =>
      fail
        ? route.fulfill({ status: 502, json: { detail: 'NASA POWER API returned 503: Service Unavailable.' } })
        : route.fulfill({ json: v2('munich', 'climate') }),
    );
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    const alert = page.getByRole('alert').filter({ hasText: 'We could not finish reading your plot' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('NASA POWER API returned 503');
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-analysing-error.png` });

    fail = false;
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByTestId('crop-row').first()).toBeVisible();
  });

  test('crops error: try again starts from the crops without refetching the climate', async ({ page }) => {
    let fail = true;
    let climateCalls = 0;
    let cropsCalls = 0;
    await mockApi(page);
    await page.route('**/analysis/climate', (route) => {
      climateCalls += 1;
      return route.fulfill({ json: v2('munich', 'climate') });
    });
    await page.route('**/analysis/crops', (route) => {
      cropsCalls += 1;
      return fail ? route.fulfill({ status: 504, json: { detail: 'Gateway timeout' } }) : route.fulfill({ json: v2('munich', 'crops') });
    });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Gateway timeout' })).toBeVisible();

    fail = false;
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    expect(climateCalls).toBe(1);
    expect(cropsCalls).toBe(2);
  });

  test('results first, summary after', async ({ page }) => {
    await mockApi(page, 'munich', { summary: { delayMs: 3_000 } });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    await expect(page.getByTestId('summary-loading')).toBeVisible();
    await expect(page.getByText(/Cool, wet summers suit leafy greens/)).toBeVisible({ timeout: 6_000 });
    await expect(page.getByTestId('summary-loading')).toHaveCount(0);
  });

  test('back to drawing after an error keeps the plot', async ({ page }) => {
    await mockApi(page, 'munich', { climate: { status: 500, body: { detail: 'boom' } } });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await page.getByRole('button', { name: 'Back to drawing', exact: true }).click();

    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeEnabled();
    await expect(page.getByText(/5 corners/).filter({ visible: true })).toBeVisible();
  });

  test('Landsat timeout: continue without Landsat shows the results at once', async ({ page }, info) => {
    const crops = v2('munich', 'crops');
    let cropsCalls = 0;
    await mockApi(page);
    await page.route('**/analysis/crops', (route) => {
      cropsCalls += 1;
      return route.fulfill({ json: { ...crops, landsat: { status: 'timeout', scenes: [], surface_heat: null } } });
    });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByTestId('landsat-error')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Landsat did not answer in time' })).toBeVisible();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-landsat-error.png` });

    await page.getByRole('button', { name: /Continue without Landsat/ }).click();
    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    await expect(page.getByTestId('surface-heat')).toHaveCount(0);
    expect(cropsCalls).toBe(1);
  });

  test('Landsat timeout: try again asks Landsat again and shows surface heat', async ({ page }) => {
    const crops = v2('munich', 'crops');
    let cropsCalls = 0;
    await mockApi(page);
    await page.route('**/analysis/crops', (route) => {
      cropsCalls += 1;
      const body = cropsCalls === 1 ? { ...crops, landsat: { status: 'timeout', scenes: [], surface_heat: null } } : crops;
      return route.fulfill({ json: body });
    });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    await expect(page.getByTestId('surface-heat')).toBeVisible();
    expect(cropsCalls).toBe(2);
  });
});
