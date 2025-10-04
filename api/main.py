from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Home Grown API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://alinausova.github.io",  # GitHub Pages
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "status": "healthy",
        "message": "Home Grown API is running",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.get("/api/example")
async def example_endpoint():
    """Example endpoint demonstrating response structure"""
    return {
        "message": "This is an example endpoint",
        "data": {
            "sample": "data",
            "nested": {
                "value": 123
            }
        }
    }


@app.get("/api/external-example")
async def external_api_example():
    """
    Example endpoint that calls an external API
    Replace this with actual NASA API calls
    """
    try:
        async with httpx.AsyncClient() as client:
            # Example: Replace with NASA API endpoint
            response = await client.get(
                "https://api.github.com/zen",
                timeout=30.0  # No timeout limits on Render!
            )
            return {
                "success": True,
                "data": response.text,
                "status_code": response.status_code
            }
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "External API request timed out"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Example endpoint with caching (implement with Redis or in-memory for production)
_cache = {}

@app.get("/api/cached-data")
async def get_cached_data():
    """
    Example of cached data endpoint
    In production, use Redis or proper caching library
    """
    if "data" in _cache:
        return {
            "cached": True,
            "data": _cache["data"]
        }

    # Simulate fetching from external API
    data = {"timestamp": "2025-10-04", "value": 42}
    _cache["data"] = data

    return {
        "cached": False,
        "data": data
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
