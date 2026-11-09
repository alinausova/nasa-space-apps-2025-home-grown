<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { mapController } from "./controller.svelte";
    import { journey } from "../state/journey.svelte";

    let container: HTMLDivElement;
    let observer: ResizeObserver | null = null;

    onMount(() => {
        mapController.mount(container, {
            onPlotChange: (ring) => journey.setPlot(ring),
        });
        // The sidebar width changes between steps; Mapbox only notices window resizes on its own.
        observer = new ResizeObserver(() => mapController.map?.resize());
        observer.observe(container);
    });

    onDestroy(() => {
        observer?.disconnect();
        mapController.destroy();
    });

    $effect(() => {
        mapController.setTone(journey.isTooLarge ? "warn" : "ok");
    });
</script>

<!-- Mapbox forces position: relative on its container, so the wrapper does the positioning. -->
<div class="absolute inset-0" data-testid="map">
    <div bind:this={container} class="h-full w-full"></div>
</div>

{#if mapController.error}
    <div class="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-ink-muted" role="alert">
        {mapController.error}
    </div>
{/if}
