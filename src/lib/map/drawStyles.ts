// Mapbox Draw layer styles. Tone (normal / too large) is switched at runtime with setPaintProperty,
// see TONE_PAINT and MapController.setTone.

export type Tone = 'ok' | 'warn';

export const TONES: Record<Tone, { fill: string; fillOpacity: number; stroke: string }> = {
  ok: { fill: '#22C55E', fillOpacity: 0.55, stroke: '#1B6A24' },
  warn: { fill: '#F2A93B', fillOpacity: 0.35, stroke: '#C97A12' },
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
    paint: { 'line-color': TONES.ok.stroke, 'line-width': 2.5 },
  },
  {
    id: LINE_LAYER,
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': TONES.ok.stroke, 'line-width': 2, 'line-dasharray': [0.5, 2] },
  },
  {
    id: 'hg-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: { 'circle-radius': 4, 'circle-color': '#22C55E', 'circle-stroke-color': '#F2FEF0', 'circle-stroke-width': 1.5 },
  },
  {
    id: 'hg-draw-vertex',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': ['case', ['==', ['get', 'active'], 'true'], 7, 5.5],
      'circle-color': '#1B6A24',
      'circle-stroke-color': '#F2FEF0',
      'circle-stroke-width': 2,
    },
  },
];
