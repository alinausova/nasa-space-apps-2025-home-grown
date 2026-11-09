"""Request models."""
import logging
from typing import Annotated, List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)


class PolygonInput(BaseModel):
    """Polygon with coordinate points [(lat, lon), ...]"""
    coordinates: List[Tuple[float, float]] = Field(..., min_length=3, max_length=500,
                                                   description="List of (latitude, longitude) tuples")
    sunshine_duration: Optional[List[Annotated[float, Field(ge=0, le=1)]]] = Field(
        None, max_length=500,
        description="List of sunshine duration factors (0-1) for each point. If not provided, defaults to 0.7")

    @field_validator("coordinates")
    @classmethod
    def check_coordinates(cls, value: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        for lat, lon in value:
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                raise ValueError("Coordinates must be (latitude, longitude) with latitude in [-90, 90] and longitude in [-180, 180]")
        return value


class PlotRef(BaseModel):
    """A plot analysed by POST /analysis/climate, referenced by its id."""
    plot_id: str = Field(..., min_length=8, max_length=64)


class CropsRequest(PlotRef):
    use_landsat: bool = Field(True, description="Read Landsat surface temperature (false = NASA POWER only)")
