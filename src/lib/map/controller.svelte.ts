import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { LngLat } from '../api/recommendations';
import { BASE_STYLE, applyLeafStyle } from './mapStyle';
import { FILL_LAYER, LINE_LAYER, STROKE_LAYER, TONES, drawStyles, type Tone } from './drawStyles';

const STATIC_SOURCE = 'hg-plot';
const STATIC_FILL = 'hg-plot-fill';
const STATIC_STROKE = 'hg-plot-stroke';

export interface MountOptions {
  center?: LngLat;
  zoom?: number;
  onPlotChange: (ring: LngLat[] | null) => void;
}

function ringOf(feature: GeoJSON.Feature | undefined): LngLat[] | null {
  if (!feature || feature.geometry.type !== 'Polygon') return null;
  return feature.geometry.coordinates[0] as LngLat[];
}

/** Owns the Mapbox map and Draw control. Components talk to this, never to Mapbox directly. */
export class MapController {
  ready = $state(false);
  isDrawing = $state(false);
  error = $state<string | null>(null);
  /** Live map centre and zoom, for the coordinates readout. */
  view = $state({ lng: 0, lat: 0, zoom: 0 });
  /** True while the plot is shown read-only (analysing, results). */
  isStatic = $state(false);

  map: mapboxgl.Map | null = null;
  #draw: MapboxDraw | null = null;
  #tone: Tone = 'ok';
  #pendingStatic: LngLat[] | null | undefined = undefined;

  mount(container: HTMLElement, { center = [11.5623, 48.146], zoom = 15, onPlotChange }: MountOptions): void {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      this.error = 'Map unavailable: VITE_MAPBOX_ACCESS_TOKEN is not set.';
      return;
    }
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container,
      style: BASE_STYLE,
      center,
      zoom,
      projection: 'globe',
      attributionControl: false,
      logoPosition: 'bottom-right',
      // Keep the canvas readable for screenshots and PDF export.
      preserveDrawingBuffer: true,
    });
    this.map = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
      styles: drawStyles,
    });
    this.#draw = draw;
    map.addControl(draw as unknown as mapboxgl.IControl);

    map.on('style.load', () => applyLeafStyle(map));

    const updateView = () => {
      const c = map.getCenter();
      this.view = { lng: c.lng, lat: c.lat, zoom: map.getZoom() };
    };
    updateView();
    // Synchronous so HTML overlays (scan grid, chips) stay glued to the map during animations.
    map.on('move', updateView);
    map.on('load', () => {
      this.ready = true;
      this.setTone(this.#tone);
      if (this.#pendingStatic !== undefined) this.showStatic(this.#pendingStatic);
    });
    map.on('error', (event) => {
      if (!this.ready) this.error = event.error?.message ?? 'The map failed to load.';
    });

    map.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
      onPlotChange(ringOf(e.features[0]));
      // Keep only the newest shape.
      for (const feature of draw.getAll().features) {
        if (feature.id !== e.features[0]?.id) draw.delete(String(feature.id));
      }
    });
    map.on('draw.update', (e: { features: GeoJSON.Feature[] }) => onPlotChange(ringOf(e.features[0])));
    map.on('draw.delete', () => onPlotChange(null));
    map.on('draw.modechange', (e: { mode: string }) => {
      this.isDrawing = e.mode === 'draw_polygon';
    });
  }

  destroy(): void {
    this.map?.remove();
    this.map = null;
    this.#draw = null;
    this.ready = false;
    this.isDrawing = false;
  }

  zoomBy(delta: number): void {
    this.map?.easeTo({ zoom: this.map.getZoom() + delta, duration: 250 });
  }

  flyTo(center: LngLat, zoom = 16): void {
    this.map?.flyTo({ center, zoom, essential: true });
  }

  fitTo(ring: LngLat[], padding: number | mapboxgl.PaddingOptions = 80): void {
    if (!this.map || ring.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds(ring[0], ring[0]);
    for (const point of ring) bounds.extend(point);
    this.map.fitBounds(bounds, { padding, maxZoom: 18, duration: 800 });
  }

  /** Starts a fresh polygon, replacing any existing one. */
  startDrawing(): void {
    if (!this.#draw) return;
    this.#draw.deleteAll();
    this.#draw.changeMode('draw_polygon');
    this.isDrawing = true;
  }

  stopDrawing(): void {
    if (!this.#draw) return;
    this.#draw.changeMode('simple_select');
    this.isDrawing = false;
  }

  /** Puts an existing ring back into the editor (after undo, or leaving results). */
  edit(ring: LngLat[] | null): void {
    if (!this.#draw) return;
    this.showStatic(null);
    this.#draw.deleteAll();
    if (ring) {
      this.#draw.add({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } });
    }
    this.#draw.changeMode('simple_select');
    this.isDrawing = false;
  }

  clear(): void {
    this.#draw?.deleteAll();
    this.#draw?.changeMode('simple_select');
    this.showStatic(null);
    this.isDrawing = false;
  }

  setTone(tone: Tone): void {
    this.#tone = tone;
    const map = this.map;
    if (!map || !this.ready) return;
    const t = TONES[tone];
    for (const suffix of ['cold', 'hot']) {
      const fill = `${FILL_LAYER}.${suffix}`;
      if (map.getLayer(fill)) {
        map.setPaintProperty(fill, 'fill-color', t.fill);
        map.setPaintProperty(fill, 'fill-opacity', t.fillOpacity);
      }
      for (const line of [STROKE_LAYER, LINE_LAYER]) {
        const id = `${line}.${suffix}`;
        if (map.getLayer(id)) map.setPaintProperty(id, 'line-color', t.stroke);
      }
    }
  }

  /** Shows the plot read-only (analysing, results) instead of in the editor. `null` removes it. */
  showStatic(ring: LngLat[] | null): void {
    const map = this.map;
    if (!map || !this.ready) {
      this.#pendingStatic = ring;
      this.isStatic = ring !== null;
      return;
    }
    this.#pendingStatic = undefined;

    this.isStatic = ring !== null;
    if (ring === null) {
      if (map.getLayer(STATIC_STROKE)) map.removeLayer(STATIC_STROKE);
      if (map.getLayer(STATIC_FILL)) map.removeLayer(STATIC_FILL);
      if (map.getSource(STATIC_SOURCE)) map.removeSource(STATIC_SOURCE);
      return;
    }

    this.#draw?.deleteAll();
    this.#draw?.changeMode('simple_select');
    this.isDrawing = false;

    const data: GeoJSON.Feature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
    const source = map.getSource(STATIC_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
      return;
    }
    map.addSource(STATIC_SOURCE, { type: 'geojson', data });
    map.addLayer({ id: STATIC_FILL, type: 'fill', source: STATIC_SOURCE, paint: { 'fill-color': '#22C55E', 'fill-opacity': 0.9 } });
    map.addLayer({
      id: STATIC_STROKE,
      type: 'line',
      source: STATIC_SOURCE,
      paint: { 'line-color': '#1B6A24', 'line-width': 2.5 },
    });
  }

  /** Map-pixel position of a lng/lat, for HTML overlays. */
  project(point: LngLat): { x: number; y: number } | null {
    if (!this.map) return null;
    const p = this.map.project(point);
    return { x: p.x, y: p.y };
  }
}

export const mapController = new MapController();
