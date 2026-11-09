<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import type { Snippet } from "svelte";

    let { children }: { children: Snippet } = $props();
</script>

<div class="absolute top-[88px] right-4 z-10 flex flex-col gap-3 md:top-5 md:right-5" role="toolbar" aria-label={i18n.m.shell.mapTools} aria-orientation="vertical">
    {@render children()}
</div>
