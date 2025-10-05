<script lang="ts">
    import {onDestroy, onMount} from "svelte";
    import mapboxgl from "mapbox-gl";
    import MapboxDraw from "@mapbox/mapbox-gl-draw";
    import AreaAnalysisPanel from "./AreaAnalysisPanel.svelte";
    import { getCropRecommendations, type CropRecommendation } from "./api";

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    let showBackdrop = $state(true);
    let map: mapboxgl.Map | null = null;
    let draw: MapboxDraw | null = null;
    let polygonCoordinates: number[][][] | null = $state(null);
    let isDrawing = $state(false);
    let navControl: mapboxgl.NavigationControl | null = null;
    let geolocateControl: mapboxgl.GeolocateControl | null = null;
    let scaleControl: mapboxgl.ScaleControl | null = null;

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

        // Add map controls after user starts exploring
        if (map) {
            navControl = new mapboxgl.NavigationControl({
                showCompass: true,
                showZoom: true,
                visualizePitch: true
            });
            map.addControl(navControl, 'bottom-left');

            geolocateControl = new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            });
            map.addControl(geolocateControl, 'bottom-left');

            scaleControl = new mapboxgl.ScaleControl({
                maxWidth: 100,
                unit: 'metric'
            });
            map.addControl(scaleControl, 'bottom-left');
        }

        // Fly to Munich
        map?.flyTo({
            center: [11.5623, 48.1460],
            zoom: 16,
            essential: true
        });
    }

    function flyToCity(lat: number, lng: number, zoom: number = 15) {
        if (!map) return;

        map.flyTo({
            center: [lng, lat],
            zoom: zoom,
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

    async function analyzePolygon() {
        if (!polygonCoordinates) {
            throw new Error('No polygon coordinates available');
        }

        const response = await getCropRecommendations(polygonCoordinates);
        return response;
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

            // Initialize Mapbox Draw with custom styles
            draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: {},
                defaultMode: 'simple_select',
                styles: [
                    // Polygon fill
                    {
                        'id': 'gl-draw-polygon-fill',
                        'type': 'fill',
                        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                        'paint': {
                            'fill-color': '#3b82f6',
                            'fill-opacity': 0.3
                        }
                    },
                    // Polygon outline
                    {
                        'id': 'gl-draw-polygon-stroke-active',
                        'type': 'line',
                        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                        'paint': {
                            'line-color': '#3b82f6',
                            'line-width': 3
                        }
                    },
                    // Vertex points (regular)
                    {
                        'id': 'gl-draw-polygon-and-line-vertex-inactive',
                        'type': 'circle',
                        'filter': ['all', ['==', 'meta', 'vertex'], ['!=', 'meta', 'midpoint']],
                        'paint': {
                            'circle-radius': 6,
                            'circle-color': '#3b82f6'   // Blue for others
                        
                        }
                    },
                    // Line being drawn
                    {
                        'id': 'gl-draw-line',
                        'type': 'line',
                        'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
                        'paint': {
                            'line-color': '#3b82f6',
                            'line-width': 2
                        }
                    }
                ]
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
        if (map && draw) {
            // Remove draw control first to prevent duplicate layer errors
            map.removeControl(draw);
            draw = null;
        }
        if (map) {
            // Remove other controls
            if (navControl) map.removeControl(navControl);
            if (geolocateControl) map.removeControl(geolocateControl);
            if (scaleControl) map.removeControl(scaleControl);

            map.remove();
            map = null;
        }
        navControl = null;
        geolocateControl = null;
        scaleControl = null;
        clearInterval(interval);
    });
</script>

<style>
    .glassmorphism-button {
        backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0px 2px 8px 0 rgba(102, 126, 234, 0.15);
    }

    .glassmorphism-button:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.2) 100%);
    }
    .explore-button:hover {
        background: linear-gradient(135deg, rgba(139, 102, 234, 0.4) 0%, rgba(118, 75, 162, 0.2) 100%);
    }
    .learn-button:hover {
        background: linear-gradient(135deg, rgba(102, 234, 168, 0.4) 0%, rgba(75, 162, 118, 0.2) 100%);
    }
</style>

