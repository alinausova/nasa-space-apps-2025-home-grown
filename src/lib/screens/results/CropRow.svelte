<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import { cropName } from "../../i18n/crops";
    import FactorBar from "../../ui/FactorBar.svelte";
    import ScoreDot from "../../ui/ScoreDot.svelte";
    import ScorePill from "../../ui/ScorePill.svelte";
    import WaterPill from "../../ui/WaterPill.svelte";
    import type { CropRecommendation } from "../../api/types";
    import { irrigationMm } from "../../derive/crops";
    import { SEASON_LABEL } from "../../derive/format";

    let { crop, href }: { crop: CropRecommendation; href: string } = $props();

    let score = $derived(crop.suitability.overall_score);
    let water = $derived(irrigationMm(crop));
</script>

<a
    {href}
    class="grid grid-cols-[16px_minmax(0,1fr)_76px_40px] grid-rows-[auto_auto] items-center gap-x-3 gap-y-1 border-t border-line py-3 text-ink no-underline
        transition-colors hover:bg-selected/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    data-testid="crop-row"
>
    <span class="row-span-2 flex"><ScoreDot {score} /></span>
    <span class="col-start-2 row-start-1 text-[17px] leading-tight font-semibold tracking-[-0.01em] md:text-[19px]">{cropName(crop)}</span>
    <span class="col-start-3 row-span-2 row-start-1"><FactorBar scores={crop.suitability.scores} /></span>
    <span class="col-start-4 row-span-2 row-start-1 grid"><ScorePill {score} /></span>
    <span class="col-start-2 row-start-2 flex items-center gap-1.5 whitespace-nowrap">
        <span class="text-xs text-ink-muted">{SEASON_LABEL[crop.season] ?? crop.season}</span>
        {#if water > 0}
            <span aria-hidden="true" class="text-xs text-ink-muted">·</span>
            <WaterPill mm={water} />
        {/if}
    </span>
</a>
