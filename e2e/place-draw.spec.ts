import { expect, test, type Page } from '@playwright/test';
import { PLOTS, TOO_LARGE, drawPlot, mockApi, waitForMap } from './helpers';

async function shot(page: Page, name: string, project: string): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `e2e/.output/shots/${project}-${name}.png` });
}

test.describe('pick a place', () => {
  test('sample climates fly the map and label the chip', async ({ page }, info) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);

    await expect(page.getByRole('heading', { name: 'Where do you want to grow?' })).toBeVisible();
    for (const city of ['Munich', 'Cairo', 'Belém', 'Reykjavík', 'Antalya', 'Omsk', 'Nairobi', 'Cape Town']) {
      await expect(page.getByRole('button', { name: new RegExp(city) })).toBeVisible();
    }
    await shot(page, 'place', info.project.name);

    await page.getByRole('button', { name: /Cairo/ }).click();
    await expect(page.getByRole('button', { name: /Cairo/ })).toHaveAttribute('aria-pressed', 'true');
    await page.waitForFunction(() => Math.abs((window as any).__hg.map.view.lat - 30.04) < 0.05, null, { timeout: 15_000 });
    await expect(page.getByText(/Cairo · (ready|zoom in) to draw/)).toBeVisible();

    await page.getByRole('button', { name: /Cape Town/ }).click();
    await page.waitForFunction(() => Math.abs((window as any).__hg.map.view.lat + 33.92) < 0.05, null, { timeout: 15_000 });
    await expect(page.getByText(/Cape Town · (ready|zoom in) to draw/)).toBeVisible();
  });

  test('back from drawing to picking a place, on both layouts', async ({ page, isMobile }) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);
    await page.getByRole('button', { name: /Draw your plot here/ }).click();
    await expect(page.getByText(/0 m²/)).toBeVisible();

    const back = isMobile
      ? page.getByRole('button', { name: 'Back to pick a place' })
      : page.getByRole('button', { name: 'Pick a place' });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page.getByRole('heading', { name: 'Where do you want to grow?' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Search for an address or place' })).toBeVisible();
  });

  test('draw button opens the draw step', async ({ page }) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);

    await page.getByRole('button', { name: /Draw your plot here/ }).click();
    await expect(page.getByText(/0 m²/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeDisabled();
  });
});

test.describe('draw', () => {
  test('draws a polygon with real clicks', async ({ page, isMobile }, info) => {
    test.skip(isMobile, 'mouse drawing checked on desktop; mobile uses the same Draw control');
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);
    await page.getByRole('button', { name: /Draw your plot here/ }).click();
    await expect(page.getByText('Click each corner · double-click to finish')).toBeVisible();
    const cursor = () => page.evaluate(() => (document.querySelector('.mapboxgl-canvas') as HTMLElement).style.cursor);
    expect(await cursor()).toBe('pointer');

    const box = (await page.getByTestId('map').boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const corners = [
      [cx - 80, cy - 60],
      [cx + 80, cy - 70],
      [cx + 90, cy + 60],
      [cx - 70, cy + 70],
    ];
    for (const [x, y] of corners.slice(0, -1)) {
      await page.mouse.click(x, y);
      await page.waitForTimeout(150);
    }
    const [lx, ly] = corners.at(-1)!;
    await page.mouse.dblclick(lx, ly);

    await expect(page.getByText('4 corners', { exact: true })).toBeVisible();
    await expect(page.getByText(/tennis court|parking space|football pitch/).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeEnabled();
    await expect(page.getByText('Drag a corner to adjust')).toBeVisible();
    expect(await cursor()).toBe('');
    await shot(page, 'draw', info.project.name);
  });

  test('too large: amber state and analyse disabled', async ({ page }, info) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);
    await drawPlot(page, TOO_LARGE);

    await expect(page.getByText(/% over the 1 km² limit/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeDisabled();
    if (!info.project.name.includes('mobile')) await expect(page.getByText('Plot too large')).toBeVisible();
    await page.evaluate(() => (window as any).__hg.map.fitTo((window as any).__hg.journey.plot.ring, 60));
    await shot(page, 'too-large', info.project.name);
  });

  test('undo restores the previous plot, delete clears it', async ({ page }) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);

    await drawPlot(page, PLOTS.munich);
    await drawPlot(page, PLOTS.munich.slice(0, 3));
    await expect(page.getByText(/3 corners/).filter({ visible: true })).toBeVisible();

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText(/5 corners/).filter({ visible: true })).toBeVisible();

    await page.getByRole('button', { name: 'Delete plot' }).click();
    await expect(page.getByText(/^0 m²$/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Analyse this plot/ })).toBeDisabled();
  });

  test('place name is looked up and shown on results', async ({ page }) => {
    await mockApi(page);
    await page.goto('app');
    await waitForMap(page);

    await drawPlot(page, PLOTS.munich);
    await page.waitForFunction(() => (window as any).__hg.journey.plot?.placeName === 'Maxvorstadt, Munich');
    await page.getByRole('button', { name: /Analyse this plot/ }).click();
    await expect(page.getByRole('heading', { name: 'Maxvorstadt, Munich' })).toBeVisible();
  });
});
