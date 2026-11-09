<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import Chip from "../../ui/Chip.svelte";
    import CropRow from "./CropRow.svelte";
    import type { CropRecommendation } from "../../api/types";
    import type { CropFilter } from "../../state/journey.svelte";
    import { FACTORS } from "../../derive/score";
    import { filterCrops } from "../../derive/crops";
    import { router } from "../../router/router.svelte";

    let { crops, filter = $bindable() }: { crops: CropRecommendation[]; filter: CropFilter } = $props();

    let t = $derived(i18n.m.results);
    let shown = $derived(filterCrops(crops, filter));
    let filters = $derived<[CropFilter, string][]>([
        ["all", t.filters.all(crops.length)],
        ["cool", t.filters.cool],
        ["warm", t.filters.warm],
        ["no-irrigation", t.filters.noIrrigation],
    ]);
</script>

<section class="flex flex-col gap-4" aria-labelledby="ranked-crops">
    <div class="flex flex-wrap gap-2" role="group" aria-label={t.filterLabel}>
        {#each filters as [id, label] (id)}
            <Chip selected={filter === id} onclick={() => (filter = id)}>{label}</Chip>
        {/each}
    </div>

    <div class="flex flex-col">
        <div class="flex justify-between gap-3 pb-2 text-[13px] text-ink-muted">
            <h2 id="ranked-crops" class="m-0 text-[13px] font-normal">{t.ranked}</h2>
            <span class="flex flex-wrap justify-end gap-2.5" aria-hidden="true">
                {#each FACTORS as f (f.key)}
                    <span class="flex items-center gap-[5px]"><span class="block size-2.5 rounded-[3px]" style:background={f.color}></span>{f.short}</span>
                {/each}
            </span>
        </div>
        {#each shown as crop (crop.crop_id)}
            <CropRow {crop} href={router.href({ name: "crop", id: crop.crop_id })} />
        {:else}
            <p class="m-0 border-t border-line py-4 text-sm text-ink-muted">{t.noMatch}</p>
        {/each}
    </div>
</section>
