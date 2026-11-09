<script lang="ts">
    import type { Snippet } from "svelte";

    // Two-column section: text on the left, the visual on stone furrows on the right. Full width without `aside`.
    let {
        id,
        label,
        title,
        body,
        children,
        aside,
        asideLabel,
    }: {
        id?: string;
        label: string;
        title: string;
        body?: string;
        children?: Snippet;
        aside?: Snippet;
        asideLabel?: string;
    } = $props();

    const uid = $props.id();
</script>

<!-- minmax(0, …) columns so wide content (tables) scrolls inside its box instead of widening the page. -->
<section
    {id}
    class="grid scroll-mt-28 grid-cols-[minmax(0,1fr)] border-t border-line {aside ? 'lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]' : ''}"
    aria-labelledby="{uid}-title"
>
    <div class="flex min-w-0 flex-col gap-3 px-5 py-8 md:px-10 md:py-10">
        <span class="font-mono text-xs text-ink-muted">{label}</span>
        <h2 id="{uid}-title" class="m-0 text-[28px] leading-tight font-normal tracking-[-0.01em] md:text-[32px]">{title}</h2>
        {#if body}<p class="m-0 max-w-[480px] text-[15px] leading-relaxed text-ink-muted md:text-base">{body}</p>{/if}
        {#if children}{@render children()}{/if}
    </div>
    {#if aside}
        <div class="flex min-w-0 flex-col gap-2.5 border-t border-line bg-furrows-stone px-5 py-8 md:px-10 md:py-10 lg:border-t-0 lg:border-l">
            {#if asideLabel}<span class="text-[13px] text-ink-muted">{asideLabel}</span>{/if}
            {@render aside()}
        </div>
    {/if}
</section>
