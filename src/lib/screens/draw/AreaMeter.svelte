<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import type { Plot } from "../../state/journey.svelte";
    import { areaComparison, formatArea, limitFraction, percentOverLimit } from "../../derive/area";

    let { plot, tooLarge }: { plot: Plot | null; tooLarge: boolean } = $props();
    let t = $derived(i18n.m.draw);

    let hasArea = $derived(plot !== null && plot.areaM2 > 0);
    let corners = $derived(plot?.corners ?? 0);
</script>

<!-- Desktop: card. Mobile: bare figures in the low sheet. -->
<div
    class="flex flex-col gap-3.5 md:rounded-card md:border md:border-line-strong md:bg-surface md:p-[18px]"
    role="status"
    aria-live="polite"
>
    <span class="hidden items-baseline justify-between md:flex">
        <span class="text-[13px] {tooLarge ? 'font-semibold text-warn-ink' : ''}">{tooLarge ? t.tooLarge : t.yourPlot}</span>
        <span class="font-mono text-xs text-ink-muted">{t.corners(corners)}</span>
    </span>

    {#if hasArea && plot}
        <div class="flex items-end justify-between gap-4">
            <span class="font-mono text-[40px] leading-none tracking-[-0.02em] tabular md:text-[34px] {tooLarge ? 'text-warn-ink' : ''}">
                {formatArea(plot.areaM2)}
            </span>
            <span class="max-w-[50%] text-right text-[13px] text-ink-muted md:hidden">{tooLarge ? t.overLimitShort : areaComparison(plot.areaM2)}</span>
        </div>

        <span class="hidden h-1 rounded-sm bg-ink/12 md:block" aria-hidden="true">
            <span
                class="block h-full min-w-1.5 rounded-sm {tooLarge ? 'bg-harvest' : 'bg-ink'}"
                style:width="{limitFraction(plot.areaM2) * 100}%"
            ></span>
        </span>

        {#if tooLarge}
            <span class="text-[13px] text-ink-muted">
                {t.overLimit(percentOverLimit(plot.areaM2))}
            </span>
        {:else}
            <span class="hidden text-[13px] text-ink-muted md:block">{t.withinLimit(areaComparison(plot.areaM2))}</span>
        {/if}
    {:else}
        <span class="font-mono text-[40px] leading-none tracking-[-0.02em] text-ink/30 md:text-[34px]">0 m²</span>
        <span class="text-[13px] text-ink-muted">
            <span class="hidden md:inline">{t.hintDesktop}</span>
            <span class="md:hidden">{t.hintMobile}</span>
        </span>
    {/if}
</div>
