import { expect, test, type Page } from '@playwright/test';
import { mockApi, waitForMap } from './helpers';

const FORWARD = '**/search/geocode/v6/forward**';
const REVERSE = '**/search/geocode/v6/reverse**';

const MAXVORSTADT = {
  features: [
    {
      properties: {
        mapbox_id: 'maxvorstadt',
        name: 'Maxvorstadt',
        place_formatted: 'Munich, Bavaria, Germany',
        feature_type: 'locality',
        coordinates: { longitude: 11.5671, latitude: 48.1493 },
        context: { place: { name: 'Munich' } },
      },
    },
    {
      properties: {
        mapbox_id: 'theresienstrasse',
        name: 'Theresienstraße',
        place_formatted: 'Maxvorstadt, Munich, Germany',
        feature_type: 'street',
        coordinates: { longitude: 11.5702, latitude: 48.1505 },
        context: { place: { name: 'Munich' } },
      },
    },
  ],
};

async function shot(page: Page, name: string, project: string): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `e2e/.output/shots/${project}-${name}.png` });
}

/** Replaces the browser's geolocation with a fixed answer. */
async function fakeGeolocation(page: Page, outcome: { lng: number; lat: number } | { code: number }): Promise<void> {
  await page.addInitScript((o) => {
    const geo = {
      getCurrentPosition(ok: PositionCallback, fail?: PositionErrorCallback) {
        setTimeout(() => {
          if ('code' in o) fail?.({ code: o.code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: '' } as GeolocationPositionError);
          else ok({ coords: { longitude: o.lng, latitude: o.lat, accuracy: 10 }, timestamp: Date.now() } as unknown as GeolocationPosition);
        }, 50);
      },
      watchPosition: () => 0,
      clearWatch: () => {},
    };
    Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
  }, outcome);
}

const lat = (page: Page) => page.evaluate(() => (window as any).__hg.map.view.lat as number);

test.describe('address search', () => {
  test('suggests places as you type and flies to the pick', async ({ page }, info) => {
    await mockApi(page);
    const queries: string[] = [];
    await page.route(FORWARD, (route) => {
      queries.push(new URL(route.request().url()).searchParams.get('q') ?? '');
      return route.fulfill({ json: MAXVORSTADT });
    });
    await page.goto('app');
    await waitForMap(page);
    await page.getByRole('button', { name: /Cairo/ }).click();

    const box = page.getByRole('combobox', { name: 'Search for an address or place' });
    await box.fill('Maxvorst');
    const options = page.getByRole('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toContainText('Maxvorstadt');
    await expect(options.nth(0)).toContainText('Munich, Bavaria, Germany · district');
    await expect(options.nth(2)).toContainText('Use my location');
    await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');
    // Typing is debounced into a single request.
    expect(queries).toEqual(['Maxvorst']);
    await shot(page, 'search', info.project.name);

    await box.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await box.press('ArrowUp');
    await box.press('Enter');

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(box).toHaveValue('Maxvorstadt');
    await expect(page.getByRole('button', { name: /Cairo/ })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText(/Maxvorstadt, Munich · (ready|zoom in) to draw/)).toBeVisible();
    await page.waitForFunction(() => Math.abs((window as any).__hg.map.view.lat - 48.149) < 0.01, null, { timeout: 15_000 });
    await expect(page.getByTestId('map-pin')).toBeAttached();

    // The pin is only for picking a place.
    await page.getByRole('button', { name: /Draw your plot here/ }).click();
    await expect(page.getByTestId('map-pin')).not.toBeAttached();
  });

  test('says so when nothing matches or search is down', async ({ page }) => {
    await mockApi(page);
    let fail = false;
    await page.route(FORWARD, (route) => (fail ? route.fulfill({ status: 500, body: '' }) : route.fulfill({ json: { features: [] } })));
    await page.goto('app');
    await waitForMap(page);

    const box = page.getByRole('combobox', { name: 'Search for an address or place' });
    await box.fill('Qwxz');
    await expect(page.getByText('No places found. Try another spelling.')).toBeVisible();
    fail = true;
    await box.fill('Qwxzy');
    await expect(page.getByText(/Search is not available right now/)).toBeVisible();
    await expect(page.getByRole('option', { name: /Use my location/ })).toBeVisible();

    await box.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
  });
});

test.describe('use my location', () => {
  test('flies to the position and names it', async ({ page }) => {
    await mockApi(page);
    await fakeGeolocation(page, { lng: 31.2357, lat: 30.0444 });
    await page.route(REVERSE, (route) =>
      route.fulfill({ json: { features: [{ properties: { context: { neighborhood: { name: 'Downtown' }, place: { name: 'Cairo' } } } }] } }),
    );
    await page.goto('app');
    await waitForMap(page);

    await page.getByRole('combobox', { name: 'Search for an address or place' }).click();
    await page.getByRole('option', { name: /Use my location/ }).click();
    await page.waitForFunction(() => Math.abs((window as any).__hg.map.view.lat - 30.04) < 0.01, null, { timeout: 15_000 });
    await expect(page.getByText(/Downtown, Cairo · (ready|zoom in) to draw/)).toBeVisible();
    await expect(page.getByTestId('map-pin')).toBeAttached();
    await expect(page.getByTestId('location-notice')).toBeHidden();
  });

  test('explains a refusal and points to the search box', async ({ page }, info) => {
    await mockApi(page);
    await fakeGeolocation(page, { code: 1 });
    await page.goto('app');
    await waitForMap(page);
    const before = await lat(page);

    const box = page.getByRole('combobox', { name: 'Search for an address or place' });
    await box.click();
    await page.getByRole('option', { name: /Use my location/ }).click();

    const notice = page.getByTestId('location-notice');
    await expect(notice).toContainText('We could not see where you are');
    await expect(notice).toContainText('Location is switched off for this site.');
    await expect(box).toBeFocused();
    expect(await lat(page)).toBeCloseTo(before, 3);
    await shot(page, 'location-refused', info.project.name);

    // Picking a sample city clears the notice.
    await page.getByRole('button', { name: /Munich/ }).click();
    await expect(notice).toBeHidden();
  });
});
