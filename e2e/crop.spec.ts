import { expect, test, type Page } from '@playwright/test';
import { PLOTS, drawPlot, fixture, mockApi, waitForMap } from './helpers';

const DATA = fixture('munich') as any;
const RECS = DATA.recommendations as any[];

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

    await expect(page).toHaveURL(/\/app\/crop\/lettuce$/);
    await expect(cropHeading(page)).toHaveText('Lettuce');
    await expect(page.getByText(`Rank 01 of ${RECS.length}`)).toBeVisible();
    await expect(page.getByText('Score 83 · Excellent fit')).toBeVisible();
    await expect(page.getByText('Cool season', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Survives freezing')).toBeVisible();
    await expect(page.getByText('28.3 t')).toBeVisible();
    await expect(page.getByRole('img', { name: /out of 100$/ })).toHaveCount(4);

    // Fixture predates the v1 back end, so the temperature reason uses the fallback wording.
    await expect(page.getByText(/More than the 600 heat units it needs/).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Year average \d+°C/).filter({ visible: true })).toBeVisible();

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
