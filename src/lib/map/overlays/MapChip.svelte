<script lang="ts">
    import type { Snippet } from "svelte";

    // Pill on the map for hints and labels. Top centre on desktop; top right on mobile (back button is top left).
    let { live = false, children }: { live?: boolean; children: Snippet } = $props();
</script>

<div class="pointer-events-none absolute top-4 right-4 left-20 z-10 flex justify-end md:inset-x-0 md:top-5 md:justify-center md:px-24">
    <span
        class="pointer-events-auto inline-flex min-h-10 items-center rounded-full border border-ink bg-surface px-[18px] py-2 text-center text-sm leading-tight text-ink md:text-[15px]"
        role={live ? "status" : undefined}
        aria-live={live ? "polite" : undefined}
    >
        {@render children()}
    </span>
</div>
