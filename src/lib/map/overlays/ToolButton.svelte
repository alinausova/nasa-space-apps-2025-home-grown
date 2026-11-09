<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        label,
        active = false,
        disabled = false,
        onclick,
        children,
    }: { label: string; active?: boolean; disabled?: boolean; onclick: () => void; children: Snippet } = $props();
</script>

<button
    type="button"
    aria-label={label}
    title={label}
    aria-pressed={active}
    {disabled}
    {onclick}
    class="flex size-12 items-center justify-center rounded-full transition-colors md:size-11
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
        disabled:cursor-not-allowed disabled:opacity-40
        {active ? 'bg-bright text-on-bright shadow-[0_0_0_6px_rgba(34,197,94,0.2)]' : 'border border-ink bg-surface text-ink hover:bg-selected'}"
>
    {@render children()}
</button>
