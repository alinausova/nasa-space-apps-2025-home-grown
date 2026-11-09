<script lang="ts">
    import Icon from "../../ui/Icon.svelte";
    import CropNav from "./CropNav.svelte";
    import GrowCalendar from "./GrowCalendar.svelte";
    import CropTips from "./CropTips.svelte";
    import ScoreRing from "../../ui/ScoreRing.svelte";
    import Tag from "../../ui/Tag.svelte";
    import type { CropRecommendation, RecommendationsResponse } from "../../api/types";
    import type { CropFilter, Plot, TipsState } from "../../state/journey.svelte";
    import { FACTORS, FIT_LABEL, categoryOf } from "../../derive/score";
    import { FROST_LABEL, SEASON_LABEL, formatKg } from "../../derive/format";
    import { PLANTED_SHARE } from "../../derive/plan";
    import { filterCrops } from "../../derive/crops";
    import { alsoGood, factorReasons } from "../../derive/why";
    import { router } from "../../router/router.svelte";

    let {
        crop,
        results,
        plot,
        filter,
        tips,
        onAskTips,
    }: {
        crop: CropRecommendation;
        results: RecommendationsResponse;
        plot: Plot;
        filter: CropFilter;
        tips?: TipsState;
        onAskTips?: () => void;
    } = $props();

    let all = $derived(results.recommendations);
    let rank = $derived(all.findIndex((c) => c.crop_id === crop.crop_id) + 1);
    // Step through the list as the user last saw it; fall back to everything if this crop is filtered out.
    let ranking = $derived.by(() => {
        const filtered = filterCrops(all, filter);
        return filtered.some((c) => c.crop_id === crop.crop_id) ? filtered : all;
    });
    let suggestions = $derived(alsoGood(ranking, crop.crop_id));
    let score = $derived(Math.round(crop.suitability.overall_score));
    let reasons = $derived(factorReasons(crop, results.climate_summary));
    let yieldEstimate = $derived(crop.suitability.yield_estimate);
    let plantedM2 = $derived(plot.areaM2 * PLANTED_SHARE);
    let pad = (value: number) => String(value).padStart(2, "0");
</script>

<article class="flex flex-col gap-6" aria-labelledby="crop-name">
    <div class="md:hidden"><CropNav {crop} {results} {filter} /></div>

    <header class="flex items-center gap-5 md:gap-7">
        <span class="flex size-[84px] shrink-0 items-center justify-center rounded-full bg-bright text-on-bright md:size-[116px]" aria-hidden="true">
            <Icon name="sprout" size={40} />
        </span>
        <span class="flex min-w-0 flex-col gap-1">
            <span class="font-mono text-[13px] text-ink-muted">Rank {pad(rank)} of {all.length}</span>
            <h1 id="crop-name" class="m-0 text-[44px] leading-none font-normal tracking-[-0.02em] md:text-[56px]">{crop.crop_name}</h1>
            <span class="text-[17px] text-ink-muted md:text-lg">Score {score} · {FIT_LABEL[categoryOf(crop.suitability.overall_score)]}</span>
        </span>
    </header>

    <div class="flex flex-wrap gap-2">
        <Tag>{SEASON_LABEL[crop.season] ?? crop.season}</Tag>
        {#if FROST_LABEL[crop.frost_tolerance]}<Tag>{FROST_LABEL[crop.frost_tolerance]}</Tag>{/if}
    </div>

    <section class="flex flex-col gap-2 rounded-panel border border-line-strong px-7 py-6" aria-label="Expected harvest">
        <span class="text-[15px] text-ink-muted">Expected harvest per season</span>
        <span class="font-mono text-[40px] leading-none tracking-[-0.02em] tabular md:text-[44px]">{formatKg(yieldEstimate.total_yield_kg)}</span>
        <span class="font-mono text-[13px] text-ink-muted">
            {yieldEstimate.yield_per_m2_kg.toFixed(1)} kg/m² · {Math.round(plantedM2).toLocaleString("en-US")} m² planted
        </span>
    </section>

    <section class="flex flex-col gap-3.5" aria-labelledby="why-score">
        <h2 id="why-score" class="m-0 text-[19px] font-medium md:text-[22px]">Why it scores {score}</h2>
        <div class="grid grid-cols-4 gap-2.5">
            {#each FACTORS as factor (factor.key)}
                <span class="flex flex-col items-center gap-2 text-center">
                    <ScoreRing value={crop.suitability.scores[factor.key]} color={factor.color} label={factor.label} />
                    <span class="inline-flex items-center gap-1.5 text-[13px] font-medium md:text-[15px]">
                        <span class="size-[9px] rounded-[3px]" style:background={factor.color} aria-hidden="true"></span>
                        <span class="md:hidden">{factor.short}</span><span class="hidden md:inline">{factor.label}</span>
                    </span>
                    <span class="hidden text-[13px] leading-snug text-ink-muted md:block">{reasons[factor.key]}</span>
                </span>
            {/each}
        </div>
        <ul class="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-ink-muted md:hidden">
            {#each FACTORS as factor (factor.key)}
                <li><span class="font-medium text-ink">{factor.short}:</span> {reasons[factor.key]}</li>
            {/each}
        </ul>
    </section>

    {#if crop.calendar !== undefined}<GrowCalendar calendar={crop.calendar} cropName={crop.crop_name} year={results.year} />{/if}

    {#if onAskTips}<CropTips cropName={crop.crop_name} {tips} onask={onAskTips} />{/if}

    {#if suggestions.length > 0}
        <section class="flex flex-col gap-3 border-t border-line pt-6" aria-labelledby="also-good">
            <h2 id="also-good" class="m-0 text-[19px] font-medium md:text-[22px]">Also good here</h2>
            <div class="flex flex-wrap gap-2.5">
                {#each suggestions as other (other.crop_id)}
                    <a
                        href={router.href({ name: "crop", id: other.crop_id })}
                        class="inline-flex min-h-12 items-center rounded-full border border-ink px-5 text-[17px] text-ink no-underline hover:bg-selected"
                    >
                        {other.crop_name} {Math.round(other.suitability.overall_score)}
                    </a>
                {/each}
            </div>
        </section>
    {/if}
</article>
