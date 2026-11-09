<script lang="ts">
    import Chip from "../../ui/Chip.svelte";
    import CropRow from "./CropRow.svelte";
    import type { CropRecommendation } from "../../api/types";
    import type { CropFilter } from "../../state/journey.svelte";
    import { FACTORS } from "../../derive/score";
    import { filterCrops } from "../../derive/crops";
    import { router } from "../../router/router.svelte";

    let { crops, filter = $bindable() }: { crops: CropRecommendation[]; filter: CropFilter } = $props();

    let shown = $derived(filterCrops(crops, filter));
    let filters = $derived<[CropFilter, string][]>([
        ["all", `All ${crops.length}`],
        ["cool", "Cool season"],
        ["warm", "Warm season"],
        ["no-irrigation", "No irrigation"],
    ]);
</script>

<section class="flex flex-col gap-4" aria-labelledby="ranked-crops">
    <div class="flex flex-wrap gap-2" role="group" aria-label="Filter crops">
        {#each filters as [id, label] (id)}
            <Chip selected={filter === id} onclick={() => (filter = id)}>{label}</Chip>
        {/each}
    </div>

    <div class="flex flex-col">
        <div class="flex justify-between gap-3 pb-2 text-[13px] text-ink-muted">
            <h2 id="ranked-crops" class="m-0 text-[13px] font-normal">Ranked crops</h2>
            <span class="flex flex-wrap justify-end gap-2.5" aria-hidden="true">
                {#each FACTORS as f (f.key)}
                    <span class="flex items-center gap-[5px]"><span class="block size-2.5 rounded-[3px]" style:background={f.color}></span>{f.short}</span>
                {/each}
            </span>
        </div>
        {#each shown as crop (crop.crop_id)}
            <CropRow {crop} href={router.href({ name: "crop", id: crop.crop_id })} />
        {:else}
            <p class="m-0 border-t border-line py-4 text-sm text-ink-muted">No crop here matches this filter.</p>
        {/each}
    </div>
</section>
