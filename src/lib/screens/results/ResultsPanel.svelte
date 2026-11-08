<script lang="ts">
    import AiSummary from "./AiSummary.svelte";
    import ClimateCard from "./ClimateCard.svelte";
    import CropList from "./CropList.svelte";
    import NothingGrows from "./NothingGrows.svelte";
    import PlantingPlanCard from "./PlantingPlanCard.svelte";
    import StepLabel from "../../ui/StepLabel.svelte";
    import type { RecommendationsResponse } from "../../api/types";
    import type { CropFilter, Plot } from "../../state/journey.svelte";
    import { formatArea } from "../../derive/area";
    import { formatLatLng } from "../../derive/geo";
    import { planFor } from "../../derive/plan";

    let {
        results,
        plot,
        filter = $bindable(),
        onNewPlot,
        onCompare,
    }: {
        results: RecommendationsResponse;
        plot: Plot;
        filter: CropFilter;
        onNewPlot: () => void;
        onCompare: () => void;
    } = $props();

    let crops = $derived(results.recommendations);
    let plan = $derived(planFor(plot.ring, plot.areaM2, crops));
    let title = $derived(plot.placeName ?? "Your plot");
    let meta = $derived(
        `${formatArea(plot.areaM2)} · ${formatLatLng(results.location.center_latitude, results.location.center_longitude)}`,
    );
</script>

{#if crops.length === 0}
    <NothingGrows {results} placeLabel={`${title} · ${formatArea(plot.areaM2)}`} {onNewPlot} {onCompare} />
{:else}
    <div class="flex flex-col gap-6">
        <StepLabel step={3} label="What grows here">
            <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[36px]">{title}</h1>
            <span class="font-mono text-xs text-ink-muted">{meta}</span>
        </StepLabel>

        {#if plan}<PlantingPlanCard {plan} totalUsable={crops.length} />{/if}

        <ClimateCard {results} />

        {#if results.llm_summary && !results.llm_err}
            <AiSummary text={results.llm_summary} />
        {/if}

        <CropList {crops} bind:filter />
    </div>
{/if}
