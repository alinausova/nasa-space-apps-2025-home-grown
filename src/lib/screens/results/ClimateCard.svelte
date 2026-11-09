<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import { formatNumber } from "../../i18n/format";
    import Collapsible from "../../ui/Collapsible.svelte";
    import ClimateChart from "./ClimateChart.svelte";
    import type { ClimateResponse, LandsatBlock } from "../../api/analysis";
    import { seasonFromServer } from "../../derive/climate";
    import { formatMm } from "../../derive/format";

    let { climate, landsat }: { climate: ClimateResponse; landsat: LandsatBlock } = $props();

    let open = $state(true);
    let t = $derived(i18n.m.results.climate);
    const one = (n: number) => formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    let c = $derived(climate.climate);
    let season = $derived(seasonFromServer(c.growing_season));
    let heat = $derived(landsat.status === "ok" ? landsat.surface_heat : null);
    let sources = $derived(["NASA POWER", heat ? "Landsat 8/9" : null, String(climate.year)].filter(Boolean).join(" · "));
    let collapsedSummary = $derived(
        t.collapsed(one(c.sun_hours_daily), formatMm(c.annual_precipitation_mm), season ? season.label : null),
    );
    let figures = $derived([
        { label: t.sunInSeason, value: t.perDay(one(c.sun_hours_daily)) },
        { label: t.sunshineFactor, value: `${Math.round(c.sunshine_factor * 100)}%` },
        { label: t.rainfall, value: t.perYear(formatMm(c.annual_precipitation_mm)) },
        { label: t.growingSeason, value: season ? t.seasonValue(season.label, season.days) : i18n.m.season.none },
    ]);
    let offset = $derived(heat ? `${heat.offset_c >= 0 ? "+" : "−"}${one(Math.abs(heat.offset_c))} °C` : "");
</script>

<Collapsible title={t.title} subtitle={open ? sources : collapsedSummary} bind:open>
    <div class="flex flex-col gap-3.5">
        <dl class="m-0 grid grid-cols-2 overflow-hidden rounded-[14px] border border-line-strong">
            {#each figures as figure, i (figure.label)}
                <div class="flex flex-col gap-1 px-3.5 py-3 {i % 2 === 0 ? 'border-r border-line' : ''} {i < 2 || heat ? 'border-b border-line' : ''}">
                    <dt class="text-xs text-ink-muted">{figure.label}</dt>
                    <dd class="m-0 font-mono text-[17px] tabular md:text-[19px]">{figure.value}</dd>
                </div>
            {/each}
            {#if heat}
                <div class="col-span-2 flex flex-col gap-1 px-3.5 py-3" data-testid="surface-heat">
                    <dt class="text-xs text-ink-muted">{t.surfaceHeat(heat.scenes)}</dt>
                    <dd class="m-0 flex flex-wrap items-baseline gap-x-2">
                        <span class="font-mono text-[17px] tabular md:text-[19px]">{offset}</span>
                        <span class="text-[13px] text-ink-muted">{t.surfaceVsAir(one(heat.mean_surface_temp_c), one(heat.mean_air_temp_max_c))}</span>
                    </dd>
                </div>
            {/if}
        </dl>
        {#if climate.monthly.length > 0}
            <ClimateChart monthly={climate.monthly} {season} />
        {/if}
    </div>
</Collapsible>
