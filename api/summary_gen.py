import os
import json
import mistralai
from mistralai import Mistral

api_key = os.getenv("MISTRAL_API_KEY")

def generate_crop_summary(api_response: dict, api_key: str = None) -> str:
    """
    Generate a natural language summary of crop recommendations using Mistral AI.

    Args:
        api_response: The JSON response from /recommendations/polygon endpoint
        api_key: Mistral API key (defaults to MISTRAL_API_KEY env variable)

    Returns:
        String containing ~300 word summary of recommendations
    """

    # Get API key
    if api_key is None:
        api_key = os.environ.get("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY not found in environment variables")

    # Initialize Mistral client
    client = Mistral(api_key=api_key)
    model = "mistral-large-latest"

    # System prompt - defines the assistant's role and constraints
    system_prompt = """You are an expert urban agriculture advisor providing data-driven crop recommendations.

Write in a professional yet friendly tone, suitable to inform urban planners. 
Use vegetable/crop emojis (🍅 🥕 🥬 🌽 🥔 🫑 etc.) when mentioning
specific crops, and use **bold** for crop names and key metrics.

Format guidelines:
- Keep it concise and structured - approximately 100 words
- Use bullet points for crop recommendations
- No section headers - flow directly from climate overview to recommendations
- Avoid excessive emojis - only use them for actual crops

Your summary should cover:
1. Brief climate context (area, temperature range, sunlight hours)
2. Top 3-4 suitable crops with suitability scores and expected yields
3. Key consideration (irrigation needs, filtered crops, or growing season note)
4. One practical recommendation

Be direct and informative while maintaining an encouraging tone."""

    # Format the API response data for the LLM
    # Extract key information to make the prompt more focused
    location_info = api_response.get("location", {})
    climate_summary = api_response.get("climate_summary", {})
    recommendations = api_response.get("recommendations", [])
    total_suitable = api_response.get("total_suitable_crops", 0)
    filtered_count = api_response.get("total_filtered_by_sunlight", 0)

    # Build a structured data summary
    data_summary = {
        "location": {
            "area_m2": location_info.get("area_m2"),
            "area_hectares": location_info.get("area_hectares"),
            "coordinates": {
                "lat": location_info.get("center_latitude"),
                "lon": location_info.get("center_longitude")
            }
        },
        "climate": {
            "avg_temp_max": climate_summary.get("avg_temp_max"),
            "avg_temp_min": climate_summary.get("avg_temp_min"),
            "annual_precipitation_mm": climate_summary.get("annual_precipitation_mm"),
            "sunshine_hours": climate_summary.get("representative_sun_hours_daily")
        },
        "sunshine_factor": api_response.get("sunshine_factor"),
        "statistics": {
            "total_suitable_crops": total_suitable,
            "filtered_by_sunlight": filtered_count
        },
        "top_recommendations": []
    }

    # Include top recommendations with detailed info
    for crop in recommendations[:5]:  # Top 5 crops
        suitability = crop.get("suitability", {})
        metrics = suitability.get("metrics", {})
        yield_est = suitability.get("yield_estimate", {})

        crop_summary = {
            "name": crop.get("crop_name"),
            "overall_score": suitability.get("overall_score"),
            "category": suitability.get("category"),
            "scores": suitability.get("scores", {}),
            "growing_days": metrics.get("growing_days"),
            "adjusted_sun_hours": metrics.get("adjusted_sun_hours"),
            "irrigation_needed_mm": metrics.get("irrigation_needed_mm"),
            "yield": {
                "per_m2_kg": yield_est.get("yield_per_m2_kg"),
                "total_kg": yield_est.get("total_yield_kg"),
                "category": yield_est.get("yield_category")
            }
        }
        data_summary["top_recommendations"].append(crop_summary)

    # Create the user prompt with formatted data
    user_prompt = f"""Analyze this crop recommendation data and provide a concise summary:

DATA:
{json.dumps(data_summary, indent=2)}

Write a professional, structured summary (~100 words) using markdown:

Start with climate context described in words (e.g., "warm summers with moderate rainfall" or "mild climate with ample sunshine"), not raw numbers. Mention the area size in m² or hectares.

Then list the top 3-4 crops as bullet points:
- Use crop emoji (🍅 🥕 🥬 🌽 etc.) + **crop name** + suitability score + expected yield
- Example: "🍅 **Tomatoes** - 85% suitability, ~12 kg/m²"

Include one key consideration (irrigation needs, filtered crops, or sunshine factor).

End with a brief practical recommendation.

Be concise, data-driven, and encouraging. Only use emojis for crops, not for other elements."""

    # Make API call to Mistral
    chat_response = client.chat.complete(
        model=model,
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        temperature=0.7,  # Balanced creativity and consistency
        max_tokens=400    # Approximately 150-200 words for concise output
    )

    # Extract and return the summary
    summary = chat_response.choices[0].message.content
    return summary