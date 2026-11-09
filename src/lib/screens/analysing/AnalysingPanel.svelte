<script lang="ts">
    import StepLabel from "../../ui/StepLabel.svelte";
    import Button from "../../ui/Button.svelte";
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
        onRetry,
        onContinue,
    }: {
        plot: Plot | null;
        request: RequestState;
        progress: Timeline;
        failedAt: number | null;
        elapsedMs: number;
        climate: ClimateResponse | null;
        onRetry?: () => void;
        onContinue?: () => void;
    } = $props();

    let landsatFailed = $derived(request.status === "landsat-failed");

    let failed = $derived(request.status === "error");
    let errorText = $derived(
        request.status === "error" ? (/[.!?]$/.test(request.message.trim()) ? request.message.trim() : `${request.message.trim()}.`) : "",
    );
    /** Step shown as current: the running one, or the one that failed. */
    let shown = $derived(failedAt ?? progress.current);
    let steps = $derived(
        ANALYSIS_STEPS.map((step, i) => {
            if (i === 2 && landsatFailed) return { ...step, detail: "No answer in time" };
            if (i !== 0 || !plot) return step;
            const [lng, lat] = ringCenter(plot.ring);
            return { ...step, detail: `${formatArea(plot.areaM2)}, centred on ${formatLatLng(lat, lng)}` };
        }),
    );
    let subtitle = $derived(
        plot ? [plot.placeName, formatArea(plot.areaM2)].filter(Boolean).join(" · ") : "",
    );
</script>

{#if landsatFailed}
    <div class="flex flex-col gap-5" data-testid="landsat-error">
        <StepLabel step={3} label="Reading your plot · paused">
            <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[34px]">Landsat did not answer in time</h1>
            <p class="m-0 text-[15px] leading-relaxed text-ink-muted">
                Nothing is lost. Your plot, the NASA climate and the crop scores are saved, so trying again only asks Landsat again.
            </p>
        </StepLabel>
        <Button size="lg" block onclick={onRetry}>Try again</Button>
        <button
            type="button"
            onclick={onContinue}
            class="flex flex-col gap-1 rounded-card border border-ink bg-surface px-5 py-4 text-left hover:bg-selected
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
            <span class="text-base font-semibold">Continue without Landsat</span>
            <span class="text-sm leading-relaxed text-ink-muted">Your crop scores come from NASA POWER either way. You only miss the surface heat reading.</span>
        </button>
        <p class="m-0 text-[13px] text-ink-muted" role="status">This usually clears up within a minute or two.</p>
        <div class="hidden md:block">
            <StepList steps={steps} states={progress.states} failedAt={2} />
        </div>
    </div>
{:else}
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
{/if}
