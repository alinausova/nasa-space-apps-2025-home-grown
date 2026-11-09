<script lang="ts">
    import AiSummary from "./AiSummary.svelte";
    import ClimateCard from "./ClimateCard.svelte";
    import CropList from "./CropList.svelte";
    import NothingGrows from "./NothingGrows.svelte";
    import PlantingPlanCard from "./PlantingPlanCard.svelte";
    import StepLabel from "../../ui/StepLabel.svelte";
    import type { RecommendationsResponse } from "../../api/types";
    import type { CropFilter, Plot, SummaryState } from "../../state/journey.svelte";
    import LeafLabel from "../../ui/LeafLabel.svelte";
    import { formatArea } from "../../derive/area";
    import { formatLatLng } from "../../derive/geo";
    import { planFor } from "../../derive/plan";

    let {
        results,
        plot,
        filter = $bindable(),
        summaryStatus = "done",
        onNewPlot,
        onCompare,
    }: {
        results: RecommendationsResponse;
        plot: Plot;
        filter: CropFilter;
        summaryStatus?: SummaryState["status"];
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

        {#if summaryStatus === "loading"}
            <section class="flex flex-col gap-2" role="status" aria-live="polite" data-testid="summary-loading">
                <LeafLabel />
                <p class="m-0 text-[15px] text-ink-muted">Writing your summary…</p>
                <span class="block h-3 w-11/12 animate-pulse rounded bg-ink/8 motion-reduce:animate-none" aria-hidden="true"></span>
                <span class="block h-3 w-3/4 animate-pulse rounded bg-ink/8 motion-reduce:animate-none" aria-hidden="true"></span>
            </section>
        {:else if results.llm_summary && !results.llm_err}
            <AiSummary text={results.llm_summary} />
        {/if}

        <CropList {crops} bind:filter />
    </div>
{/if}
