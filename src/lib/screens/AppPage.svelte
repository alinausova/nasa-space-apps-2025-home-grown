<script lang="ts">
    import { onMount, untrack } from "svelte";
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
    import { formatNumber } from "../i18n/format";
    import { i18n } from "../i18n/locale.svelte";
    import LanguageSwitcher from "../i18n/LanguageSwitcher.svelte";
    import { cityName, cropName } from "../i18n/crops";
    import { ANALYSIS_STEPS, failedStep, phaseTimeline } from "../derive/progress";
    import EarlyClimateCard from "./analysing/EarlyClimateCard.svelte";
    import { formatArea } from "../derive/area";
    import { journey } from "../state/journey.svelte";
    import { mapController } from "../map/controller.svelte";
    import { router } from "../router/router.svelte";
    import { lookupPlaceName } from "../geo/placeName";
    import { ringCenter, type LngLat } from "../derive/geo";
    import type { SampleCity } from "../data/cities";
    import type { PlaceSuggestion } from "../derive/search";
    import { locate, type LocateResult } from "../geo/location";

    onMount(() => {
        if (import.meta.env.DEV) {
            // Test hook for e2e (drawing a polygon without mouse gestures).
            (window as unknown as { __hg: unknown }).__hg = { journey, map: mapController, router };
        }
    });

    /** Below this zoom, buildings are too small to outline. */
    const DRAW_ZOOM = 14;

    const SHEET: Record<typeof journey.step, SheetSize> = { place: "mid", draw: "low", analysing: "mid", results: "mid" };

    let t = $derived(i18n.m.app);
    let cropId = $derived(router.route.name === "crop" ? router.route.id : null);
    let crop = $derived(cropId ? (journey.results?.recommendations.find((c) => c.crop_id === cropId) ?? null) : null);
    /** Searched place or the user's position; shown as a pin while picking a place. */
    let pin = $state<LngLat | null>(null);
    let zoomedIn = $derived(mapController.view.zoom >= DRAW_ZOOM);

    // Analysing clock: total time (for the slow-server note) and time on the current call (for progress).
    // Steps follow the real calls; on error the clock freezes so the failed step stays marked.
    let elapsedMs = $state(0);
    let stepElapsedMs = $state(0);
    let progress = $derived.by(() => {
        const request = journey.request;
        if (request.status === "loading") return phaseTimeline(request.phase, stepElapsedMs, journey.estimates);
        if (request.status === "error") return phaseTimeline(request.phase, 0, journey.estimates);
        return phaseTimeline(request.status === "landsat-failed" ? "crops" : "climate", 0, journey.estimates);
    });
    let failedAt = $derived(
        journey.request.status === "error" ? failedStep(journey.request.phase) : journey.request.status === "landsat-failed" ? 2 : null,
    );

    $effect(() => {
        const request = journey.request;
        if (request.status !== "loading") return;
        const tick = () => {
            elapsedMs = Date.now() - request.startedAt;
            stepElapsedMs = Date.now() - request.stepStartedAt;
        };
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
        journey.placeLabel = cityName(city);
        pin = null;
        mapController.flyTo(city.center, 15);
    }

    function pickPlace(place: PlaceSuggestion): void {
        journey.city = null;
        journey.placeLabel = place.label;
        pin = place.center;
        mapController.flyTo(place.center, place.zoom);
    }

    let YOUR_LOCATION = $derived(i18n.m.app.yourLocation);

    async function useMyLocation(): Promise<LocateResult["status"]> {
        const result = await locate();
        if (result.status !== "ok") return result.status;
        journey.city = null;
        journey.placeLabel = YOUR_LOCATION;
        pin = result.center;
        mapController.flyTo(result.center, 17);
        void lookupPlaceName(result.center).then((name) => {
            if (name && journey.placeLabel === YOUR_LOCATION) journey.placeLabel = name;
        });
        return "ok";
    }

    $effect(() => {
        mapController.setPin(journey.step === "place" && mapController.ready ? pin : null);
    });

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
            <Button size="lg" block onclick={beginDrawing}>{t.drawHere} <span aria-hidden="true">→</span></Button>
            <span class="hidden text-sm text-ink-muted md:block">{t.zoomTip}</span>
        </div>
    {:else if journey.step === "draw"}
        <Button size="lg" block disabled={!journey.canAnalyse} onclick={() => journey.analyse()}>
            {t.analyse} <span aria-hidden="true">→</span>
        </Button>
        <Button variant="outline" size="lg" onclick={beginDrawing}>{t.redraw}</Button>
    {:else if journey.step === "analysing"}
        {#if journey.request.status === "landsat-failed"}
            <div class="flex w-full items-center justify-between gap-4">
                <Button variant="outline" onclick={() => journey.cancel()}>{t.cancel}</Button>
                <a
                    href="https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-ink underline underline-offset-4"
                >{t.reportProblem}</a>
            </div>
        {:else if journey.request.status === "error"}
            <Button size="lg" block onclick={() => journey.analyse({ retry: true })}>{t.tryAgain}</Button>
            <Button variant="outline" size="lg" onclick={() => journey.cancel()}>{t.backToDrawing}</Button>
        {:else}
            <Button variant="outline" onclick={() => journey.cancel()}>{t.cancel}</Button>
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
            <Button variant="outline" size="sm" onclick={startNewPlot}>{t.newPlot}</Button>
        {:else}
            <div class="flex items-center gap-4">
                <LanguageSwitcher />
                <a href={router.href({ name: "learn", tab: "scoring" })} class="text-sm text-ink no-underline hover:underline">{t.howItWorks}</a>
            </div>
        {/if}
    {/snippet}

    {#if journey.step === "place"}
        <PlacePanel
            selected={journey.city}
            onpick={pickCity}
            onplace={pickPlace}
            onlocate={useMyLocation}
            proximity={() => [mapController.view.lng, mapController.view.lat]}
        />
    {:else if journey.step === "draw"}
        <DrawPanel plot={journey.plot} tooLarge={journey.isTooLarge} selectedCity={journey.city} onpick={pickCity} onBack={backToPlace} />
    {:else if journey.step === "analysing"}
        <AnalysingPanel
            plot={journey.plot}
            request={journey.request}
            {progress}
            {failedAt}
            {elapsedMs}
            climate={journey.climate}
            onRetry={() => journey.analyse({ retry: true })}
            onContinue={() => journey.continueWithoutLandsat()}
        />
    {:else if crop && journey.results && journey.plot}
        <CropDetail
            {crop}
            results={journey.results}
            plot={journey.plot}
            filter={journey.filter}
            tips={journey.tips[crop.crop_id]}
            onAskTips={() => journey.loadTips(crop.crop_id)}
        />
    {:else if journey.results && journey.climate && journey.crops && journey.plot}
        <ResultsPanel
            results={journey.results}
            climate={journey.climate}
            crops={journey.crops}
            plot={journey.plot}
            bind:filter={journey.filter}
            summaryStatus={journey.summary.status}
            onNewPlot={startNewPlot}
            onCompare={() => journey.goToPlace()}
        />
    {/if}



    {#snippet mapOverlay()}
        {#if journey.step === "place"}
            <MapBack label={t.back.start} href={router.href({ name: "landing" })} />
            <MapChip>
                {#if journey.placeLabel}{zoomedIn ? t.chip.readyAt(journey.placeLabel) : t.chip.zoomAt(journey.placeLabel)}{:else}{zoomedIn ? t.chip.ready : t.chip.zoom}{/if}
            </MapChip>
            <MapTools>
                <ToolButton label={t.tools.zoomIn} onclick={() => mapController.zoomBy(1)}><Icon name="plus" /></ToolButton>
                <ToolButton label={t.tools.zoomOut} onclick={() => mapController.zoomBy(-1)}><Icon name="minus" /></ToolButton>
                <ToolButton label={t.tools.draw} active onclick={beginDrawing}><Icon name="polygon" /></ToolButton>
            </MapTools>
            <MapCoords showZoom />
        {:else if journey.step === "draw"}
            <MapBack label={t.back.place} onclick={backToPlace} />
            <MapChip live>
                {#if mapController.isDrawing}
                    <span class="hidden md:inline">{t.chip.drawingDesktop}</span>
                    <span class="md:hidden">{t.chip.drawingMobile}</span>
                {:else if journey.isTooLarge}
                    {t.chip.tooLarge}
                {:else if journey.plot}
                    {t.chip.adjust}
                {:else}
                    {t.chip.start}
                {/if}
            </MapChip>
            <MapTools>
                <ToolButton label={t.tools.newShape} active={mapController.isDrawing} onclick={beginDrawing}><Icon name="polygon" /></ToolButton>
                <ToolButton label={t.tools.undo} disabled={!journey.canUndo && !mapController.isDrawing} onclick={undo}><Icon name="undo" /></ToolButton>
                <ToolButton label={t.tools.deletePlot} disabled={!journey.plot && !mapController.isDrawing} onclick={deletePlot}><Icon name="trash" /></ToolButton>
            </MapTools>
            <MapCoords />
        {:else if journey.step === "analysing" && journey.plot}
            <MapBack label={t.back.cancel} onclick={() => journey.cancel()} />
            <ScanOverlay ring={journey.plot.ring} active={journey.request.status === "loading"} />
            {#if journey.climate}<EarlyClimateCard climate={journey.climate} />{/if}
            <MapChip only="desktop" live>
                {#if journey.request.status === "landsat-failed"}<span class="size-2 rounded-full bg-harvest" aria-hidden="true"></span>{t.chip.landsatFailed}{:else if failedAt !== null}{t.chip.stoppedAt(ANALYSIS_STEPS[failedAt].short)}{:else}<span class="size-2 rounded-full bg-bright" aria-hidden="true"></span>{ANALYSIS_STEPS[progress.current].short}{/if}
            </MapChip>
            <MapChip only="mobile" tone="bright">{formatArea(journey.plot.areaM2)}</MapChip>
        {:else if crop && journey.plot}
            <MapBack label={t.back.allCrops} href={router.href({ name: "app" })} />
            <div class="absolute right-5 bottom-14 z-10 hidden rounded-[14px] border border-ink bg-surface px-[18px] py-3 text-[17px] md:block">
                {t.cropOnPlot(cropName(crop), formatNumber(Math.round(journey.plot.areaM2 * 0.7)))}
            </div>
        {:else if journey.step === "results" && journey.plot}
            <MapBack label={t.back.plot} onclick={() => journey.editPlot()} />
            <MapChip only="mobile" tone="bright">{formatArea(journey.plot.areaM2)}</MapChip>
            {@const top = journey.results?.recommendations[0]}
            {#if top}
                <div class="absolute right-5 bottom-14 z-10 hidden flex-col gap-0.5 rounded-[14px] border border-ink bg-surface px-[18px] py-3.5 md:flex">
                    <span class="text-xs text-ink-muted">{t.topPick}</span>
                    <span class="text-xl">{cropName(top)} · <span class="font-mono">{formatKg(top.suitability.yield_estimate.total_yield_kg)}</span> {t.aSeason}</span>
                </div>
            {/if}
        {/if}
    {/snippet}
</AppShell>
