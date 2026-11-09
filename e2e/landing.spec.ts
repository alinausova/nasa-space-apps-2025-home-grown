import { expect, test } from '@playwright/test';
import { mockApi, waitForMap } from './helpers';

const svgPaused = () => (document.querySelector('[data-testid="landing"] svg') as SVGSVGElement).animationsPaused();

test.describe('landing', () => {
  test('headline, steps, award and the main call to action', async ({ page }, info) => {
    await mockApi(page);
    await page.goto('');

    await expect(page.getByRole('heading', { name: 'What could your city grow?' }).filter({ visible: true })).toBeVisible();
    for (const step of ['Draw your plot', 'We read satellite data', 'Get your crops']) {
      await expect(page.getByText(step, { exact: true }).filter({ visible: true })).toBeVisible();
    }
    const award = page.getByRole('link', { name: /Winner · Pitch Perfect/ }).filter({ visible: true });
    await expect(award).toHaveAttribute('href', /\/learn\/about#recognition$/);

    await page.waitForTimeout(600);
    await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-landing.png` });

    await page.getByRole('link', { name: /Pick a spot on Earth/ }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/app$/);
    await waitForMap(page);
    await expect(page.getByRole('heading', { name: 'Where do you want to grow?' })).toBeVisible();
  });

  test('how it works goes to the scoring page', async ({ page }) => {
    await mockApi(page);
    await page.goto('');
    await page.getByRole('link', { name: 'How it works' }).filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/learn\/scoring$/);
  });

  test('uses the composition for the screen size', async ({ page, isMobile }) => {
    await mockApi(page);
    await page.goto('');
    const viewBox = await page.locator('[data-testid="landing"] svg').first().getAttribute('viewBox');
    expect(viewBox).toBe(isMobile ? '0 0 390 844' : '0 0 1440 900');
  });

  test('pause button stops and restarts the animation', async ({ page }) => {
    await mockApi(page);
    await page.goto('');
    expect(await page.evaluate(svgPaused)).toBe(false);

    await page.getByRole('button', { name: 'Pause animation' }).click();
    await expect(page.getByTestId('landing')).toHaveAttribute('data-playing', 'false');
    expect(await page.evaluate(svgPaused)).toBe(true);

    await page.getByRole('button', { name: 'Play animation' }).click();
    expect(await page.evaluate(svgPaused)).toBe(false);
  });

  test('reduced motion starts paused', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await mockApi(page);
    await page.goto('');

    await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
    expect(await page.evaluate(svgPaused)).toBe(true);
    await context.close();
  });

  test('pauses while the tab is hidden', async ({ page }) => {
    await mockApi(page);
    await page.goto('');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => page.evaluate(svgPaused)).toBe(true);

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => page.evaluate(svgPaused)).toBe(false);
  });

  test('headline scales with the window and stays on two lines', async ({ browser }) => {
    for (const [width, height, min, max] of [[1024, 768, 76, 76], [1440, 900, 90, 96], [1920, 1080, 96, 96], [390, 844, 44, 44]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      await mockApi(page);
      await page.goto('');
      const { size, lines } = await page.evaluate(() => {
        const h1 = [...document.querySelectorAll('h1')].find((e) => (e as HTMLElement).offsetParent)!;
        const style = getComputedStyle(h1);
        return { size: parseFloat(style.fontSize), lines: Math.round(h1.getBoundingClientRect().height / parseFloat(style.lineHeight)) };
      });
      expect(size, `font size at ${width}px`).toBeGreaterThanOrEqual(min);
      expect(size, `font size at ${width}px`).toBeLessThanOrEqual(max);
      expect(lines, `lines at ${width}px`).toBe(2);
      await context.close();
    }
  });
});
