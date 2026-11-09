"""Plot geometry: centre point and area."""
import logging
import math
from typing import List, Tuple

from shapely import Polygon

logger = logging.getLogger(__name__)


def calculate_polygon_centroid(coordinates: List[Tuple[float, float]]) -> Tuple[float, float]:
    """
    Calculate the centroid (center point) of a polygon.

    Args:
        coordinates: List of (latitude, longitude) tuples

    Returns:
        Tuple of (latitude, longitude) for the centroid
    """
    # Area-weighted centroid of the shape (the corner average is pulled towards edges with many corners).
    points = list(coordinates)
    if len(points) > 1 and points[0] == points[-1]:
        points = points[:-1]
    if len(points) < 3:
        return (sum(p[0] for p in points) / len(points), sum(p[1] for p in points) / len(points))
    shape = Polygon([(lon, lat) for lat, lon in points])
    if not shape.is_valid or shape.area == 0:
        return (sum(p[0] for p in points) / len(points), sum(p[1] for p in points) / len(points))
    return (shape.centroid.y, shape.centroid.x)

def calculate_polygon_area_m2(coordinates: List[Tuple[float, float]]) -> float:
    """
    Calculate the area of a polygon in square meters using the Shoelace formula
    with equirectangular approximation for geographic coordinates.

    This method is accurate for small polygons (< 10 km per side). For larger areas,
    consider using a proper geographic projection.

    Args:
        coordinates: List of (latitude, longitude) tuples defining the polygon

    Returns:
        Area in square meters

    Algorithm:
    1. Convert lat/lon to planar coordinates using equirectangular projection
    2. Apply the Shoelace formula (also known as surveyor's formula)
    3. Return absolute area

    Reference: https://en.wikipedia.org/wiki/Shoelace_formula
    """
    if len(coordinates) < 3:
        return 0.0

    # Earth radius in meters (mean radius)
    EARTH_RADIUS = 6371000

    # Calculate center latitude for the equirectangular projection
    # This minimizes distortion for the local area
    center_lat = sum(lat for lat, lon in coordinates) / len(coordinates)
    center_lat_rad = math.radians(center_lat)

    # Convert geographic coordinates to planar meters using equirectangular approximation
    # x = R * λ * cos(φ₀)  where λ is longitude, φ₀ is center latitude
    # y = R * φ  where φ is latitude
    points_m = []
    for lat, lon in coordinates:
        lat_rad = math.radians(lat)
        lon_rad = math.radians(lon)

        # Convert to meters from the reference meridian/parallel
        x = lon_rad * EARTH_RADIUS * math.cos(center_lat_rad)
        y = lat_rad * EARTH_RADIUS
        points_m.append((x, y))

    # Apply Shoelace formula: A = 1/2 * |Σ(x_i * y_{i+1} - x_{i+1} * y_i)|
    area = 0.0
    n = len(points_m)

    for i in range(n):
        j = (i + 1) % n  # Wrap around to first point
        area += points_m[i][0] * points_m[j][1]
        area -= points_m[j][0] * points_m[i][1]

    area = abs(area) / 2.0
    return area
