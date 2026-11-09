import type mapboxgl from 'mapbox-gl';

// Classic Mapbox style whose layers we can recolour; Standard hides its layers behind a few config knobs.
export const BASE_STYLE = 'mapbox://styles/mapbox/light-v11';

export const MAP_COLORS = {
  land: '#F2FEF0',
  green: '#C9F3C9',
  water: '#CFE3F5',
  waterLine: '#9EC6EA',
  building: '#E3F8E1',
  buildingOutline: 'rgba(27, 106, 36, 0.28)',
  roadMajor: 'rgba(27, 106, 36, 0.40)',
  roadMinor: 'rgba(27, 106, 36, 0.22)',
  boundary: 'rgba(27, 106, 36, 0.30)',
  label: '#256F2D',
  halo: '#F2FEF0',
} as const;

const MAJOR_ROAD = /motorway|trunk|primary|secondary/;
const HIDDEN_LABELS = /poi|transit|airport|ferry/;

type Layer = mapboxgl.AnyLayer & { 'source-layer'?: string };

function trySet(fn: () => void): void {
  try {
    fn();
  } catch {
    // Some layers reject a property (e.g. expressions with zoom stops); leave them as they are.
  }
}

/** Recolours the base style in the vivid-leaf palette. Call after `style.load`. */
export function applyLeafStyle(map: mapboxgl.Map): void {
  const layers = (map.getStyle()?.layers ?? []) as Layer[];

  for (const layer of layers) {
    const id = layer.id;
    const sourceLayer = layer['source-layer'] ?? '';

    switch (layer.type) {
      case 'background':
        trySet(() => map.setPaintProperty(id, 'background-color', MAP_COLORS.land));
        break;

      case 'fill':
        if (sourceLayer === 'water') {
          trySet(() => map.setPaintProperty(id, 'fill-color', MAP_COLORS.water));
        } else if (sourceLayer === 'building') {
          trySet(() => map.setPaintProperty(id, 'fill-color', MAP_COLORS.building));
          trySet(() => map.setPaintProperty(id, 'fill-outline-color', MAP_COLORS.buildingOutline));
          trySet(() => map.setPaintProperty(id, 'fill-opacity', 1));
        } else if (sourceLayer === 'landuse' || sourceLayer === 'landcover' || /park|pitch/.test(id)) {
          trySet(() => map.setPaintProperty(id, 'fill-color', MAP_COLORS.green));
          trySet(() => map.setPaintProperty(id, 'fill-opacity', 0.55));
        } else {
          trySet(() => map.setPaintProperty(id, 'fill-color', MAP_COLORS.land));
        }
        break;

      case 'fill-extrusion':
        trySet(() => map.setPaintProperty(id, 'fill-extrusion-color', MAP_COLORS.building));
        break;

      case 'line':
        if (sourceLayer === 'road' || /road|bridge|tunnel/.test(id)) {
          trySet(() => map.setPaintProperty(id, 'line-color', MAJOR_ROAD.test(id) ? MAP_COLORS.roadMajor : MAP_COLORS.roadMinor));
        } else if (sourceLayer === 'waterway') {
          trySet(() => map.setPaintProperty(id, 'line-color', MAP_COLORS.waterLine));
        } else if (/admin|boundary/.test(id)) {
          trySet(() => map.setPaintProperty(id, 'line-color', MAP_COLORS.boundary));
        }
        break;

      case 'symbol':
        if (HIDDEN_LABELS.test(id)) {
          trySet(() => map.setLayoutProperty(id, 'visibility', 'none'));
        } else {
          trySet(() => map.setPaintProperty(id, 'text-color', MAP_COLORS.label));
          trySet(() => map.setPaintProperty(id, 'text-halo-color', MAP_COLORS.halo));
          trySet(() => map.setPaintProperty(id, 'icon-opacity', 0.6));
        }
        break;
    }
  }

  trySet(() =>
    map.setFog({
      color: MAP_COLORS.land,
      'high-color': '#B2F0BE',
      'space-color': '#D9FCD4',
      'horizon-blend': 0.08,
      'star-intensity': 0,
    }),
  );
}
