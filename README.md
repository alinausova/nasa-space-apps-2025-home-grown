# Home Grown 🌱

**NASA Space Apps Challenge 2025** - Urban agriculture planning with climate-based crop recommendations

🌐 **Live:** [https://alinausova.github.io/nasa-space-apps-2025-home-grown/](https://alinausova.github.io/nasa-space-apps-2025-home-grown/)

## Features

- 🗺️ Interactive 3D globe with polygon drawing
- 🌱 Crop recommendations based on NASA climate data
- 📊 Yield estimates for selected areas
- ☀️ Climate analysis (temperature, precipitation, sunlight)
- 💧 Water and irrigation requirements

## Quick Start

### Frontend

```bash
npm install
cp .env.example .env  # Add your VITE_MAPBOX_ACCESS_TOKEN
npm run dev
```

### Backend

```bash
cd api
uv sync
cp .env.example .env  # Add your EXTERNAL_API_KEY
uv run uvicorn main:app --reload --port 8000
```

## Tech Stack

- **Frontend:** Svelte 5, Vite, Mapbox GL JS, TypeScript
- **Backend:** FastAPI, uv, NASA POWER API
- **Deploy:** GitHub Pages (frontend), Render (backend)

## API Docs

Visit `http://localhost:8000/docs` for interactive API documentation

---

**NASA Space Apps Challenge 2025**
