import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PLOTS, TOO_LARGE, drawPlot, mockApi, waitForMap } from './helpers';

/** Fails on serious or critical WCAG 2.x A/AA issues. Mapbox's own canvas and controls are excluded. */
async function expectNoSeriousViolations(page: Page, name: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('.mapboxgl-canvas-container')
    .exclude('.mapboxgl-control-container')
    .analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const report = serious.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join('\n  ')}`);
  expect(report, `${name}\n${report.join('\n')}`).toEqual([]);
}

async function openApp(page: Page): Promise<void> {
  await page.goto('app');
  await waitForMap(page);
}

test.describe('accessibility (axe)', () => {
  test('landing', async ({ page }) => {
    await mockApi(page);
    await page.goto('');
    await expectNoSeriousViolations(page, 'landing');
  });

  test('pick a place', async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await expectNoSeriousViolations(page, 'place');
  });

  test('draw, including too large', async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await drawPlot(page, PLOTS.munich);
    await expectNoSeriousViolations(page, 'draw');
    await drawPlot(page, TOO_LARGE);
    await expectNoSeriousViolations(page, 'too large');
  });

  test('analysing and error', async ({ page }) => {
    await mockApi(page, 'munich', { delayMs: 8_000 });
    await openApp(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByTestId('loader')).toBeVisible();
    await expectNoSeriousViolations(page, 'analysing');
  });

  test('results, crop detail, nothing grows', async ({ page }) => {
    await mockApi(page, 'munich');
    await openApp(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByTestId('crop-row').first()).toBeVisible();
    await expectNoSeriousViolations(page, 'results');

    await page.getByTestId('crop-row').first().click();
    await expect(page.locator('#crop-name')).toBeVisible();
    await expectNoSeriousViolations(page, 'crop detail');
  });

  test('nothing grows', async ({ page }) => {
    await mockApi(page, 'svalbard');
    await openApp(page);
    await drawPlot(page, PLOTS.svalbard);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByTestId('nothing-grows')).toBeVisible();
    await expectNoSeriousViolations(page, 'nothing grows');
  });

  for (const tab of ['about', 'scoring', 'data', 'architecture', 'impact']) {
    test(`learn ${tab}`, async ({ page }) => {
      await mockApi(page);
      await page.goto(`learn/${tab}`);
      await expectNoSeriousViolations(page, `learn ${tab}`);
    });
  }
});

test.describe('keyboard', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard path checked on desktop');

  async function tabUntil(page: Page, predicate: string, max = 60): Promise<void> {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(predicate)) return;
    }
    throw new Error(`never reached: ${predicate}`);
  }

  test('landing → app with the keyboard', async ({ page }) => {
    await mockApi(page);
    await page.goto('');
    await tabUntil(page, `document.activeElement?.textContent?.includes('Pick a spot on Earth')`);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/app$/);
  });

  test('results list → crop detail with the keyboard', async ({ page }) => {
    await mockApi(page, 'munich');
    await openApp(page);
    await drawPlot(page, PLOTS.munich);
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByTestId('crop-row').first()).toBeVisible();

    await tabUntil(page, `document.activeElement?.dataset?.testid === 'crop-row'`);
    await page.keyboard.press('Enter');
    await expect(page.locator('#crop-name')).toBeVisible();
  });
});
