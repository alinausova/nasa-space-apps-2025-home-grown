<script lang="ts">
    import type { Snippet } from "svelte";

    let { children }: { children: Snippet } = $props();
</script>

<span class="inline-flex h-9 items-center rounded-full border border-ink/40 px-4 text-[15px] font-medium">
    {@render children()}
</span>
