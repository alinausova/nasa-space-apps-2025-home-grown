<script lang="ts">
    import { mapController } from "../controller.svelte";
    import type { LngLat } from "../../derive/geo";

    // Analysing: the plot fills with a grid of "satellite squares" and a band sweeps over it.
    let { ring, active = true }: { ring: LngLat[]; active?: boolean } = $props();

    const id = $props.id();

    let points = $derived.by(() => {
        // Re-project whenever the map moves.
        void mapController.view;
        return ring.map((p) => mapController.project(p)).filter((p): p is { x: number; y: number } => p !== null);
    });
    let box = $derived.by(() => {
        if (points.length === 0) return null;
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    });
    let polygon = $derived(points.map((p) => `${p.x},${p.y}`).join(" "));
    let cell = $derived(box ? Math.max(8, Math.min(22, Math.min(box.w, box.h) / 7)) : 16);
</script>

{#if box && points.length >= 3}
    <svg class="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden="true" data-testid="scan-overlay">
        <defs>
            <clipPath id="{id}-clip"><polygon points={polygon} /></clipPath>
            <pattern id="{id}-grid" x={box.x} y={box.y} width={cell} height={cell} patternUnits="userSpaceOnUse">
                <rect x="1.5" y="1.5" width={cell - 3} height={cell - 3} rx={cell / 5} fill="#B2F0BE" />
            </pattern>
        </defs>
        <g clip-path="url(#{id}-clip)">
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#F2FEF0" />
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="url(#{id}-grid)" />
            {#if active}
                <rect
                    class="scan-band"
                    x={box.x}
                    y={box.y}
                    width={box.w}
                    height={Math.max(cell * 2, box.h / 6)}
                    fill="#22C55E"
                    fill-opacity="0.35"
                    style:--travel="{box.h}px"
                />
            {/if}
        </g>
        <polygon points={polygon} fill="none" stroke="#1B6A24" stroke-width="3" stroke-linejoin="round" />
    </svg>
{/if}

<style>
    .scan-band {
        animation: scan 2.6s ease-in-out infinite alternate;
    }

    @keyframes scan {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(calc(var(--travel) * 0.83));
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .scan-band {
            animation: none;
            transform: translateY(calc(var(--travel) * 0.4));
        }
    }
</style>
