// Mapbox Draw layer styles. Tone (normal / too large) is switched at runtime with setPaintProperty,
// see TONES and MapController.setTone.

export type Tone = 'ok' | 'warn';

export const TONES: Record<Tone, { fill: string; fillOpacity: number; stroke: string }> = {
  // While editing, the plot is a light tint with a dashed outline; it turns solid bright green once read-only.
  ok: { fill: '#1B6A24', fillOpacity: 0.12, stroke: '#1B6A24' },
  warn: { fill: '#F2A93B', fillOpacity: 0.3, stroke: '#C97A12' },
};

export const FILL_LAYER = 'hg-draw-fill';
export const STROKE_LAYER = 'hg-draw-stroke';
export const LINE_LAYER = 'hg-draw-line';

export const drawStyles = [
  {
    id: FILL_LAYER,
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: { 'fill-color': TONES.ok.fill, 'fill-opacity': TONES.ok.fillOpacity },
  },
  {
    id: STROKE_LAYER,
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': TONES.ok.stroke, 'line-width': 3, 'line-dasharray': [2, 1.5] },
  },
  {
    id: LINE_LAYER,
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': TONES.ok.stroke, 'line-width': 3, 'line-dasharray': [2, 1.5] },
  },
  {
    id: 'hg-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: { 'circle-radius': 3.5, 'circle-color': '#1B6A24', 'circle-opacity': 0.5 },
  },
  {
    id: 'hg-draw-vertex',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': ['case', ['==', ['get', 'active'], 'true'], 8, 6.5],
      'circle-color': '#F2FEF0',
      'circle-stroke-color': '#1B6A24',
      'circle-stroke-width': 3,
    },
  },
];
