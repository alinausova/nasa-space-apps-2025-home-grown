<script lang="ts">
    import type { Snippet } from "svelte";
    import type { HTMLAttributes } from "svelte/elements";

    type Props = { children: Snippet } & Omit<HTMLAttributes<HTMLDivElement>, "children">;

    let { class: className = "", children, ...rest }: Props = $props();
</script>

<div class="rounded-card border border-line-strong bg-surface p-[18px] {className}" {...rest}>
    {@render children()}
</div>
