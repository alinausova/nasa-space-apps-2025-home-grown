import { expect, test } from '@playwright/test';
import { mockApi } from './helpers';

const TABS = [
  ['about', 'Who we are and why we built it', 'How scoring works'],
  ['scoring', 'How a crop gets its score', 'Data sources'],
  ['data', 'Where the data comes from', 'Architecture'],
  ['architecture', 'How the system runs', 'Impact'],
  ['impact', 'Why growing food in cities matters', null],
] as const;

test.describe('learn more', () => {
  for (const [tab, title, next] of TABS) {
    test(`${tab}: heading, current tab and next link`, async ({ page }, info) => {
      await mockApi(page);
      await page.goto(`learn/${tab}`);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Learn more' }).locator('[aria-current="page"]')).toContainText(
        { about: 'About', scoring: 'How scoring works', data: 'Data sources', architecture: 'Architecture', impact: 'Impact' }[tab],
      );
      // No horizontal scrolling at any width (wide tables must scroll inside their own box).
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

      if (next) await expect(page.getByRole('link', { name: `Next: ${next}` })).toBeVisible();
      else await expect(page.getByRole('link', { name: /^Next:/ })).toHaveCount(0);

      await page.screenshot({ path: `e2e/.output/shots/${info.project.name}-learn-${tab}.png`, fullPage: !info.project.name.includes('mobile') });
    });
  }

  test('next link walks through the tabs', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/about');
    await page.getByRole('link', { name: 'Next: How scoring works' }).click();
    await expect(page).toHaveURL(/\/learn\/scoring$/);
    await expect(page.getByRole('heading', { level: 1, name: 'How a crop gets its score' })).toBeVisible();
  });

  test('old /learn-more links redirect to About', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn-more');
    await expect(page).toHaveURL(/\/learn\/about$/);
  });

  test('recognition: confirmed copy and deep link from the landing badge', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/about#recognition');

    const section = page.locator('#recognition');
    await expect(section).toBeInViewport();
    await expect(section).toContainText('Winner · 19 Nov 2025');
    await expect(section).toContainText('Pitch Perfect, Capacity-building Hub at COP30');
    await expect(section).toContainText('UN Climate Change Conference · Belém, Brazil · run by UN University (UNU-VIE) and Youth4Capacity');
    await expect(section).toContainText('Vishnu Sunil Kumar pitched Home Grown as “Food Secure Cities of Tomorrow” and won the audience and mentor vote.');
    await expect(section).toContainText('Climate Pitch, Munich Climate Week');
    await expect(section).toContainText('Climate Café, Global Shapers Munich and TUM Think Tank');
    await expect(section).toContainText('Where it started: NASA International Space Apps Challenge');
  });

  test('get in touch: contact the team via LinkedIn, report an issue on GitHub', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/about');
    await expect(page.getByRole('link', { name: /Contact the team/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/vishnu-sunil/');
    await expect(page.getByRole('link', { name: /Report an issue/ })).toHaveAttribute('href', /github\.com\/alinausova\/nasa-space-apps-2025-home-grown\/issues$/);
    await expect(page.getByRole('link', { name: /Press release/ })).toHaveCount(0);
  });

  test('team photos load and LinkedIn links open in a new tab', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/about');
    const photos = page.locator('section img[loading="lazy"]');
    await expect(photos).toHaveCount(6);
    for (const photo of await photos.all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    await expect(page.locator('section li img[loading="lazy"] ~ span.font-medium')).toHaveText([
      'Vishnu Sunil Kumar',
      'Alina Usova',
      'Franz Josef Birkeneder',
      'Guillaume Leclerc',
      'Angela Rubilla',
      'Katy Larkin',
    ]);
    const links = page.getByRole('link', { name: /^LinkedIn/ });
    await expect(links).toHaveCount(6);
    await expect(links.first()).toHaveAttribute('target', '_blank');
  });

  test('data sources separate what is used from what is researched; bibliography toggles', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/data');
    await expect(page.getByRole('table', { name: 'Variables used in your results' })).toContainText('NASA POWER (MERRA-2)');
    await expect(page.getByRole('table', { name: 'Variables researched but not used yet' })).toContainText('Copernicus Sentinel-3');
    const crops = page.getByRole('table', { name: 'Where the crop numbers come from' });
    await expect(crops.getByRole('rowheader')).toHaveCount(9);
    await expect(crops).toContainText('Consolidated thresholds from Paredes et al. for 29 crops');
    await expect(crops).toContainText('FAO Irrigation and Drainage Paper 56');
    await expect(crops).toContainText('Field-measured totals from Paredes et al. for 13 crops');

    await page.getByRole('button', { name: 'Show bibliography · 28 sources' }).click();
    await expect(page.locator('#bibliography li')).toHaveCount(28);
    await expect(page.locator('#bibliography')).toContainText('Agricultural Water Management 319, 109758');
    await expect(page.locator('#bibliography')).toContainText('Oregon State University Extension, EM 9305');
    await expect(page.locator('#bibliography')).toContainText('Agricultural Water Management 319, 109755');
    await page.getByRole('button', { name: 'Hide bibliography' }).click();
    await expect(page.locator('#bibliography')).toHaveCount(0);
  });

  test('open the map', async ({ page }) => {
    await mockApi(page);
    await page.goto('learn/impact');
    await page.getByRole('link', { name: 'Open the map' }).click();
    await expect(page).toHaveURL(/\/app$/);
  });

  test('wide screens: lines and textures run edge to edge, content stays in the column', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    await mockApi(page);
    await page.goto('learn/about');

    const geometry = await page.evaluate(() => {
      const section = document.querySelector('main section') as HTMLElement;
      const texture = section.querySelector('[aria-hidden="true"].bg-furrows-stone') as HTMLElement;
      const content = section.querySelector('h2')!.closest('.grid') as HTMLElement;
      const r = (el: Element) => el.getBoundingClientRect();
      return {
        width: window.innerWidth,
        section: { left: r(section).left, right: r(section).right },
        texture: { right: r(texture).right },
        content: { left: r(content).left, width: r(content).width },
      };
    });
    expect(geometry.section).toEqual({ left: 0, right: geometry.width });
    expect(geometry.texture.right).toBe(geometry.width);
    expect(geometry.content.width).toBeLessThanOrEqual(1156);
    expect(geometry.content.left).toBeCloseTo((geometry.width - 1156) / 2, 0);

    await page.screenshot({ path: 'e2e/.output/shots/wide-learn-about.png' });
    await context.close();
  });
});
