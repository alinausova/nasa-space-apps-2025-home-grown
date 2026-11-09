<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import type { ClimateResponse } from "../../api/analysis";
    import { formatNumber, monthShort } from "../../i18n/format";
    import { formatMm } from "../../derive/format";

    // Shown as soon as NASA POWER answers, while Landsat and scoring are still running.
    let { climate, inline = false }: { climate: ClimateResponse; inline?: boolean } = $props();

    let t = $derived(i18n.m.analysing.early);
    let season = $derived(climate.climate.growing_season);
    let seasonLabel = $derived(
        !season ? i18n.m.season.none : season.all_year ? i18n.m.season.allYear : season.start_month === season.end_month ? monthShort(season.start_month - 1) : `${monthShort(season.start_month - 1)}–${monthShort(season.end_month - 1)}`,
    );
    let figures = $derived([
        { value: `${formatNumber(climate.climate.sun_hours_daily, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`, label: t.sunADay },
        { value: formatMm(climate.climate.annual_precipitation_mm), label: t.rainAYear },
        { value: seasonLabel, label: t.growingSeason },
    ]);
</script>

<section
    class="flex flex-col gap-2 rounded-card border border-line-strong bg-surface p-4 md:border-ink md:px-6 md:py-5
        {inline ? '' : 'absolute bottom-6 left-6 z-10 hidden w-[min(440px,calc(100%-3rem))] md:flex'}"
    aria-label={t.label}
    data-testid="early-climate"
>
    <span class="flex items-baseline justify-between gap-3 text-[13px] text-ink-muted">
        <span>{t.alreadyIn}<span class="md:hidden">&nbsp;{t.climateAtPlotShort.trim()}</span></span>
        <span class="hidden font-mono text-xs md:inline">NASA POWER</span>
    </span>
    <span class="hidden text-xl md:block">{t.climateAtPlot}</span>
    <dl class="m-0 grid grid-cols-3 gap-3">
        {#each figures as figure (figure.label)}
            <div class="flex flex-col gap-0.5">
                <dt class="order-2 text-xs text-ink-muted">{figure.label}</dt>
                <dd class="order-1 m-0 font-mono text-lg tabular md:text-xl">{figure.value}</dd>
            </div>
        {/each}
    </dl>
    <span class="hidden text-[13px] text-ink-muted md:block">{t.next}</span>
</section>
