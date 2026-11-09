import { expect, test, type Page } from '@playwright/test';
import { PLOTS, drawPlot, fixture, mockApi, waitForMap, type Fixture } from './helpers';

async function openResults(page: Page, name: Fixture): Promise<void> {
  await mockApi(page, name);
  await page.goto('app');
  await waitForMap(page);
  await drawPlot(page, PLOTS[name]);
  await page.waitForFunction(() => (window as any).__hg.journey.plot?.placeName);
  await page.getByRole('button', { name: /Analyse this plot/ }).click();
}

test.describe('results', () => {
  test('Munich: header, plan, climate, summary, ranked crops', async ({ page, isMobile }, info) => {
    await openResults(page, 'munich');
    const data = fixture('munich') as any;

    await expect(page.getByRole('heading', { level: 1, name: 'Maxvorstadt, Munich' })).toBeVisible();
    await expect(page.getByText(/13,695 m² · 48\.147 N · 11\.565 E/)).toBeVisible();

    // Planting plan: desktop drawing (labelled), mobile summary.
    if (isMobile) {
      await expect(page.getByText(/Four beds fill your plot/)).toBeVisible();
      await expect(page.getByText('31 crops fit in total.', { exact: false })).toBeVisible();
    } else {
      await expect(page.getByRole('img', { name: /Example planting plan for your plot: four beds of lettuce, spinach, arugula and peas/ })).toBeVisible();
    }

    // Climate card with real figures and a text alternative for the chart.
    await expect(page.getByRole('button', { name: /Climate at this plot/ })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Mar–Oct · 245 d')).toBeVisible();
    await expect(page.getByRole('img', { name: /Growing season Mar to Oct/ })).toBeVisible();

    // AI summary from the fixture.
    await expect(page.getByText(/Cool, wet summers suit leafy greens/)).toBeVisible();

    // Ranked list: every usable crop, in score order.
    const rows = page.getByTestId('crop-row');
    await expect(rows).toHaveCount(data.recommendations.length);
    await expect(rows.first()).toContainText('Lettuce');
    await expect(rows.first()).toContainText('83');
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results.png` });
    await page.getByRole('img', { name: /Monthly climate/ }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results-chart.png` });
    await rows.nth(2).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results-list.png` });
  });

  test('filters narrow the list', async ({ page }) => {
    await openResults(page, 'munich');
    const data = fixture('munich') as any;
    const cool = data.recommendations.filter((r: any) => r.season === 'cool').length;
    const rows = page.getByTestId('crop-row');

    await page.getByRole('button', { name: 'Cool season' }).click();
    await expect(rows).toHaveCount(cool);
    await page.getByRole('button', { name: 'Warm season' }).click();
    await expect(rows).toHaveCount(data.recommendations.length - cool);
    await page.getByRole('button', { name: /^All \d+$/ }).click();
    await expect(rows).toHaveCount(data.recommendations.length);
  });

  test('Cairo: water pills on crops that need irrigation, filter hides them', async ({ page }, info) => {
    await openResults(page, 'cairo');
    const data = fixture('cairo') as any;
    const first = data.recommendations[0];

    const row = page.getByTestId('crop-row').first();
    await expect(row).toContainText(first.crop_name);
    await expect(row).toContainText(`Water ${Math.round(first.suitability.metrics.irrigation_needed_mm)} mm`);
    await expect(page.getByText('All year · 365 d')).toBeVisible();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results-cairo.png` });

    await page.getByRole('button', { name: 'No irrigation' }).click();
    const dry = data.recommendations.filter((r: any) => r.suitability.metrics.irrigation_needed_mm === 0).length;
    await expect(page.getByTestId('crop-row')).toHaveCount(dry);
    if (dry === 0) await expect(page.getByText('No crop here matches this filter.')).toBeVisible();
  });

  test('climate card collapses to a one-line summary', async ({ page }) => {
    await openResults(page, 'munich');
    const toggle = page.getByRole('button', { name: /Climate at this plot/ });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toContainText(/h sun a day · .* mm rain · grows Mar–Oct/);
  });

  test('Svalbard: nothing grows', async ({ page }, info) => {
    await openResults(page, 'svalbard');
    await expect(page.getByTestId('nothing-grows')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Too cold for anything to grow outdoors' })).toBeVisible();
    await expect(page.getByText('5.6°C')).toBeVisible();
    await expect(page.getByText(/Greenhouses change the picture completely/)).toBeVisible();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-nothing-grows.png` });

    await page.getByRole('button', { name: /Compare with a sample city/ }).click();
    await expect(page.getByRole('heading', { name: 'Where do you want to grow?' })).toBeVisible();
  });

  test('LLM failure hides the summary instead of showing the fallback joke', async ({ page }) => {
    const body = { ...(fixture('munich') as any), llm_summary: 'The LLM in charge ... was asleep.', llm_err: '401' };
    await mockApi(page, 'munich', { body });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    await expect(page.getByText(/was asleep/)).toHaveCount(0);
  });

  test('summary text is never rendered as HTML', async ({ page }) => {
    const body = { ...(fixture('munich') as any), llm_summary: 'Try **kale** <img src=x onerror="window.__xss=1">' };
    await mockApi(page, 'munich', { body });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByText('<img src=x', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  });

  test('new plot returns to drawing', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop header action');
    await openResults(page, 'munich');
    await page.getByRole('button', { name: 'New plot' }).click();
    await expect(page.getByText('Click each corner · double-click to finish')).toBeVisible();
  });
});
