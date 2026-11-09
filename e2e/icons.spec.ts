import { expect, test } from '@playwright/test';
import { mockApi } from './helpers';

test('favicon, touch icon and manifest are linked and served', async ({ page }) => {
  await mockApi(page);
  await page.goto('');
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')].map((l) => (l as HTMLLinkElement).href),
  );
  expect(hrefs.map((h) => h.split('/').pop())).toEqual(['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest']);

  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
  }

  const manifestUrl = hrefs.at(-1)!;
  const manifest = await (await page.request.get(manifestUrl)).json();
  for (const icon of manifest.icons) {
    const response = await page.request.get(new URL(icon.src, manifestUrl).href);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  }
});
