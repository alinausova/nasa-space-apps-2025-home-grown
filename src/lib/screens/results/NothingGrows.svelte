<script lang="ts">
    import type { ClimateResponse, CropsResponse } from "../../api/analysis";
    import { MONTH_SHORT } from "../../derive/climate";
    import { closestCalls, missSentence } from "../../derive/miss";

    // Shown when no crop is usable (score below 50 or not enough sun).
    let {
        climate,
        crops,
        placeLabel,
        onNewPlot,
        onCompare,
    }: {
        climate: ClimateResponse;
        crops: CropsResponse;
        placeLabel: string;
        onNewPlot: () => void;
        onCompare: () => void;
    } = $props();

    const COLD_WARMEST_C = 10;

    let c = $derived(climate.climate);
    let warmest = $derived(c.warmest_month);
    let calls = $derived(closestCalls(crops.crops));
    let tooCold = $derived(!c.growing_season || (warmest !== null && warmest.temp_avg < COLD_WARMEST_C));
    let tooDark = $derived(!tooCold && crops.crops.filter((x) => x.miss_reason?.kind === "sun").length > crops.crops.length / 2);

    let heading = $derived(
        tooCold ? "Too cold for anything to grow outdoors" : tooDark ? "Not enough sun for any crop here" : "Nothing reaches a good score here",
    );
    let reason = $derived(
        tooCold
            ? "Summer here is short and cool, so no crop reaches a good score in the open."
            : tooDark
              ? "Shade and short days leave too little light for most crops we score."
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
            <dd class="order-1 m-0 font-mono text-xl tabular md:text-2xl">{warmest ? `${warmest.temp_avg.toFixed(1)}°C` : "–"}</dd>
        </div>
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">above 5°C</dt>
            <dd class="order-1 m-0 font-mono text-xl tabular md:text-2xl">{c.days_above_5c} {c.days_above_5c === 1 ? "day" : "days"}</dd>
        </div>
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">sun in winter</dt>
            <dd class="order-1 m-0 font-mono text-xl tabular md:text-2xl">{c.winter_sun_hours.toFixed(c.winter_sun_hours < 10 ? 1 : 0)} h</dd>
        </div>
    </dl>

    {#if calls.length > 0}
        <section class="flex flex-col" aria-labelledby="closest-calls">
            <h2 id="closest-calls" class="m-0 pb-2 text-[13px] font-normal text-ink-muted">Closest calls</h2>
            {#each calls as crop (crop.crop_id)}
                <div class="flex items-center justify-between gap-4 border-t border-line py-3" data-testid="closest-call">
                    <span class="flex min-w-0 flex-col gap-0.5">
                        <span class="text-[17px] font-medium">{crop.crop_name}</span>
                        <span class="text-[13px] text-warn-ink">{missSentence(crop.miss_reason)}</span>
                    </span>
                    <span class="rounded-lg bg-ink/8 px-2.5 py-[3px] font-mono text-sm tabular">
                        <span class="sr-only">Score </span>{Math.round(crop.suitability.overall_score)}
                    </span>
                </div>
            {/each}
        </section>
    {/if}

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
