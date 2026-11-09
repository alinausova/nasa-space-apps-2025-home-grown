<script lang="ts">
    import ClimateChart from "./ClimateChart.svelte";
    import PlantingPlanCard from "./PlantingPlanCard.svelte";
    import type { RecommendationsResponse } from "../../api/types";
    import type { ClimateResponse, CropsResponse } from "../../api/analysis";
    import type { Plot } from "../../state/journey.svelte";
    import { formatArea } from "../../derive/area";
    import { formatLatLng } from "../../derive/geo";
    import { formatKg, formatMm, SEASON_LABEL } from "../../derive/format";
    import { irrigationMm } from "../../derive/crops";
    import { planFor } from "../../derive/plan";
    import { seasonFromServer } from "../../derive/climate";
    import { monthRanges } from "../../derive/calendar";
    import { paragraphs } from "../../derive/text";

    // Printed instead of the app (Export PDF or the browser's print). Not shown on screen.
    let {
        results,
        climate,
        crops,
        plot,
        summary,
        mapImage,
    }: {
        results: RecommendationsResponse;
        climate: ClimateResponse;
        crops: CropsResponse;
        plot: Plot;
        summary: string | null;
        mapImage: string | null;
    } = $props();

    let usableCrops = $derived(results.recommendations);
    let plan = $derived(planFor(plot.ring, plot.areaM2, usableCrops));
    let c = $derived(climate.climate);
    let season = $derived(seasonFromServer(c.growing_season));
    let heat = $derived(crops.landsat.status === "ok" ? crops.landsat.surface_heat : null);
    let blocks = $derived(summary ? paragraphs(summary) : []);
    let printedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    let figures = $derived([
        { label: "Sun in growing season", value: `${c.sun_hours_daily.toFixed(1)} h/day` },
        { label: "Rainfall", value: `${formatMm(c.annual_precipitation_mm)}/yr` },
        { label: "Growing season", value: season ? `${season.label} · ${season.days} d` : "None" },
        ...(heat ? [{ label: `Surface heat (Landsat, ${heat.scenes} scenes)`, value: `${heat.offset_c >= 0 ? "+" : "−"}${Math.abs(heat.offset_c).toFixed(1)} °C` }] : []),
    ]);
</script>

<article class="print-report flex flex-col gap-6 bg-white text-[11pt] text-ink" data-testid="print-report">
    <header class="flex items-end justify-between gap-6 border-b border-line-strong pb-3">
        <div class="flex flex-col gap-1">
            <span class="text-sm font-semibold">Home Grown · what grows here</span>
            <h1 class="m-0 text-[24pt] leading-tight font-normal tracking-[-0.02em]">{plot.placeName ?? "Your plot"}</h1>
            <span class="font-mono text-[9pt] text-ink-muted">
                {formatArea(plot.areaM2)} · {formatLatLng(results.location.center_latitude, results.location.center_longitude)} · NASA POWER {climate.year}
            </span>
        </div>
        <span class="text-[9pt] text-ink-muted">{printedOn}</span>
    </header>

    {#if mapImage}
        <img src={mapImage} alt="Map of your plot" class="h-[85mm] w-full rounded-card border border-line-strong bg-paper object-contain" />
    {/if}

    {#if plan}<div class="break-inside-avoid"><PlantingPlanCard {plan} totalUsable={usableCrops.length} /></div>{/if}

    {#if blocks.length > 0}
        <section class="flex break-inside-avoid flex-col gap-1.5">
            <h2 class="m-0 text-[13pt] font-medium">Summary</h2>
            {#each blocks as block, i (i)}
                <p class="m-0 leading-relaxed">{#each block as segment, j (j)}{segment.text}{/each}</p>
            {/each}
            <span class="text-[8pt] text-ink-muted">Written by Mistral AI from the analysis data.</span>
        </section>
    {/if}

    <section class="flex break-inside-avoid flex-col gap-3">
        <h2 class="m-0 text-[13pt] font-medium">Climate at this plot</h2>
        <dl class="m-0 grid grid-cols-4 gap-3">
            {#each figures as figure (figure.label)}
                <div class="flex flex-col gap-0.5">
                    <dt class="text-[8pt] text-ink-muted">{figure.label}</dt>
                    <dd class="m-0 font-mono text-[12pt]">{figure.value}</dd>
                </div>
            {/each}
        </dl>
        {#if climate.monthly.length > 0}<ClimateChart monthly={climate.monthly} {season} />{/if}
    </section>

    <section class="flex flex-col gap-2">
        <h2 class="m-0 text-[13pt] font-medium">Crops that grow here ({usableCrops.length})</h2>
        <table class="w-full border-collapse text-left text-[9pt]">
            <thead>
                <tr class="border-b border-line-strong text-ink-muted">
                    <th class="py-1.5 pr-2 font-normal">#</th>
                    <th class="py-1.5 pr-2 font-normal">Crop</th>
                    <th class="py-1.5 pr-2 font-normal">Score</th>
                    <th class="py-1.5 pr-2 font-normal whitespace-nowrap">Heat · sun · temp · water</th>
                    <th class="py-1.5 pr-2 font-normal">Watering</th>
                    <th class="py-1.5 pr-2 font-normal">Sow or plant out</th>
                    <th class="py-1.5 font-normal">Harvest</th>
                </tr>
            </thead>
            <tbody>
                {#each usableCrops as crop, i (crop.crop_id)}
                    {@const s = crop.suitability.scores}
                    {@const water = irrigationMm(crop)}
                    <tr class="break-inside-avoid border-b border-line">
                        <td class="py-1.5 pr-2 font-mono">{i + 1}</td>
                        <td class="py-1.5 pr-2"><span class="block font-semibold">{crop.crop_name}</span><span class="block text-[8pt] text-ink-muted">{SEASON_LABEL[crop.season] ?? crop.season}</span></td>
                        <td class="py-1.5 pr-2 font-mono">{Math.round(crop.suitability.overall_score)}</td>
                        <td class="py-1.5 pr-2 font-mono whitespace-nowrap">{Math.round(s.gdd)} · {Math.round(s.sunlight)} · {Math.round(s.temperature)} · {Math.round(s.water)}</td>
                        <td class="py-1.5 pr-2 whitespace-nowrap">{water > 0 ? formatMm(water) : "Rain covers it"}</td>
                        <td class="py-1.5 pr-2">{crop.calendar ? `${crop.calendar.mode === "plant_out" ? "Plant out " : crop.calendar.mode === "plant" ? "Plant " : ""}${monthRanges(crop.calendar.sow)}` : "–"}</td>
                        <td class="py-1.5">{crop.calendar ? monthRanges(crop.calendar.harvest) : "–"}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
        <p class="m-0 text-[8pt] text-ink-muted">
            Expected harvest for the top pick, {usableCrops[0]?.crop_name ?? "–"}: {usableCrops[0] ? formatKg(usableCrops[0].suitability.yield_estimate.total_yield_kg) : "–"} a season.
        </p>
    </section>

    <footer class="border-t border-line pt-2 text-[8pt] leading-relaxed text-ink-muted">
        Scores are estimates from one year of NASA POWER daily weather ({climate.year}) for open-air growing, with {Math.round((1 - c.sunshine_factor) * 100)}% shade assumed.
        Sowing months are worked out from the same year. Made with Home Grown, NASA Space Apps Challenge 2025.
    </footer>
</article>
