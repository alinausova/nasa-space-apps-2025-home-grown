import { expect, test } from '@playwright/test';
import { PLOTS, drawPlot, fixture, mockApi, waitForMap } from './helpers';

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

    if (isMobile) {
      await expect(page.getByText('Reading Landsat surface heat', { exact: true }).filter({ visible: true })).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/^3 of 5$/)).toBeVisible();
    } else {
      await expect(page.getByText('Step 3 of 5')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('Measured your plot, done')).toBeAttached();
      await expect(page.getByText('Reading Landsat surface heat, in progress')).toBeAttached();
    }
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-analysing.png` });

    await expect(page.getByRole('button', { name: 'New plot' })).toBeVisible({ timeout: 10_000 });
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

  test('server error: message, try again, success', async ({ page }, info) => {
    let fail = true;
    await mockApi(page);
    await page.route('**/recommendations/polygon**', (route) =>
      fail
        ? route.fulfill({ status: 502, json: { detail: 'NASA POWER API returned 503: Service Unavailable.' } })
        : route.fulfill({ json: fixture('munich') }),
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
    await expect(page.getByRole('button', { name: 'New plot' })).toBeVisible();
  });

  test('back to drawing after an error keeps the plot', async ({ page }) => {
    await mockApi(page, 'munich', { status: 500, body: { detail: 'boom' } });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await page.getByRole('button', { name: 'Back to drawing' }).click();

    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeEnabled();
    await expect(page.getByText(/5 corners/).filter({ visible: true })).toBeVisible();
  });
});
