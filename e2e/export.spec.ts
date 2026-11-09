import { expect, test } from '@playwright/test';
import { PLOTS, drawPlot, mockApi, usable, waitForMap } from './helpers';

test.describe('export PDF', () => {
  test('prints a report with the map, plan, climate and crop table', async ({ page, isMobile }, info) => {
    await mockApi(page, 'munich');
    await page.addInitScript(() => {
      window.print = () => {
        (window as any).__printed = ((window as any).__printed ?? 0) + 1;
        window.dispatchEvent(new Event('beforeprint'));
      };
    });
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByTestId('crop-row').first()).toBeVisible();

    const title = await page.getByRole('heading', { level: 1 }).filter({ visible: true }).first().textContent();
    const report = page.getByTestId('print-report');
    await expect(report).toHaveCount(0);
    await page.getByRole('button', { name: 'Export PDF' }).filter({ visible: true }).click();
    expect(await page.evaluate(() => (window as any).__printed)).toBe(1);

    // An A4 page minus margins is about 690 px wide, below the md breakpoint.
    await page.setViewportSize({ width: 690, height: 975 });
    await page.emulateMedia({ media: 'print' });
    await expect(report).toHaveCount(1);
    await expect(report).toBeVisible();
    await expect(page.getByRole('region', { name: 'Map' })).toBeHidden();
    await expect(report.getByRole('heading', { level: 1 })).toHaveText(title!);
    await expect(report.getByRole('img', { name: 'Map of your plot' })).toHaveAttribute('src', /^data:image\/png;base64,/);
    await expect(report.getByRole('img', { name: /Example planting plan/ })).toBeVisible();
    await expect(report.getByRole('img', { name: /^Monthly climate/ })).toBeVisible();
    await expect(report.locator('tbody tr')).toHaveCount(usable('munich').length);
    await expect(report.locator('tbody tr').first()).toContainText(usable('munich')[0].crop_name);

    if (!isMobile) {
      await page.pdf({ path: `e2e/.output/${info.project.name}-report.pdf`, format: 'A4', printBackground: true });
      await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-report.png`, fullPage: true });
    }
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await expect(report).toHaveCount(0);
  });

  test('no export button when nothing grows', async ({ page }) => {
    await mockApi(page, 'svalbard');
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, PLOTS.svalbard);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByTestId('nothing-grows')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export PDF' })).toHaveCount(0);
  });
});
