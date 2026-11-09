import { expect, test, type Page } from '@playwright/test';
import { PLOTS, drawPlot, mockApi, usable, v2, waitForMap, type Fixture } from './helpers';

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
    const crops = usable('munich');
    const top4 = crops.slice(0, 4).map((c) => c.crop_name.toLowerCase());

    await expect(page.getByRole('heading', { level: 1, name: 'Maxvorstadt, Munich' })).toBeVisible();
    await expect(page.getByText(/13,695 m² · 48\.147 N · 11\.565 E/)).toBeVisible();

    // Planting plan: desktop drawing (labelled), mobile summary.
    if (isMobile) {
      await expect(page.getByText(/Four beds fill your plot/)).toBeVisible();
      await expect(page.getByText(`${crops.length} crops fit in total.`, { exact: false })).toBeVisible();
    } else {
      const names = `${top4.slice(0, 3).join(', ')} and ${top4[3]}`;
      await expect(page.getByRole('img', { name: `Example planting plan for your plot: four beds of ${names}, with paths between them.` })).toBeVisible();
    }

    // Climate card with real figures and a text alternative for the chart.
    await expect(page.getByRole('button', { name: /Climate at this plot/ })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Mar–Oct · 245 d')).toBeVisible();
    await expect(page.getByRole('img', { name: /Growing season Mar to Oct/ })).toBeVisible();

    // Rain bars for every month and the Landsat surface heat figure.
    await expect(page.getByTestId('rain-bars').locator('rect')).toHaveCount(12);
    const heat = v2('munich', 'crops').landsat.surface_heat;
    await expect(page.getByTestId('surface-heat')).toContainText(`+${heat.offset_c.toFixed(1)} °C`);
    await expect(page.getByRole('img', { name: /Rain peaks at \d+ millimetres/ })).toBeVisible();

    // AI summary from the fixture.
    await expect(page.getByText(/Cool, wet summers suit leafy greens/)).toBeVisible();

    // Ranked list: every usable crop, in score order.
    const rows = page.getByTestId('crop-row');
    await expect(rows).toHaveCount(crops.length);
    await expect(rows.first()).toContainText(crops[0].crop_name);
    await expect(rows.first()).toContainText(String(Math.round(crops[0].suitability.overall_score)));
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results.png` });
    await page.getByRole('img', { name: /Monthly climate/ }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results-chart.png` });
    await rows.nth(2).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results-list.png` });
  });

  test('filters narrow the list', async ({ page }) => {
    await openResults(page, 'munich');
    const all = usable('munich');
    const cool = all.filter((r) => r.season === 'cool').length;
    const rows = page.getByTestId('crop-row');

    await page.getByRole('button', { name: 'Cool season' }).click();
    await expect(rows).toHaveCount(cool);
    await page.getByRole('button', { name: 'Warm season' }).click();
    await expect(rows).toHaveCount(all.length - cool);
    await page.getByRole('button', { name: /^All \d+$/ }).click();
    await expect(rows).toHaveCount(all.length);
  });

  test('Cairo: water pills on crops that need irrigation, filter hides them', async ({ page }, info) => {
    await openResults(page, 'cairo');
    const all = usable('cairo');
    const first = all[0];

    const row = page.getByTestId('crop-row').first();
    await expect(row).toContainText(first.crop_name);
    await expect(row).toContainText(`Water ${Math.round(first.suitability.metrics.irrigation_needed_mm)} mm`);
    await expect(page.getByText('All year · 365 d')).toBeVisible();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-results-cairo.png` });

    await page.getByRole('button', { name: 'No irrigation' }).click();
    const dry = all.filter((r) => r.suitability.metrics.irrigation_needed_mm === 0).length;
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
    const c = v2('svalbard', 'climate').climate;
    await expect(page.getByText(`${c.warmest_month.temp_avg.toFixed(1)}°C`)).toBeVisible();
    await expect(page.getByText(`${c.days_above_5c} days`)).toBeVisible();

    // Closest calls: the three best crops that missed, each with its reason.
    const calls = page.getByTestId('closest-call');
    await expect(calls).toHaveCount(3);
    await expect(calls.first()).toContainText('Not enough warmth in a year here to mature');
    await expect(page.getByText(/Greenhouses change the picture completely/)).toBeVisible();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-nothing-grows.png` });

    await page.getByRole('button', { name: /Compare with a sample city/ }).click();
    await expect(page.getByRole('heading', { name: 'Where do you want to grow?' })).toBeVisible();
  });

  test('LLM failure hides the summary', async ({ page }) => {
    await mockApi(page, 'munich', { summary: { body: { plot_id: 'x', summary: null, error: 'The summary is not available right now.' } } });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    await expect(page.getByTestId('summary-loading')).toHaveCount(0);
    await expect(page.getByLabel('Summary by Mistral AI')).toHaveCount(0);
  });

  test('summary text is never rendered as HTML', async ({ page }) => {
    await mockApi(page, 'munich', { summary: { body: { plot_id: 'x', summary: 'Try **kale** <img src=x onerror="window.__xss=1">' } } });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();

    await expect(page.getByText('<img src=x', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  });

  test('thin plots: plan labels never overlap', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop plan drawing');
    await mockApi(page, 'munich');
    await page.goto('app');
    await waitForMap(page);
    // ~300 m wide, ~25 m tall.
    await drawPlot(page, [[11.56, 48.146], [11.564, 48.146], [11.564, 48.14622], [11.56, 48.14622]]);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    const plan = page.getByRole('img', { name: /Example planting plan/ });
    await expect(plan).toBeVisible();

    const boxes = await plan.locator('text[font-size="15"]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: r.top, bottom: r.bottom })));
    expect(boxes).toHaveLength(4);
    const sorted = [...boxes].sort((a, b) => a.top - b.top);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].top).toBeGreaterThanOrEqual(sorted[i - 1].bottom);
  });

  test('new plot returns to drawing', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop header action');
    await openResults(page, 'munich');
    await page.getByRole('button', { name: 'New plot' }).click();
    await expect(page.getByText('Click each corner · double-click to finish')).toBeVisible();
  });
});
