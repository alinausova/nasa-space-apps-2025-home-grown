<script lang="ts">
    import type { ClimateResponse } from "../../api/analysis";
    import { MONTH_SHORT } from "../../derive/climate";
    import { formatMm } from "../../derive/format";

    // Shown as soon as NASA POWER answers, while Landsat and scoring are still running.
    let { climate, inline = false }: { climate: ClimateResponse; inline?: boolean } = $props();

    let season = $derived(climate.climate.growing_season);
    let seasonLabel = $derived(
        !season ? "None" : season.all_year ? "All year" : season.start_month === season.end_month ? MONTH_SHORT[season.start_month - 1] : `${MONTH_SHORT[season.start_month - 1]}–${MONTH_SHORT[season.end_month - 1]}`,
    );
    let figures = $derived([
        { value: `${climate.climate.sun_hours_daily.toFixed(1)} h`, label: "sun a day" },
        { value: formatMm(climate.climate.annual_precipitation_mm), label: "rain a year" },
        { value: seasonLabel, label: "growing season" },
    ]);
</script>

<section
    class="flex flex-col gap-2 rounded-card border border-line-strong bg-surface p-4 md:border-ink md:px-6 md:py-5
        {inline ? '' : 'absolute bottom-6 left-6 z-10 hidden w-[min(440px,calc(100%-3rem))] md:flex'}"
    aria-label="Climate at your plot, already in"
    data-testid="early-climate"
>
    <span class="flex items-baseline justify-between gap-3 text-[13px] text-ink-muted">
        <span>Already in<span class="md:hidden">&nbsp;· climate at your plot</span></span>
        <span class="hidden font-mono text-xs md:inline">NASA POWER</span>
    </span>
    <span class="hidden text-xl md:block">Climate at your plot</span>
    <dl class="m-0 grid grid-cols-3 gap-3">
        {#each figures as figure (figure.label)}
            <div class="flex flex-col gap-0.5">
                <dt class="order-2 text-xs text-ink-muted">{figure.label}</dt>
                <dd class="order-1 m-0 font-mono text-lg tabular md:text-xl">{figure.value}</dd>
            </div>
        {/each}
    </dl>
    <span class="hidden text-[13px] text-ink-muted md:block">Crops come next.</span>
</section>
