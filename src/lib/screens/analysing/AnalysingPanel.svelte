<script lang="ts">
    import StepLabel from "../../ui/StepLabel.svelte";
    import Notice from "../../ui/Notice.svelte";
    import GrowingRowLoader from "./GrowingRowLoader.svelte";
    import StepList from "./StepList.svelte";
    import { ANALYSIS_STEPS, SLOW_AFTER_MS, type Timeline } from "../../derive/progress";
    import type { ClimateResponse } from "../../api/analysis";
    import EarlyClimateCard from "./EarlyClimateCard.svelte";
    import { formatArea } from "../../derive/area";
    import { formatLatLng, ringCenter } from "../../derive/geo";
    import type { Plot, RequestState } from "../../state/journey.svelte";

    let {
        plot,
        request,
        progress,
        failedAt,
        elapsedMs,
        climate,
    }: {
        plot: Plot | null;
        request: RequestState;
        progress: Timeline;
        failedAt: number | null;
        elapsedMs: number;
        climate: ClimateResponse | null;
    } = $props();

    let failed = $derived(request.status === "error");
    let errorText = $derived(
        request.status === "error" ? (/[.!?]$/.test(request.message.trim()) ? request.message.trim() : `${request.message.trim()}.`) : "",
    );
    /** Step shown as current: the running one, or the one that failed. */
    let shown = $derived(failedAt ?? progress.current);
    let steps = $derived(
        ANALYSIS_STEPS.map((step, i) => {
            if (i !== 0 || !plot) return step;
            const [lng, lat] = ringCenter(plot.ring);
            return { ...step, detail: `${formatArea(plot.areaM2)}, centred on ${formatLatLng(lat, lng)}` };
        }),
    );
    let subtitle = $derived(
        plot ? [plot.placeName, formatArea(plot.areaM2)].filter(Boolean).join(" · ") : "",
    );
</script>

<div class="flex flex-col gap-5">
    <StepLabel step={3} label="Reading your plot">
        <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[34px]">Checking a year of sun, heat and rain</h1>
        {#if subtitle}<p class="m-0 hidden text-[15px] leading-relaxed text-ink-muted md:block">{subtitle}</p>{/if}
    </StepLabel>

    {#if failed && request.status === "error"}
        <Notice title="We could not finish reading your plot">
            {errorText} Your plot is kept, so you can try again or go back and adjust it.
        </Notice>
    {:else}
        <GrowingRowLoader />
    {/if}

    <div class="flex flex-col gap-2" role="status" aria-live="polite">
        <span class="flex items-baseline justify-between gap-3 text-[13px]">
            <span class="hidden md:inline">Step {shown + 1} of {ANALYSIS_STEPS.length}</span>
            <span class="font-semibold md:hidden">{ANALYSIS_STEPS[shown].short}</span>
            <span class="font-mono">
                <span class="md:hidden">{shown + 1} of {ANALYSIS_STEPS.length}{#if !failed && progress.secondsLeft !== null}&nbsp;·&nbsp;~{progress.secondsLeft} s{/if}</span>
                {#if !failed && progress.secondsLeft !== null}<span class="hidden md:inline">about {progress.secondsLeft} s left</span>{/if}
            </span>
        </span>
        <span class="block h-1.5 rounded-[3px] bg-ink/12" aria-hidden="true">
            <span
                class="block h-full rounded-[3px] transition-[width] duration-500 ease-out {failed ? 'bg-harvest' : 'bg-bright'}"
                style:width="{progress.fraction * 100}%"
            ></span>
        </span>
        {#if !failed}
            <span class="text-xs text-ink-muted">
                {#if elapsedMs > SLOW_AFTER_MS}
                    Still working. If the server was asleep, the first analysis can take up to a minute.
                {:else}
                    Fine to leave this tab in the background.
                {/if}
            </span>
        {/if}
    </div>

    {#if climate}
        <!-- Mobile: the early climate card sits in the sheet (desktop shows it on the map). -->
        <div class="md:hidden"><EarlyClimateCard {climate} inline /></div>
    {/if}

    <div class="hidden md:block">
        <StepList steps={steps} states={progress.states} failedAt={failed ? shown : null} />
    </div>
</div>
