<script lang="ts">
    import Icon from "../../ui/Icon.svelte";
    import type { CropRecommendation, RecommendationsResponse } from "../../api/types";
    import type { CropFilter } from "../../state/journey.svelte";
    import { filterCrops } from "../../derive/crops";
    import { neighbours } from "../../derive/why";
    import { router } from "../../router/router.svelte";

    // Back to the list plus previous / next through the ranking as last filtered.
    let { crop, results, filter }: { crop: CropRecommendation; results: RecommendationsResponse; filter: CropFilter } = $props();

    let all = $derived(results.recommendations);
    let ranking = $derived.by(() => {
        const filtered = filterCrops(all, filter);
        return filtered.some((c) => c.crop_id === crop.crop_id) ? filtered : all;
    });
    let near = $derived(neighbours(ranking, crop.crop_id));
</script>

<nav class="flex w-full items-center justify-between" aria-label="Crop navigation">
    <a href={router.href({ name: "app" })} class="inline-flex min-h-11 items-center gap-2 text-base font-medium text-ink no-underline hover:underline">
        <Icon name="back" size={18} />
        <span class="hidden md:inline">All {all.length} crops</span><span class="md:hidden">All crops</span>
    </a>
    <span class="flex gap-2">
        {#if near.previous}
            <a
                href={router.href({ name: "crop", id: near.previous.crop_id })}
                aria-label="Previous crop: {near.previous.crop_name}"
                class="flex size-12 items-center justify-center rounded-full border border-ink text-ink hover:bg-selected"
            ><Icon name="arrowUp" /></a>
        {:else}
            <span class="hidden size-12 items-center justify-center rounded-full border border-ink/30 text-ink/30 md:flex" aria-hidden="true"><Icon name="arrowUp" /></span>
        {/if}
        {#if near.next}
            <a
                href={router.href({ name: "crop", id: near.next.crop_id })}
                aria-label="Next crop: {near.next.crop_name}"
                class="flex size-12 items-center justify-center rounded-full border border-ink text-ink hover:bg-selected"
            ><Icon name="arrowDown" /></a>
        {/if}
    </span>
</nav>
