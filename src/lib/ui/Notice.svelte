<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        title,
        role = "alert",
        children,
    }: { title?: string; role?: "alert" | "status"; children: Snippet } = $props();
</script>

<div {role} class="flex flex-col gap-1 rounded-[14px] border-[1.5px] border-dashed border-warn-border bg-warn px-4 py-3.5 text-[#6B3D05]">
    {#if title}
        <span class="text-sm font-semibold text-warn-ink">{title}</span>
    {/if}
    <div class="text-sm leading-relaxed">{@render children()}</div>
</div>
