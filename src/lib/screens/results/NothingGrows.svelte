<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import { cropName } from "../../i18n/crops";
    import type { ClimateResponse, CropsResponse } from "../../api/analysis";
    import { monthShort } from "../../i18n/format";
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

    let t = $derived(i18n.m.nothing);
    let c = $derived(climate.climate);
    let warmest = $derived(c.warmest_month);
    let calls = $derived(closestCalls(crops.crops));
    let tooCold = $derived(!c.growing_season || (warmest !== null && warmest.temp_avg < COLD_WARMEST_C));
    let tooDark = $derived(!tooCold && crops.crops.filter((x) => x.miss_reason?.kind === "sun").length > crops.crops.length / 2);

    let heading = $derived(
        tooCold ? t.tooCold : tooDark ? t.tooDark : t.neither,
    );
    let reason = $derived(
        tooCold
            ? t.tooColdReason
            : tooDark
              ? t.tooDarkReason
              : t.neitherReason,
    );
</script>

<div class="flex flex-col gap-6" data-testid="nothing-grows">
    <div class="flex flex-col gap-2">
        <span class="font-mono text-xs text-ink-muted">03 / {t.step}</span>
        <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[38px]">{heading}</h1>
        <p class="m-0 text-[15px] leading-relaxed text-ink-muted md:text-base">{placeLabel}. {reason}</p>
    </div>

    <dl class="m-0 grid grid-cols-3 gap-3 rounded-card border border-line-strong bg-surface px-[18px] py-4">
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">{warmest ? t.warmestMonthIn(monthShort(warmest.month - 1)) : t.warmestMonth}</dt>
            <dd class="order-1 m-0 font-mono text-xl tabular md:text-2xl">{warmest ? `${warmest.temp_avg.toFixed(1)}°C` : "–"}</dd>
        </div>
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">{t.above5}</dt>
            <dd class="order-1 m-0 font-mono text-xl tabular md:text-2xl">{t.days(c.days_above_5c)}</dd>
        </div>
        <div class="flex flex-col gap-1">
            <dt class="order-2 text-[13px] text-ink-muted">{t.winterSun}</dt>
            <dd class="order-1 m-0 font-mono text-xl tabular md:text-2xl">{c.winter_sun_hours.toFixed(c.winter_sun_hours < 10 ? 1 : 0)} h</dd>
        </div>
    </dl>

    {#if calls.length > 0}
        <section class="flex flex-col" aria-labelledby="closest-calls">
            <h2 id="closest-calls" class="m-0 pb-2 text-[13px] font-normal text-ink-muted">{t.closestCalls}</h2>
            {#each calls as crop (crop.crop_id)}
                <div class="flex items-center justify-between gap-4 border-t border-line py-3" data-testid="closest-call">
                    <span class="flex min-w-0 flex-col gap-0.5">
                        <span class="text-[17px] font-medium">{cropName(crop)}</span>
                        <span class="text-[13px] text-warn-ink">{missSentence(crop.miss_reason)}</span>
                    </span>
                    <span class="rounded-lg bg-ink/8 px-2.5 py-[3px] font-mono text-sm tabular">
                        <span class="sr-only">{i18n.m.shell.score}</span>{Math.round(crop.suitability.overall_score)}
                    </span>
                </div>
            {/each}
        </section>
    {/if}

    <section class="flex flex-col gap-2.5" aria-labelledby="try-instead">
        <h2 id="try-instead" class="m-0 text-[13px] font-normal text-ink-muted">{t.tryInstead}</h2>
        <button
            type="button"
            onclick={onNewPlot}
            class="flex min-h-14 items-center justify-between rounded-[14px] border border-ink bg-surface px-5 text-left text-[17px] hover:bg-selected"
        >
            {t.sunnierSpot} <span aria-hidden="true">→</span>
        </button>
        <button
            type="button"
            onclick={onCompare}
            class="flex min-h-14 items-center justify-between rounded-[14px] border border-ink bg-surface px-5 text-left text-[17px] hover:bg-selected"
        >
            {t.compare} <span aria-hidden="true">→</span>
        </button>
        <p class="m-0 text-[13px] leading-relaxed text-ink-muted">
            {t.greenhouses}
        </p>
    </section>
</div>
