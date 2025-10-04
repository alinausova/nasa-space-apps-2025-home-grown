# Home Grown 🌱

**NASA Space Apps Challenge 2025** - Urban garden planning project with interactive mapping

## Project Structure

```
nasa-space-apps-2025-home-grown/
├── src/              # Svelte frontend
├── api/              # FastAPI backend
├── .github/          # GitHub Actions workflows
└── render.yaml       # Render deployment config
```

## Tech Stack

### Frontend
- **Svelte 5** - Modern reactive framework
- **Vite 6** - Build tool
- **Mapbox GL JS 3.15** - Interactive maps
- **TypeScript** - Type safety

### Backend
- **FastAPI** - Modern Python API framework
- **httpx** - Async HTTP client for external APIs
- **uvicorn** - ASGI server

## Local Development

### Frontend

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your VITE_MAPBOX_ACCESS_TOKEN

# Start dev server
npm run dev
# Opens at http://localhost:5173/nasa-space-apps-2025-home-grown/
```

### Backend

```bash
# Navigate to API directory
cd api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your EXTERNAL_API_KEY and other secrets

# Start dev server
uvicorn main:app --reload --port 8000
# Opens at http://localhost:8000
# API docs at http://localhost:8000/docs
```

## Deployment

### Frontend → GitHub Pages

Automatically deploys on push to `main` branch via GitHub Actions.

**Setup:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add secret: `VITE_MAPBOX_ACCESS_TOKEN`
3. Go to Settings → Pages
4. Set source to "GitHub Actions"
5. Push to main → auto-deploys!

**URL:** `https://alinausova.github.io/nasa-space-apps-2025-home-grown/`

### Backend → Render

**Setup:**
1. Create account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Render will auto-detect `render.yaml`
4. Set environment variables in Render dashboard:
   - `EXTERNAL_API_KEY`
   - Any other secrets from `api/.env.example`
5. Deploy!

**Update Frontend API URL:**
After deploying backend, update `src/lib/api.ts`:
```typescript
const API_URL = import.meta.env.PROD
  ? 'https://your-app-name.onrender.com'  // ← Your Render URL here
  : 'http://localhost:8000';
```

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - Health status
- `GET /api/example` - Example endpoint
- `GET /api/external-example` - Example external API call
- `GET /api/cached-data` - Example cached data

View full API docs at: `http://localhost:8000/docs` (local) or `https://your-app.onrender.com/docs` (production)

## Using the API in Frontend

```typescript
import { checkHealth, getExample } from './lib/api';

// Check API health
const status = await checkHealth();

// Get example data
const data = await getExample();
```

## Project Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type check

# Backend
cd api
uvicorn main:app --reload     # Start dev server
python -m pytest              # Run tests (when added)
```

## Environment Variables

### Frontend (`.env`)
```
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Backend (`api/.env`)
```
EXTERNAL_API_KEY=your-nasa-api-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally (both frontend and backend)
5. Submit a pull request

## License

MIT

---

**NASA Space Apps Challenge 2025**
Built with ❤️ using Svelte, FastAPI, and Mapbox
