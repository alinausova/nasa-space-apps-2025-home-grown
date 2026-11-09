<script lang="ts">
    import type { Snippet } from "svelte";

    // Pill on the map for hints and labels. Top centre on desktop; top right on mobile (back button is top left).
    let {
        live = false,
        tone = "plain",
        only,
        children,
    }: { live?: boolean; tone?: "plain" | "bright"; only?: "mobile" | "desktop"; children: Snippet } = $props();
</script>

<div
    class="pointer-events-none absolute top-4 right-4 left-20 z-10 justify-end md:inset-x-0 md:top-5 md:justify-center md:px-24
        {only === 'mobile' ? 'flex md:hidden' : only === 'desktop' ? 'hidden md:flex' : 'flex'}"
>
    <span
        class="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full px-[18px] py-2 text-center text-sm leading-tight md:text-[15px]
            {tone === 'bright' ? 'bg-bright font-mono text-on-bright' : 'border border-ink bg-surface text-ink'}"
        role={live ? "status" : undefined}
        aria-live={live ? "polite" : undefined}
    >
        {@render children()}
    </span>
</div>