<!-- GitHub Link and Title -->
{#if !showBackdrop}
<div class="fixed top-5 left-5 z-[1000] flex items-center gap-3">

    <h1 class="text-2xl font-bold text-neutral-900 uppercase">
        Home Grown</h1>
    
    <a
    href="/nasa-space-apps-2025-home-grown/learn-more"
    target="_blank"
    rel="noopener noreferrer"
    class="w-8 h-8 flex items-center justify-center transition-opacity duration-200 hover:opacity-70 no-underline"
    title="Learn More"
>
    <svg viewBox="0 0 85 85" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-[#1a1a1a]">
        <path d="M42.5,0.003C19.028,0.003,0,19.031,0,42.503s19.028,42.5,42.5,42.5S85,65.976,85,42.503S65.972,0.003,42.5,0.003z M42.288,66.27c0,0-1.972,1.311-3.32,1.305c-0.12,0.055-0.191,0.087-0.191,0.087l0.003-0.087c-0.283-0.013-0.568-0.053-0.855-0.125 l-0.426-0.105c-2.354-0.584-3.6-2.918-3.014-5.271l3.277-13.211l1.479-5.967c1.376-5.54-4.363,1.178-5.54-1.374 c-0.777-1.687,4.464-5.227,8.293-7.896c0,0,1.97-1.309,3.319-1.304c0.121-0.056,0.192-0.087,0.192-0.087l-0.005,0.087 c0.285,0.013,0.57,0.053,0.857,0.124l0.426,0.106c2.354,0.584,3.788,2.965,3.204,5.318l-3.276,13.212l-1.482,5.967 c-1.374,5.54,4.27-1.204,5.446,1.351C51.452,60.085,46.116,63.601,42.288,66.27z M50.594,24.976 c-0.818,3.295-4.152,5.304-7.446,4.486c-3.296-0.818-5.305-4.151-4.487-7.447c0.818-3.296,4.152-5.304,7.446-4.486 C49.403,18.346,51.411,21.68,50.594,24.976z"/>
    </svg>
</a>
    <a
        href="https://github.com/alinausova/nasa-space-apps-2025-home-grown"
        target="_blank"
        rel="noopener noreferrer"
        class="w-8 h-8 flex items-center justify-center transition-opacity duration-200 hover:opacity-70 no-underline"
        title="View on GitHub"
    >
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-[#1a1a1a]">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
    </a>
   
</div>
{/if}

{#if showBackdrop}
    <div class="absolute inset-0 bg-black/50 z-[9999]">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 flex justify-center">
            <h1 class="text-7xl sm:text-8xl md:text-[12rem] lg:text-[12rem] xl:text-[12rem] font-bold text-green-400 uppercase leading-tight md:leading-[11rem] lg:leading-[11rem] xl:leading-[13rem] text-center">
                Home Grown
            </h1>
        </div>
        <div class="absolute bottom-16 sm:bottom-24 md:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center w-full opacity-80">
            <p class="text-white text-center max-w-5xl px-4 sm:px-8 mb-4 sm:mb-8 text-sm sm:text-base md:text-lg leading-relaxed ">
                In the ever growing cities of today, food security remains one of the biggest challenges that our society has to deal with. As climate change continues to impact our lives in unpredictable ways, incorporating resilience into our cities is one of the most impactful changes we can make. Thinking globally, but acting locally, use our tool to radically re-imagine your city
            </p>
            <div class="flex flex-row items-center w-full justify-center gap-4">
                <button class="btn btn-md sm:btn-lg glassmorphism-button text-white explore-button" onclick={startExploring}>Start Exploring</button>
                <a href="/nasa-space-apps-2025-home-grown/learn-more" target="_blank" rel="noopener noreferrer" class="btn btn-md sm:btn-lg glassmorphism-button text-white learn-button no-underline">Learn More</a>
            </div>
        </div>
    </div>
{/if}

<!-- Map Container -->
<div id="map" class="w-screen h-screen"></div>

<!-- Area Analysis Panel -->
{#if !showBackdrop}
    <AreaAnalysisPanel
        coordinates={polygonCoordinates}
        onClear={clearPolygon}
        onAnalyze={analyzePolygon}
        onToggleDraw={toggleDrawMode}
        isDrawing={isDrawing}
        onFlyTo={flyToCity}
    />
{/if}
