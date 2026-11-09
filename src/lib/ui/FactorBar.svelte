<script lang="ts">
    import { factorSegments, type FactorScores } from "../derive/score";

    let { scores, width = 76 }: { scores: FactorScores; width?: number } = $props();

    let segments = $derived(factorSegments(scores));
    let label = $derived(segments.map((s) => `${s.label} ${Math.round(s.score)}`).join(", "));
</script>

<span
    role="img"
    aria-label={label}
    class="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px] bg-ink/10"
    style:width="{width}px"
>
    {#each segments as segment (segment.key)}
        <span class="block h-full" style:width="{segment.widthPct}%" style:background={segment.color}></span>
    {/each}
</span>
