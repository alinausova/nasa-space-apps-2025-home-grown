<script lang="ts">
    import { untrack } from "svelte";
    import AppShell, { type SheetSize } from "../layout/AppShell.svelte";
    import Button from "../ui/Button.svelte";
    import Icon from "../ui/Icon.svelte";
    import MapBack from "../map/overlays/MapBack.svelte";
    import MapChip from "../map/overlays/MapChip.svelte";
    import MapCoords from "../map/overlays/MapCoords.svelte";
    import MapTools from "../map/overlays/MapTools.svelte";
    import ToolButton from "../map/overlays/ToolButton.svelte";
    import PlacePanel from "./place/PlacePanel.svelte";
    import DrawPanel from "./draw/DrawPanel.svelte";
    import AnalysingPanel from "./analysing/AnalysingPanel.svelte";
    import ScanOverlay from "../map/overlays/ScanOverlay.svelte";
    import ResultsPanel from "./results/ResultsPanel.svelte";
    import CropDetail from "./crop/CropDetail.svelte";
    import CropNav from "./crop/CropNav.svelte";
    import { formatKg } from "../derive/format";
    import { ANALYSIS_STEPS, failedStep, timeline } from "../derive/progress";
    import { formatArea } from "../derive/area";
    import { journey } from "../state/journey.svelte";
    import { mapController } from "../map/controller.svelte";
    import { router } from "../router/router.svelte";
    import { lookupPlaceName } from "../geo/placeName";
    import { ringCenter, type LngLat } from "../derive/geo";
    import { SAMPLE_CITIES, type SampleCity } from "../data/cities";

    /** Below this zoom, buildings are too small to outline. */
    const DRAW_ZOOM = 14;

    const SHEET: Record<typeof journey.step, SheetSize> = { place: "mid", draw: "low", analysing: "mid", results: "mid" };

    let cropId = $derived(router.route.name === "crop" ? router.route.id : null);
    let crop = $derived(cropId ? (journey.results?.recommendations.find((c) => c.crop_id === cropId) ?? null) : null);
    let cityName = $derived(SAMPLE_CITIES.find((c) => c.id === journey.city)?.name ?? null);
    let zoomedIn = $derived(mapController.view.zoom >= DRAW_ZOOM);

    // Analysing clock: ticks while the request runs, freezes on error so the failed step stays marked.
    let elapsedMs = $state(0);
    let progress = $derived(timeline(elapsedMs));

    $effect(() => {
        const request = journey.request;
        if (request.status !== "loading") return;
        const tick = () => (elapsedMs = Date.now() - request.startedAt);
        tick();
        const timer = setInterval(tick, 250);
        return () => clearInterval(timer);
    });

    /** Zooms to the plot, keeping it clear of the mobile sheet. */
    function fitPlot(ring: LngLat[]): void {
        const mobile = window.matchMedia("(max-width: 767px)").matches;
        const sheet = mobile ? window.innerHeight * 0.62 : 0;
        mapController.fitTo(ring, mobile ? { top: 90, right: 40, bottom: sheet + 30, left: 40 } : 120);
    }

    function pickCity(city: SampleCity): void {
        journey.city = city.id;
        mapController.flyTo(city.center, 15);
    }

    /** Starts a new outline. An existing plot is cleared first, so undo can bring it back. */
    function beginDrawing(): void {
        if (journey.plot) journey.setPlot(null);
        journey.startDrawing();
        if (mapController.view.zoom < DRAW_ZOOM) {
            const { lng, lat } = mapController.view;
            mapController.flyTo([lng, lat], 16);
        }
        mapController.startDrawing();
    }

    function undo(): void {
        if (mapController.isDrawing) {
            // Abandon the outline in progress and show the last finished plot again.
            mapController.edit(journey.plot?.ring ?? null);
            return;
        }
        mapController.edit(journey.undo());
    }

    function startNewPlot(): void {
        journey.newPlot();
        beginDrawing();
    }

    function deletePlot(): void {
        journey.setPlot(null);
        mapController.clear();
    }

    function backToPlace(): void {
        mapController.stopDrawing();
        journey.goToPlace();
    }

    $effect(() => {
        // Deep links to a crop need results in memory (and a crop that is in them); otherwise start over.
        if (cropId && (!journey.results || !crop)) router.navigate({ name: "app" }, { replace: true });
    });

    $effect(() => {
        // Read-only plot while analysing and on results; back in the editor when drawing again.
        const step = journey.step;
        const ring = untrack(() => journey.plot?.ring ?? null);
        if (step === "analysing" || step === "results") {
            mapController.showStatic(ring);
            if (ring) fitPlot(ring);
        } else if (untrack(() => mapController.isStatic)) {
            // With a plot, put it back in the editor; without one ("New plot"), leave a fresh drawing running.
            if (ring) mapController.edit(ring);
            else mapController.showStatic(null);
        }
    });

    $effect(() => {
        // Name the plot ("Maxvorstadt, Munich") once its shape settles.
        const ring = journey.plot?.ring;
        if (!ring || journey.step !== "draw") return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            const name = await lookupPlaceName(ringCenter(ring), { signal: controller.signal });
            if (!controller.signal.aborted) journey.setPlaceName(name);
        }, 600);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    });
