<script lang="ts">
    import {onDestroy, onMount} from "svelte";
    import mapboxgl from "mapbox-gl";

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    let showBackdrop = true;
    let map: mapboxgl.Map | null = null;

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
        // Set to a default location - you can customize this later
        map?.flyTo({
            center: [0, 20],
            zoom: 2,
            essential: true
        });
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
</style>

{#if showBackdrop}
    <div class="overlay-backdrop column">
        <h1 class="overlay-title">
            Home Grown
        </h1>
        <button on:click={startExploring}>Start Exploring</button>
    </div>
{/if}

<!-- Map Container -->
<div id="map"></div>
