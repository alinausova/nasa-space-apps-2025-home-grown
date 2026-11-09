<script lang="ts">
    import laurel from "../../../assets/laurel.svg";
    import { router } from "../../router/router.svelte";

    let { compact = false }: { compact?: boolean } = $props();
</script>

<a
    href="{router.href({ name: 'learn', tab: 'about' })}#recognition"
    class="inline-flex items-center gap-2.5 text-ink no-underline hover:text-bright
        {compact ? 'justify-center text-xs' : 'self-start rounded-full border border-line py-2 pr-3.5 pl-2.5 text-[13px] whitespace-nowrap'}"
>
    <img src={laurel} alt="" width={compact ? 18 : 20} height={compact ? 18 : 20} class="shrink-0" />
    <span>
        <span class="font-semibold">Winner</span>
        {#if compact}· Pitch Perfect at UN climate conference COP30{:else}· Pitch Perfect at COP30, the UN Climate Change Conference, Belém 2025{/if}
    </span>
</a>