</script>

{#snippet stepFooter()}
    {#if journey.step === "place"}
        <div class="flex w-full flex-col items-center gap-3">
            <Button size="lg" block onclick={beginDrawing}>Draw your plot here <span aria-hidden="true">→</span></Button>
            <span class="hidden text-sm text-ink-muted md:block">Tip: zoom in until you can see buildings.</span>
        </div>
    {:else if journey.step === "draw"}
        <Button size="lg" block disabled={!journey.canAnalyse} onclick={() => journey.analyse()}>
            Analyse this plot <span aria-hidden="true">→</span>
        </Button>
        <Button variant="outline" size="lg" onclick={beginDrawing}>Redraw</Button>
    {:else if journey.step === "analysing"}
        {#if journey.request.status === "error"}
            <Button size="lg" block onclick={() => journey.analyse()}>Try again</Button>
            <Button variant="outline" size="lg" onclick={() => journey.cancel()}>Back to drawing</Button>
        {:else}
            <Button variant="outline" onclick={() => journey.cancel()}>Cancel</Button>
        {/if}
    {/if}
{/snippet}

{#snippet cropHeader()}
    {#if crop && journey.results}<CropNav {crop} results={journey.results} filter={journey.filter} />{/if}
{/snippet}

<AppShell
    wide={journey.step === "results" || cropId !== null}
    sheet={crop ? "high" : SHEET[journey.step]}
    footer={journey.step === "results" ? undefined : stepFooter}
    header={crop ? cropHeader : undefined}
    scrollKey={cropId ?? journey.step}
>
    {#snippet headerAction()}
        {#if journey.step === "results"}
            <Button variant="outline" size="sm" onclick={startNewPlot}>New plot</Button>
        {:else}
            <a href={router.href({ name: "learn", tab: "scoring" })} class="text-sm text-ink no-underline hover:underline">How it works</a>
        {/if}
    {/snippet}

    {#if journey.step === "place"}
        <PlacePanel selected={journey.city} onpick={pickCity} />
    {:else if journey.step === "draw"}
        <DrawPanel plot={journey.plot} tooLarge={journey.isTooLarge} selectedCity={journey.city} onpick={pickCity} />
    {:else if journey.step === "analysing"}
        <AnalysingPanel plot={journey.plot} request={journey.request} {progress} {elapsedMs} />
    {:else if crop && journey.results && journey.plot}
        <CropDetail {crop} results={journey.results} plot={journey.plot} filter={journey.filter} />
    {:else if journey.results && journey.plot}
        <ResultsPanel
            results={journey.results}
            plot={journey.plot}
            bind:filter={journey.filter}
            onNewPlot={startNewPlot}
            onCompare={() => journey.goToPlace()}
        />
    {/if}



    {#snippet mapOverlay()}
        {#if journey.step === "place"}
            <MapBack label="Back to start" href={router.href({ name: "landing" })} />
            <MapChip>
                {#if cityName}{cityName} · {zoomedIn ? "ready to draw" : "zoom in to draw"}{:else}{zoomedIn ? "Ready to draw" : "Zoom in to draw"}{/if}
            </MapChip>
            <MapTools>
                <ToolButton label="Zoom in" onclick={() => mapController.zoomBy(1)}><Icon name="plus" /></ToolButton>
                <ToolButton label="Zoom out" onclick={() => mapController.zoomBy(-1)}><Icon name="minus" /></ToolButton>
                <ToolButton label="Draw your plot" active onclick={beginDrawing}><Icon name="polygon" /></ToolButton>
            </MapTools>
            <MapCoords showZoom />
        {:else if journey.step === "draw"}
            <MapBack label="Back to pick a place" onclick={backToPlace} />
            <MapChip live>
                {#if mapController.isDrawing}
                    <span class="hidden md:inline">Click each corner · double-click to finish</span>
                    <span class="md:hidden">Tap the first corner to finish</span>
                {:else if journey.isTooLarge}
                    Too large · drag a corner inwards
                {:else if journey.plot}
                    Drag a corner to adjust
                {:else}
                    Press the shape button to start
                {/if}
            </MapChip>
            <MapTools>
                <ToolButton label="Draw a new shape" active={mapController.isDrawing} onclick={beginDrawing}><Icon name="polygon" /></ToolButton>
                <ToolButton label="Undo" disabled={!journey.canUndo && !mapController.isDrawing} onclick={undo}><Icon name="undo" /></ToolButton>
                <ToolButton label="Delete plot" disabled={!journey.plot && !mapController.isDrawing} onclick={deletePlot}><Icon name="trash" /></ToolButton>
            </MapTools>
            <MapCoords />
        {:else if journey.step === "analysing" && journey.plot}
            <MapBack label="Cancel and go back to drawing" onclick={() => journey.cancel()} />
            <ScanOverlay ring={journey.plot.ring} active={journey.request.status === "loading"} />
            <MapChip only="desktop" live>
                {#if journey.request.status === "error"}Stopped at: {ANALYSIS_STEPS[failedStep(progress.current)].short.toLowerCase()}{:else}<span class="size-2 rounded-full bg-bright" aria-hidden="true"></span>{ANALYSIS_STEPS[progress.current].short}{/if}
            </MapChip>
            <MapChip only="mobile" tone="bright">{formatArea(journey.plot.areaM2)}</MapChip>
        {:else if crop && journey.plot}
            <MapBack label="Back to all crops" href={router.href({ name: "app" })} />
            <div class="absolute right-5 bottom-14 z-10 hidden rounded-[14px] border border-ink bg-surface px-[18px] py-3 text-[17px] md:block">
                {crop.crop_name} on {Math.round(journey.plot.areaM2 * 0.7).toLocaleString("en-US")} m² of your plot
            </div>
        {:else if journey.step === "results" && journey.plot}
            <MapBack label="Back to your plot" onclick={() => journey.editPlot()} />
            <MapChip only="mobile" tone="bright">{formatArea(journey.plot.areaM2)}</MapChip>
            {@const top = journey.results?.recommendations[0]}
            {#if top}
                <div class="absolute right-5 bottom-14 z-10 hidden flex-col gap-0.5 rounded-[14px] border border-ink bg-surface px-[18px] py-3.5 md:flex">
                    <span class="text-xs text-ink-muted">Top pick</span>
                    <span class="text-xl">{top.crop_name} · <span class="font-mono">{formatKg(top.suitability.yield_estimate.total_yield_kg)}</span> a season</span>
                </div>
            {/if}
        {/if}
    {/snippet}
</AppShell>
