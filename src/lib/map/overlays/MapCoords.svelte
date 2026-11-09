<script lang="ts">
    import { mapController } from "../controller.svelte";
    import { formatLatLng } from "../../derive/geo";

    let { showZoom = false }: { showZoom?: boolean } = $props();

    let view = $derived(mapController.view);
</script>

{#if mapController.ready}
    <span class="pointer-events-none absolute bottom-4 left-5 z-10 hidden font-mono text-xs text-ink-muted tabular md:block" aria-hidden="true">
        {formatLatLng(view.lat, view.lng)}{#if showZoom}&nbsp;·&nbsp;zoom {Math.round(view.zoom)}{/if}
    </span>
{/if}
