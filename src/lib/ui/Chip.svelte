<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLButtonAttributes } from "svelte/elements";

    type Props = {
        selected?: boolean;
        children: Snippet;
    } & Omit<HTMLButtonAttributes, "children">;

    let { selected = false, class: className = "", children, ...rest }: Props = $props();
</script>

<button
    type="button"
    aria-pressed={selected}
    class="tap-target inline-flex min-h-9 items-center rounded-full px-3.5 text-[13px] transition-colors
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
        {selected
            ? 'bg-bright font-semibold text-on-bright'
            : 'border border-ink/40 bg-transparent text-ink hover:bg-ink/5'}
        {className}"
    {...rest}
>
    {@render children()}
</button>
