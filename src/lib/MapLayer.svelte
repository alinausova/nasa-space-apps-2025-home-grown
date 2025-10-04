<script lang="ts">
    import {onDestroy, onMount} from "svelte";
    import mapboxgl from "mapbox-gl";
    import MapboxDraw from "@mapbox/mapbox-gl-draw";
    import PolygonDrawer from "./PolygonDrawer.svelte";

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    let showBackdrop = $state(true);
    let map: mapboxgl.Map | null = null;
    let draw: MapboxDraw | null = null;
    let polygonCoordinates: number[][][] | null = $state(null);
    let isDrawing = $state(false);

    // Globe spinning animation settings
    const secondsPerRevolution = 120;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;

    let userInteracting = false;
    let spinEnabled = true;

    function spinGlobe() {
        const zoom = map?.getZoom();
        if (!map || !zoom) {
            return;
        }
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
                // Slow spinning at higher zooms
                const zoomDif =
                    (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
                distancePerSecond *= zoomDif;
            }
            const center = map?.getCenter();
            center.lng -= distancePerSecond;
            // Smoothly animate the map over one second.
            // When this animation is complete, it calls a 'moveend' event.
            map?.easeTo({center, duration: 875, easing: (n) => n});
        }
    }

    function startExploring() {
        showBackdrop = false;
        spinEnabled = false;
        map?.setConfigProperty('basemap', 'lightPreset', 'dawn');
        // Fly to Munich
        map?.flyTo({
            center: [11.5820, 48.1351],
            zoom: 12,
            essential: true
        });
    }

    function toggleDrawMode() {
        if (!draw || !map) return;

        isDrawing = !isDrawing;

        if (isDrawing) {
            // Enter polygon drawing mode
            draw.changeMode('draw_polygon');
        } else {
            // Exit drawing mode
            draw.changeMode('simple_select');
        }
    }

    function clearPolygon() {
        if (draw) {
            draw.deleteAll();
            polygonCoordinates = null;
            isDrawing = false;
        }
    }

    function handleDrawCreate(e: any) {
        const data = e.features[0];
        if (data.geometry.type === 'Polygon') {
            polygonCoordinates = data.geometry.coordinates;
            isDrawing = false;
        }
    }

    function handleDrawUpdate(e: any) {
        const data = e.features[0];
        if (data && data.geometry.type === 'Polygon') {
            polygonCoordinates = data.geometry.coordinates;
        }
    }

    function handleDrawDelete() {
        polygonCoordinates = null;
    }

    let interval: ReturnType<typeof setInterval>

    onMount(() => {
        mapboxgl.accessToken = accessToken;

        map = new mapboxgl.Map({
            container: 'map',
            center: [0, 20],
            zoom: 1,
        });

        if (!map) {
            return;
        }

        map.on('style.load', () => {
            map?.setConfigProperty('basemap', 'lightPreset', 'dusk');
            map?.setLight({
                anchor: 'map',
                color: 'orange',
                intensity: 0.9
            });
        });

        map.on('load', () => {
            interval = setInterval(spinGlobe, 875);

            // Initialize Mapbox Draw
            draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: {},
                defaultMode: 'simple_select'
            });

            map?.addControl(draw as any);

            // Listen to draw events
            map?.on('draw.create', handleDrawCreate);
            map?.on('draw.update', handleDrawUpdate);
            map?.on('draw.delete', handleDrawDelete);
        });

        // Pause spinning when user interacts
        map.on('mousedown', () => {
            userInteracting = true;
        });
        map.on('mouseup', () => {
            userInteracting = false;
        });
    });

    // Cleanup function to remove the map when the component is destroyed
    onDestroy(() => {
        if (map) {
            map.remove();
            map = null;
        }
        clearInterval(interval);
    });
</script>

<style>
    #map {
        width: 100vw;
        height: 100vh;
    }

    .overlay-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .column {
        display: flex;
        flex-direction: column;
    }

    .overlay-title {
        font-size: 12rem;
        font-weight: bold;
        color: #4ade80;
        text-transform: uppercase;
        line-height: 13rem;
        margin: 24px;
    }

    .draw-controls {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
    }

    .draw-button {
        background: #4ade80;
        color: #1a1a1a;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s;
    }

    .draw-button:hover {
        background: #22c55e;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .draw-button:active {
        transform: translateY(0);
    }
</style>

{#if showBackdrop}
    <div class="overlay-backdrop column">
        <h1 class="overlay-title">
            Home Grown
        </h1>
        <button onclick={startExploring}>Start Exploring</button>
    </div>
{/if}

<!-- Map Container -->
<div id="map"></div>

<!-- Draw Controls -->
{#if !showBackdrop}
    <div class="draw-controls">
        <button class="draw-button" onclick={toggleDrawMode}>
            {isDrawing ? 'Cancel Drawing' : 'Draw Polygon'}
        </button>
    </div>
{/if}

<!-- Polygon Coordinates Display -->
<PolygonDrawer coordinates={polygonCoordinates} onClear={clearPolygon} />
