<script lang="ts">
    import Collapsible from "../../ui/Collapsible.svelte";
    import ClimateChart from "./ClimateChart.svelte";
    import type { ClimateResponse, LandsatBlock } from "../../api/analysis";
    import { seasonFromServer } from "../../derive/climate";
    import { formatMm } from "../../derive/format";

    let { climate, landsat }: { climate: ClimateResponse; landsat: LandsatBlock } = $props();

    let open = $state(true);

    let c = $derived(climate.climate);
    let season = $derived(seasonFromServer(c.growing_season));
    let heat = $derived(landsat.status === "ok" ? landsat.surface_heat : null);
    let sources = $derived(["NASA POWER", heat ? "Landsat 8/9" : null, String(climate.year)].filter(Boolean).join(" · "));
    let collapsedSummary = $derived(
        `${c.sun_hours_daily.toFixed(1)} h sun a day · ${formatMm(c.annual_precipitation_mm)} rain · ${season ? `grows ${season.label}` : "no growing season"}`,
    );
    let figures = $derived([
        { label: "Sun in growing season", value: `${c.sun_hours_daily.toFixed(1)} h/day` },
        { label: "Sunshine factor", value: `${Math.round(c.sunshine_factor * 100)}%` },
        { label: "Rainfall", value: `${formatMm(c.annual_precipitation_mm)}/yr` },
        { label: "Growing season", value: season ? `${season.label} · ${season.days} d` : "None" },
    ]);
    let offset = $derived(heat ? `${heat.offset_c >= 0 ? "+" : "−"}${Math.abs(heat.offset_c).toFixed(1)} °C` : "");
</script>

<Collapsible title="Climate at this plot" subtitle={open ? sources : collapsedSummary} bind:open>
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
                    <dt class="text-xs text-ink-muted">Surface heat (Landsat, {heat.scenes} {heat.scenes === 1 ? "scene" : "scenes"})</dt>
                    <dd class="m-0 flex flex-wrap items-baseline gap-x-2">
                        <span class="font-mono text-[17px] tabular md:text-[19px]">{offset}</span>
                        <span class="text-[13px] text-ink-muted">surface vs air on the same days ({heat.mean_surface_temp_c.toFixed(1)} vs {heat.mean_air_temp_max_c.toFixed(1)} °C)</span>
                    </dd>
                </div>
            {/if}
        </dl>
        {#if climate.monthly.length > 0}
            <ClimateChart monthly={climate.monthly} {season} />
        {/if}
    </div>
</Collapsible>
