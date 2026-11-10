import { expect, test } from '@playwright/test';
import { PLOTS, drawPlot, mockApi, usable, waitForMap } from './helpers';

// One smoke check per translated language: landing, the place step and a Learn page.
const SMOKE = [
  { lang: 'es', label: 'Idioma', landing: '¿Qué podría cultivar tu ciudad?', analyse: 'Analizar esta parcela', learn: 'Cómo obtiene un cultivo su puntuación', formula: 'Fórmula: Factor más débil' },
  { lang: 'fr', label: 'Langue', landing: 'Que pourrait cultiver votre ville\u202f?', analyse: 'Analyser cette parcelle', learn: 'Comment une culture obtient son score', formula: 'Formule\u00a0: Facteur le plus faible' },
  { lang: 'pt', label: 'Idioma', landing: 'O que sua cidade poderia cultivar?', analyse: 'Analisar este terreno', learn: 'Como um cultivo recebe sua pontuação', formula: 'Fórmula: Fator mais fraco' },
];

const GERMAN_CROPS: Record<string, string> = { kale: 'Grünkohl', cabbage: 'Weißkohl', lettuce: 'Salat', spinach: 'Spinat', beetroot: 'Rote Bete' };

test.describe('languages', () => {
  test('the switcher changes the language and remembers it', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('heading', { level: 1, name: 'What could your city grow?' }).first()).toBeAttached();

    await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
    await expect(page.getByRole('heading', { level: 1, name: 'Was könnte deine Stadt anbauen?' }).first()).toBeAttached();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Sprache' })).toHaveValue('de');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });

  test('a ?lang=de link opens the whole journey in German', async ({ page, isMobile }) => {
    await mockApi(page, 'munich');
    await page.goto('app?lang=de');
    await waitForMap(page);
    await drawPlot(page, PLOTS.munich);
    await page.waitForFunction(() => (window as any).__hg.journey.plot?.placeName);
    await page.getByRole('button', { name: 'Diese Fläche analysieren' }).click();

    await expect(page.getByRole('button', { name: /Klima auf dieser Fläche/ })).toBeVisible();
    if (isMobile) await expect(page.getByText(/Vier Beete füllen deine Fläche/)).toBeVisible();
    else await expect(page.getByRole('img', { name: /^Beispielplan für deine Fläche: Vier Beete mit [A-ZÄÖÜ]/ })).toBeVisible();

    const top = usable('munich')[0];
    const name = GERMAN_CROPS[top.crop_id];
    expect(name, `add a German name for ${top.crop_id} to this test`).toBeTruthy();
    await page.getByRole('link', { name: new RegExp(name) }).first().click();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await expect(page.getByText('Erwartete Ernte pro Saison')).toBeVisible();
    await expect(page.getByText('Wann anbauen')).toBeVisible();
  });

  test('Learn pages follow the language', async ({ page }) => {
    await page.goto('learn/scoring?lang=de');
    await expect(page.getByRole('heading', { level: 1, name: 'Wie eine Pflanze ihre Bewertung bekommt' })).toBeVisible();
    await expect(page.getByLabel('Formel: Schwächster Faktor')).toBeAttached();
  });

  for (const t of SMOKE) {
    test(`${t.lang}: landing, place step and Learn are translated`, async ({ page }) => {
      await page.goto(`?lang=${t.lang}`);
      await expect(page.getByRole('heading', { level: 1, name: t.landing }).first()).toBeAttached();
      await expect(page.locator('html')).toHaveAttribute('lang', t.lang);
      await expect(page.getByRole('combobox', { name: t.label })).toHaveValue(t.lang);

      await mockApi(page, 'munich');
      await page.goto('app');
      await waitForMap(page);
      await drawPlot(page, PLOTS.munich);
      await expect(page.getByRole('button', { name: t.analyse })).toBeVisible();

      await page.goto('learn/scoring');
      await expect(page.getByRole('heading', { level: 1, name: t.learn })).toBeVisible();
      await expect(page.getByLabel(t.formula)).toBeAttached();
    });
  }
});
