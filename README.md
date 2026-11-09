# Home Grown 🌱

**NASA Space Apps Challenge 2025** · Draw a plot anywhere on Earth and get a ranked list of crops that will grow there, from a year of NASA climate data.

🏆 Winner · Pitch Perfect at COP30, the UN Climate Change Conference, Belém 2025

🌐 **Live:** https://home-grown.app/
📖 **How it works:** https://home-grown.app/learn/scoring

## What it does

1. **Pick a place**: move the map anywhere, or jump to a sample climate (Munich, Cairo, Belém, Reykjavík).
2. **Draw your plot**: click the corners of a roof, yard or empty lot (up to 1 km²), with live area and undo.
3. **We read the data**: NASA POWER daily climate for a year, plus Landsat surface temperature where clear scenes exist.
4. **Get your crops**: every crop scored on heat, sunlight, temperature and water, with an example planting plan, yield estimates, irrigation needs, a climate chart and a short summary by Mistral AI.
5. **Crop detail**: why each crop scores what it does, expected harvest and similar crops.

## Quick start

### Front end

```bash
npm install
cp .env.example .env   # set VITE_MAPBOX_ACCESS_TOKEN (and VITE_API_URL if the API is not on :8000)
npm run dev            # http://localhost:5173/
```

### Back end

```bash
cd api
uv sync
cp .env.example .env   # set MISTRAL_API_KEY
uv run uvicorn main:app --reload --port 8000   # API docs at http://localhost:8000/docs
```

## Checks

| Command | What it runs |
|---|---|
| `npm run check` | svelte-check + TypeScript |
| `npm test` | Unit tests (vitest) for scoring helpers, routes, API client, journey state, plan, climate, text |
| `npm run e2e` | End-to-end tests (Playwright, desktop 1440 + mobile 390) with a real Mapbox map and the API mocked from `e2e/fixtures/`; includes axe accessibility checks. Needs `VITE_MAPBOX_ACCESS_TOKEN` in `.env`. First run: `npx playwright install chromium` |
| `cd api && uv run pytest` | Back-end tests (NASA, Landsat and Mistral stubbed) |

CI runs `check`, `test` and `build` on every pull request (`.github/workflows/ci.yml`); back-end tests run in `ci-api.yml`.

## Project structure

```
src/
  App.svelte              routes: landing, app (lazy, loads Mapbox), learn, dev gallery (dev only)
  styles/                 design tokens (tokens.css) mapped to Tailwind 4 in app.css
  assets/                 SVGs from the design handoff (landing sky, loader, textures, laurel)
  lib/
    router/               path router with GitHub Pages 404 support
    api/                  typed API client
    state/journey.svelte.ts   place → draw → analysing → results
    map/                  Mapbox controller, restyled base map, draw styles, overlays
    layout/               desktop sidebar + map, mobile bottom sheet
    ui/                   design-system primitives (Button, Chip, FactorBar, ScoreRing, …)
    derive/               pure, unit-tested logic (scores, area, climate, plan, reasons, …)
    screens/              landing, place, draw, analysing, results, crop, learn
api/                      FastAPI back end: main.py (routes), climate.py, landsat.py, scoring.py, geometry.py, models.py, crop_database.py, summary_gen.py, tests/
e2e/                      Playwright tests and fixtures
```

## Tech stack

- **Front end:** Svelte 5, TypeScript, Vite, Tailwind CSS 4, Mapbox GL JS, Mapbox Draw, Turf.js
- **Back end:** FastAPI, uv, NASA POWER, Microsoft Planetary Computer (Landsat), Mistral AI
- **Hosting:** GitHub Pages (front end), Render (back end)

---

**NASA Space Apps Challenge 2025**
