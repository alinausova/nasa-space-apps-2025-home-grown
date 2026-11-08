<script lang="ts">
    import Chip from "../../ui/Chip.svelte";
    import { SAMPLE_CITIES, type SampleCity } from "../../data/cities";

    let {
        variant = "cards",
        selected = null,
        onpick,
    }: { variant?: "cards" | "chips"; selected?: string | null; onpick: (city: SampleCity) => void } = $props();
</script>

{#if variant === "cards"}
    <div class="grid grid-cols-2 gap-2">
        {#each SAMPLE_CITIES as city (city.id)}
            <button
                type="button"
                aria-pressed={selected === city.id}
                onclick={() => onpick(city)}
                class="flex min-h-14 flex-col items-start gap-0.5 rounded-[14px] border border-ink/35 px-3.5 py-2.5 text-left transition-colors
                    hover:bg-selected/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
                    {selected === city.id ? 'border-ink bg-selected' : ''}"
            >
                <span class="text-[15px] font-semibold">{city.name}</span>
                <span class="text-xs text-ink-muted">{city.climate}</span>
            </button>
        {/each}
    </div>
{:else}
    <div class="flex flex-wrap gap-1.5">
        {#each SAMPLE_CITIES as city (city.id)}
            <Chip selected={selected === city.id} onclick={() => onpick(city)}>{city.name}</Chip>
        {/each}
    </div>
{/if}
