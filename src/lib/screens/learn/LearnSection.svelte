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

<!--
    Full-bleed section: the top border and the stone texture behind the right column run to the window edges,
    while the content stays in the 1156px column. The texture starts where the right column starts:
    42.5% of the column (0.85 / 2 fr), measured from the column's left edge, which is 50% - 578px on wide screens.
    minmax(0, …) columns so wide content (tables) scrolls inside its box instead of widening the page.
-->
<section {id} class="relative scroll-mt-28 border-t border-line" aria-labelledby="{uid}-title">
    {#if aside}
        <div class="absolute inset-y-0 right-0 hidden border-l border-line bg-furrows-stone lg:block" style:left="max(42.5%, calc(50% - 578px + 491.3px))" aria-hidden="true"></div>
    {/if}
    <div class="relative mx-auto grid max-w-[1156px] grid-cols-[minmax(0,1fr)] {aside ? 'lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]' : ''}">
        <div class="flex min-w-0 flex-col gap-3 px-5 py-8 md:px-10 md:py-10">
            <span class="font-mono text-xs text-ink-muted">{label}</span>
            <h2 id="{uid}-title" class="m-0 text-[28px] leading-tight font-normal tracking-[-0.01em] md:text-[32px]">{title}</h2>
            {#if body}<p class="m-0 max-w-[480px] text-[15px] leading-relaxed text-ink-muted md:text-base">{body}</p>{/if}
            {#if children}{@render children()}{/if}
        </div>
        {#if aside}
            <div class="flex min-w-0 flex-col gap-2.5 border-t border-line bg-furrows-stone px-5 py-8 md:px-10 md:py-10 lg:border-t-0 lg:bg-none">
                {#if asideLabel}<span class="text-[13px] text-ink-muted">{asideLabel}</span>{/if}
                {@render aside()}
            </div>
        {/if}
    </div>
</section>
