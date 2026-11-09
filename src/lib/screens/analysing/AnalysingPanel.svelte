<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
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

    let t = $derived(i18n.m.analysing);
    let failed = $derived(request.status === "error");
    let errorText = $derived(
        request.status === "error" ? (/[.!?]$/.test(request.message.trim()) ? request.message.trim() : `${request.message.trim()}.`) : "",
    );
    /** Step shown as current: the running one, or the one that failed. */
    let shown = $derived(failedAt ?? progress.current);
    let steps = $derived(
        ANALYSIS_STEPS.map((step, i) => {
            if (i === 2 && landsatFailed) return { ...step, detail: t.noAnswer };
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
        <StepLabel step={3} label={t.stepPaused}>
            <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[34px]">{t.landsatTitle}</h1>
            <p class="m-0 text-[15px] leading-relaxed text-ink-muted">
                {t.landsatBody}
            </p>
        </StepLabel>
        <Button size="lg" block onclick={onRetry}>{t.tryAgain}</Button>
        <button
            type="button"
            onclick={onContinue}
            class="flex flex-col gap-1 rounded-card border border-ink bg-surface px-5 py-4 text-left hover:bg-selected
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
            <span class="text-base font-semibold">{t.continueTitle}</span>
            <span class="text-sm leading-relaxed text-ink-muted">{t.continueBody}</span>
        </button>
        <p class="m-0 text-[13px] text-ink-muted" role="status">{t.clearsUp}</p>
        <div class="hidden md:block">
            <StepList steps={steps} states={progress.states} failedAt={2} />
        </div>
    </div>
{:else}
<div class="flex flex-col gap-5">
    <StepLabel step={3} label={t.step}>
        <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[34px]">{t.title}</h1>
        {#if subtitle}<p class="m-0 hidden text-[15px] leading-relaxed text-ink-muted md:block">{subtitle}</p>{/if}
    </StepLabel>

    {#if failed && request.status === "error"}
        <Notice title={t.errorTitle}>
            {errorText} {t.errorKept}
        </Notice>
    {:else}
        <GrowingRowLoader />
    {/if}

    <div class="flex flex-col gap-2" role="status" aria-live="polite">
        <span class="flex items-baseline justify-between gap-3 text-[13px]">
            <span class="hidden md:inline">{t.stepOf(shown + 1, ANALYSIS_STEPS.length)}</span>
            <span class="font-semibold md:hidden">{ANALYSIS_STEPS[shown].short}</span>
            <span class="font-mono">
                <span class="md:hidden">{t.stepOfShort(shown + 1, ANALYSIS_STEPS.length)}{#if !failed && progress.secondsLeft !== null}&nbsp;·&nbsp;{t.secondsShort(progress.secondsLeft)}{/if}</span>
                {#if !failed && progress.secondsLeft !== null}<span class="hidden md:inline">{t.secondsLeft(progress.secondsLeft)}</span>{/if}
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
                    {t.slow}
                {:else}
                    {t.background}
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
