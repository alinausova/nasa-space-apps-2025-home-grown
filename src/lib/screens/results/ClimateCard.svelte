<script lang="ts">
    import Collapsible from "../../ui/Collapsible.svelte";
    import ClimateChart from "./ClimateChart.svelte";
    import type { RecommendationsResponse } from "../../api/types";
    import { growingSeason } from "../../derive/climate";
    import { formatMm } from "../../derive/format";

    let { results }: { results: RecommendationsResponse } = $props();

    let open = $state(true);

    let monthly = $derived(results.monthly_temperature_averages?.monthly_averages ?? []);
    let season = $derived(growingSeason(monthly));
    let sun = $derived(results.climate_summary.representative_sun_hours_daily);
    let rain = $derived(results.climate_summary.annual_precipitation_mm);
    let sources = $derived(
        ["NASA POWER", results.data_sources?.landsat_surface_temp ? "Landsat" : null, String(results.year)].filter(Boolean).join(" · "),
    );
    let collapsedSummary = $derived(
        `${sun.toFixed(1)} h sun a day · ${formatMm(rain)} rain · ${season ? `grows ${season.label}` : "no growing season"}`,
    );

    let figures = $derived([
        { label: "Sun in growing season", value: `${sun.toFixed(1)} h/day` },
        { label: "Sunshine factor", value: `${Math.round(results.sunshine_factor * 100)}%` },
        { label: "Rainfall", value: `${formatMm(rain)}/yr` },
        { label: "Growing season", value: season ? `${season.label} · ${season.days} d` : "None" },
    ]);
</script>

<Collapsible title="Climate at this plot" subtitle={open ? sources : collapsedSummary} bind:open>
    <div class="flex flex-col gap-3.5">
        <dl class="m-0 grid grid-cols-2 overflow-hidden rounded-[14px] border border-line-strong">
            {#each figures as figure, i (figure.label)}
                <div class="flex flex-col gap-1 px-3.5 py-3 {i % 2 === 0 ? 'border-r border-line' : ''} {i < 2 ? 'border-b border-line' : ''}">
                    <dt class="text-xs text-ink-muted">{figure.label}</dt>
                    <dd class="m-0 font-mono text-[17px] tabular md:text-[19px]">{figure.value}</dd>
                </div>
            {/each}
        </dl>
        {#if monthly.length > 0}
            <ClimateChart {monthly} {season} />
        {/if}
    </div>
</Collapsible>
