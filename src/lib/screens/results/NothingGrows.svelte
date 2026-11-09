<script lang="ts">
    import type { RecommendationsResponse } from "../../api/types";
    import { MONTH_SHORT, growingSeason, warmestMonth } from "../../derive/climate";

    // Shown when no crop is usable (score below 50 or not enough sun).
    // TODO(redesign v2): "Closest calls" with the reason each crop misses, once the back end returns them.
    let {
        results,
        placeLabel,
        onNewPlot,
        onCompare,
    }: { results: RecommendationsResponse; placeLabel: string; onNewPlot: () => void; onCompare: () => void } = $props();

    const COLD_WARMEST_C = 10;

    let monthly = $derived(results.monthly_temperature_averages?.monthly_averages ?? []);
    let warmest = $derived(warmestMonth(monthly));
    let season = $derived(growingSeason(monthly));
    let sun = $derived(results.climate_summary.representative_sun_hours_daily);
    let tooCold = $derived(!season || (warmest !== null && warmest.avg_temp < COLD_WARMEST_C));
    let tooDark = $derived(!tooCold && (results.total_filtered_by_sunlight ?? 0) > 0);

    let heading = $derived(
        tooCold ? "Too cold for anything to grow outdoors" : tooDark ? "Not enough sun for any crop here" : "Nothing reaches a good score here",
    );
    let reason = $derived(
        tooCold
            ? "Summer here is short and cool, so no crop reaches a good score in the open."
            : tooDark
              ? "Shade and short days leave too little light for every crop we score."
              : "Heat, sun and rain never line up well enough for any crop we score.",
    );
</script>

<div class="flex flex-col gap-6" data-testid="nothing-grows">
    <div class="flex flex-col gap-2">
        <span class="font-mono text-xs text-ink-muted">03 / What grows here</span>
        <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[38px]">{heading}</h1>
        <p class="m-0 text-[15px] leading-relaxed text-ink-muted md:text-base">{placeLabel}. {reason}</p>
    </div>

    <dl class="m-0 grid grid-cols-3 gap-3 rounded-card border border-line-strong bg-surface px-[18px] py-4">
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">{warmest ? `warmest month (${MONTH_SHORT[warmest.month - 1]})` : "warmest month"}</dt>
            <dd class="m-0 order-1 font-mono text-xl tabular md:text-2xl">{warmest ? `${warmest.avg_temp.toFixed(1)}°C` : "–"}</dd>
        </div>
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">above 5°C on average</dt>
            <dd class="m-0 order-1 font-mono text-xl tabular md:text-2xl">{season ? season.days : 0} days</dd>
        </div>
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">sun a day while warm</dt>
            <dd class="m-0 order-1 font-mono text-xl tabular md:text-2xl">{sun.toFixed(1)} h</dd>
        </div>
    </dl>

    <section class="flex flex-col gap-2.5" aria-labelledby="try-instead">
        <h2 id="try-instead" class="m-0 text-[13px] font-normal text-ink-muted">What you could try</h2>
        <button
            type="button"
            onclick={onNewPlot}
            class="flex min-h-14 items-center justify-between rounded-[14px] border border-ink bg-surface px-5 text-left text-[17px] hover:bg-selected"
        >
            Try a sunnier spot nearby <span aria-hidden="true">→</span>
        </button>
        <button
            type="button"
            onclick={onCompare}
            class="flex min-h-14 items-center justify-between rounded-[14px] border border-ink bg-surface px-5 text-left text-[17px] hover:bg-selected"
        >
            Compare with a sample city <span aria-hidden="true">→</span>
        </button>
        <p class="m-0 text-[13px] leading-relaxed text-ink-muted">
            Greenhouses change the picture completely, but Home Grown only scores open-air growing for now.
        </p>
    </section>
</div>
