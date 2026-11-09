<script lang="ts">
    import type { Snippet } from "svelte";

    // The tick column and mono label at the top of each sidebar step ("02 / Draw your plot").
    let {
        step,
        total = 3,
        label,
        children,
    }: { step: number; total?: number; label: string; children?: Snippet } = $props();

    let number = $derived(String(step).padStart(2, "0"));
</script>

<div class="flex gap-[22px]">
    <span class="flex flex-col gap-1.5 pt-1.5" aria-hidden="true">
        {#each Array.from({ length: total }, (_, i) => i + 1) as tick (tick)}
            <span class="w-0.5 {tick === step ? 'h-[22px] bg-ink' : 'h-3 bg-ink/30'}"></span>
        {/each}
    </span>
    <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <span class="font-mono text-xs text-ink-muted">{number} / {label}</span>
        {#if children}{@render children()}{/if}
    </div>
</div>
