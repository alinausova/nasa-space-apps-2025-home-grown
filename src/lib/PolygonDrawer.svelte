<script lang="ts">
    import * as turf from '@turf/turf';

    interface Props {
        coordinates: number[][][] | null;
        onClear?: () => void;
    }

    let { coordinates = null, onClear }: Props = $props();

    // Calculate area in square meters and convert to square kilometers
    let area = $derived(() => {
        if (!coordinates || coordinates.length === 0) return null;

        const polygon = turf.polygon(coordinates);
        const areaInSquareMeters = turf.area(polygon);
        const areaInSquareKm = areaInSquareMeters / 1_000_000;

        return {
            sqm: areaInSquareMeters.toFixed(2),
            sqkm: areaInSquareKm.toFixed(6)
        };
    });
</script>

<style>
    .polygon-card {
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        max-height: 500px;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #4ade80;
    }

    .card-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: #1a1a1a;
    }

    .clear-button {
        background: #ef4444;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
    }

    .clear-button:hover {
        background: #dc2626;
    }

    .coordinates-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .coordinate-item {
        background: #f3f4f6;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        color: #374151;
    }

    .point-number {
        font-weight: bold;
        color: #4ade80;
        margin-right: 8px;
    }

    .no-polygon {
        text-align: center;
        color: #9ca3af;
        padding: 20px;
        font-style: italic;
    }

    .area-display {
        background: #4ade80;
        color: #1a1a1a;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-weight: 600;
    }

    .area-label {
        font-size: 0.85rem;
        opacity: 0.8;
        margin-bottom: 4px;
    }

    .area-value {
        font-size: 1.1rem;
    }
</style>

{#if coordinates && coordinates.length > 0}
    <div class="polygon-card">
        <div class="card-header">
            <div class="card-title">Polygon Info</div>
            {#if onClear}
                <button class="clear-button" onclick={onClear}>Clear</button>
            {/if}
        </div>

        {#if area()}
            <div class="area-display">
                <div class="area-label">Total Area</div>
                <div class="area-value">{area().sqkm} km² ({area().sqm} m²)</div>
            </div>
        {/if}

        <div style="margin-bottom: 8px; font-weight: 600; color: #374151;">Coordinates</div>
        <ul class="coordinates-list">
            {#each coordinates[0] as coord, index}
                <li class="coordinate-item">
                    <span class="point-number">Point {index + 1}:</span>
                    [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                </li>
            {/each}
        </ul>
    </div>
{/if}
