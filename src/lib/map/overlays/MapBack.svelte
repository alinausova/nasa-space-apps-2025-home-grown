<script lang="ts">
    import Icon from "../../ui/Icon.svelte";

    // Mobile only: the round back button over the map (desktop navigates from the sidebar).
    let { label, onclick, href }: { label: string; onclick?: () => void; href?: string } = $props();

    const classes =
        "absolute top-4 left-4 z-10 flex size-12 items-center justify-center rounded-full border border-ink bg-surface text-ink no-underline md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
</script>

{#if href}
    <a {href} aria-label={label} class={classes}><Icon name="back" /></a>
{:else}
    <button type="button" aria-label={label} {onclick} class={classes}><Icon name="back" /></button>
{/if}
