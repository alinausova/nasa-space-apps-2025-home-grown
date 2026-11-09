import { expect, test, type Page } from '@playwright/test';
import { PLOTS, drawPlot, mockApi, usable, waitForMap } from './helpers';

const RECS = usable('munich');
const TOP = RECS[0];
const tonnes = (kg: number) => `${(kg / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} t`;

async function openResults(page: Page): Promise<void> {
  await mockApi(page, 'munich');
  await page.goto('app');
  await waitForMap(page);
  await drawPlot(page, PLOTS.munich);
  await page.getByRole('button', { name: /Analyse this plot/ }).click();
  await expect(page.getByTestId('crop-row').first()).toBeVisible();
}

const cropHeading = (page: Page) => page.locator('#crop-name');

test.describe('crop detail', () => {
  test('opens from the list with rank, score, tags, harvest and rings', async ({ page, isMobile }, info) => {
    await openResults(page);
    await page.getByTestId('crop-row').first().click();

    await expect(page).toHaveURL(new RegExp(`/app/crop/${TOP.crop_id}$`));
    await expect(cropHeading(page)).toHaveText(TOP.crop_name);
    await expect(page.getByText(`Rank 01 of ${RECS.length}`)).toBeVisible();
    await expect(page.getByText(`Score ${Math.round(TOP.suitability.overall_score)} · Excellent fit`)).toBeVisible();
    await expect(page.getByText('Cool season', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Survives freezing')).toBeVisible();
    await expect(page.getByText(tonnes(TOP.suitability.yield_estimate.total_yield_kg))).toBeVisible();
    await expect(page.getByRole('img', { name: /out of 100$/ })).toHaveCount(4);

    // v2 responses carry growing-season figures, so the reasons talk about the growing season.
    const m = TOP.suitability.metrics;
    await expect(page.getByText(`More than the ${m.required_gdd} heat units it needs`).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(`Growing-season average inside the ideal ${m.optimal_temp_min}–${m.optimal_temp_max}°C`).filter({ visible: true })).toBeVisible();

    if (isMobile) await expect(page.getByRole('link', { name: 'All crops', exact: true })).toBeVisible();
    else await expect(page.getByRole('link', { name: `All ${RECS.length} crops` })).toBeVisible();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-crop.png` });
  });

  test('steps through the ranking and back', async ({ page }) => {
    await openResults(page);
    await page.getByTestId('crop-row').first().click();

    await page.getByRole('link', { name: `Next crop: ${RECS[1].crop_name}` }).filter({ visible: true }).click();
    await expect(cropHeading(page)).toHaveText(RECS[1].crop_name);
    await expect(page.getByText('Rank 02 of')).toBeVisible();

    await page.getByRole('link', { name: `Previous crop: ${RECS[0].crop_name}` }).filter({ visible: true }).click();
    await expect(cropHeading(page)).toHaveText(RECS[0].crop_name);

    await page.goBack();
    await expect(cropHeading(page)).toHaveText(RECS[1].crop_name);
  });

  test('stepping respects the active filter', async ({ page }) => {
    await openResults(page);
    const warm = RECS.filter((r) => r.season === 'warm');
    await page.getByRole('button', { name: 'Warm season' }).click();
    await page.getByTestId('crop-row').first().click();

    await expect(cropHeading(page)).toHaveText(warm[0].crop_name);
    await page.getByRole('link', { name: `Next crop: ${warm[1].crop_name}` }).filter({ visible: true }).click();
    await expect(cropHeading(page)).toHaveText(warm[1].crop_name);
  });

  test('also good here links to other crops; back returns to the list', async ({ page }) => {
    await openResults(page);
    await page.getByTestId('crop-row').first().click();

    await page.getByRole('link', { name: new RegExp(`^${RECS[1].crop_name} \\d+$`) }).click();
    await expect(cropHeading(page)).toHaveText(RECS[1].crop_name);

    await page.getByRole('link', { name: /All (\d+ )?crops/ }).filter({ visible: true }).click();
    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    await expect(page).toHaveURL(/\/app$/);
  });

  test('unknown crop id falls back to the list', async ({ page }) => {
    await openResults(page);
    await page.evaluate(() => (window as any).__hg.router.navigate({ name: 'crop', id: 'durian' }));
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByTestId('crop-row').first()).toBeVisible();
  });
});

test.describe('grow calendar', () => {
  const crop = (id: string) => RECS.find((r) => r.crop_id === id)!;
  const open = (page: Page, id: string) => page.evaluate((cropId) => (window as any).__hg.router.navigate({ name: 'crop', id: cropId }), id);
  const cells = (page: Page, row: string) => page.locator(`[data-testid="grow-calendar"] [data-row="${row}"][data-on]`);

  test('shows the sow, grow and harvest months from the response', async ({ page }, info) => {
    await openResults(page);
    await page.getByTestId('crop-row').first().click();
    const cal = TOP.calendar;
    const section = page.getByTestId('grow-calendar');
    await expect(section.getByRole('heading', { name: 'When to grow it' })).toBeVisible();
    await expect(cells(page, 'sow')).toHaveCount(cal.sow.length);
    await expect(cells(page, 'grow')).toHaveCount(cal.grow.length);
    await expect(cells(page, 'harvest')).toHaveCount(cal.harvest.length);
    await expect(section.getByText(/^Sow .*\. Grows .*\. Harvest .*\.$/)).toBeAttached();
    await section.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-calendar.png` });
  });

  test('frost-tender crops are planted out as seedlings', async ({ page }) => {
    expect(crop('tomatoes').calendar.mode).toBe('plant_out');
    await openResults(page);
    await open(page, 'tomatoes');
    await expect(cropHeading(page)).toHaveText('Tomatoes');
    const section = page.getByTestId('grow-calendar');
    await expect(section.getByText('Plant out', { exact: true })).toBeVisible();
    await expect(section.getByText(/Start seeds indoors about six weeks earlier/)).toBeVisible();
  });

  test('says so when no sowing date works', async ({ page }) => {
    expect(crop('rice').calendar).toBeNull();
    await openResults(page);
    await open(page, 'rice');
    await expect(page.getByTestId('grow-calendar')).toContainText('We could not find a sowing date that lets rice ripen');
  });
});
