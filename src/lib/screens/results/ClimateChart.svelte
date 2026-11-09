<script lang="ts">
    import { monthInitial, monthShort } from "../../i18n/format";
    const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    import type { MonthlyClimate } from "../../api/analysis";
    import { describeClimate, rainiestMonth, type GrowingSeason } from "../../derive/climate";

    let { monthly, season }: { monthly: MonthlyClimate[]; season: GrowingSeason | null } = $props();

    // Geometry from the design: 12 columns between x 30 and 430, plot area y 20–160.
    const X0 = 30;
    const X1 = 430;
    const Y0 = 20;
    const Y1 = 160;
    const COL = (X1 - X0) / 12;

    let sorted = $derived([...monthly].sort((a, b) => a.month - b.month));
    let lo = $derived(Math.floor(Math.min(0, ...sorted.map((m) => m.temp_min)) / 5) * 5);
    let hi = $derived(Math.ceil(Math.max(10, ...sorted.map((m) => m.temp_max)) / 5) * 5);
    // Rain bars use their own scale: the wettest month fills three quarters of the plot height.
    let maxRain = $derived(Math.max(1, ...sorted.map((m) => m.precip_mm)));
    let rainHeight = (mm: number) => (mm / maxRain) * (Y1 - Y0) * 0.75;
    let wettest = $derived(rainiestMonth(sorted));
    let description = $derived(
        describeClimate(
            sorted.map((m) => ({ month: m.month, month_name: "", avg_temp_max: m.temp_max, avg_temp_min: m.temp_min, avg_temp: m.temp_avg })),
            season,
        ) + (wettest ? ` Rain peaks at ${Math.round(wettest.precip_mm)} millimetres in ${monthShort(wettest.month - 1)}.` : ""),
    );
    let ticks = $derived.by(() => {
        const out: number[] = [];
        for (let t = Math.ceil(lo / 10) * 10; t <= hi; t += 10) out.push(t);
        return out;
    });

    const x = (monthIndex: number) => X0 + COL * (monthIndex + 0.5);
    let y = $derived((t: number) => Y1 - ((t - lo) / (hi - lo || 1)) * (Y1 - Y0));
    let line = $derived((key: "temp_max" | "temp_min") => sorted.map((m) => `${x(m.month - 1)},${y(m[key])}`).join(" "));

    // Bracket and label go over the longest run of the season.
    let labelRun = $derived(season ? [...season.runs].sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0] : null);
    let labelText = $derived(season ? `Growing season · ${season.label}` : "");
    let labelWidth = $derived(labelText.length * 5.6 + 20);
    let labelX = $derived.by(() => {
        if (!labelRun) return 0;
        const mid = X0 + COL * ((labelRun[0] + labelRun[1] + 1) / 2);
        return Math.min(X1 - labelWidth / 2, Math.max(X0 + labelWidth / 2, mid));
    });
</script>

<svg viewBox="0 -16 440 206" class="block h-auto w-full" role="img" aria-label={description}>
    {#if season}
        {#each season.runs as [start, end] (start)}
            <rect x={X0 + start * COL} y={Y0} width={(end - start + 1) * COL} height={Y1 - Y0} rx="4" fill="#22C55E" fill-opacity="0.2" />
        {/each}
        {#if labelRun}
            <path
                d="M{X0 + labelRun[0] * COL} 16 V8 H{X0 + (labelRun[1] + 1) * COL} V16"
                fill="none"
                stroke="#1B6A24"
                stroke-width="1.5"
                stroke-linejoin="round"
            />
            <rect x={labelX - labelWidth / 2} y="-5" width={labelWidth} height="17" rx="8.5" fill="#1B6A24" />
            <text x={labelX} y="7.5" text-anchor="middle" font-family="var(--hg-font)" font-size="10" font-weight="600" fill="#D9FCD4">{labelText}</text>
        {/if}
    {/if}

    <g fill="var(--hg-rain)" data-testid="rain-bars">
        {#each sorted as m (m.month)}
            <rect x={x(m.month - 1) - COL * 0.28} y={Y1 - rainHeight(m.precip_mm)} width={COL * 0.56} height={rainHeight(m.precip_mm)} rx="2" />
        {/each}
    </g>

    <g stroke="#1B6A24" stroke-opacity="0.12">
        {#each ticks as t (t)}
            <line x1={X0} y1={y(t)} x2={X1} y2={y(t)} />
        {/each}
    </g>
    {#if lo < 0 && hi > 0}
        <line x1={X0} y1={y(0)} x2={X1} y2={y(0)} stroke="#1B6A24" stroke-opacity="0.35" />
    {/if}
    <g font-family="var(--hg-font-mono)" font-size="9" fill="#256F2D">
        {#each ticks as t (t)}
            <text x={X0 - 6} y={y(t) + 3} text-anchor="end">{t}°</text>
        {/each}
        {#each MONTH_INDEXES.map(monthInitial) as initial, i (i)}
            <text x={x(i)} y={Y1 + 18} text-anchor="middle">{initial}</text>
        {/each}
    </g>

    <polyline points={line("temp_max")} fill="none" stroke="#E86A2B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    <polyline points={line("temp_min")} fill="none" stroke="#1F4FA8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
</svg>

<div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-muted" aria-hidden="true">
    <span class="flex items-center gap-1.5"><span class="block h-[3px] w-4 rounded-full bg-daily-high"></span>Daily high</span>
    <span class="flex items-center gap-1.5"><span class="block h-[3px] w-4 rounded-full bg-daily-low"></span>Daily low</span>
    <span class="flex items-center gap-1.5"><span class="block size-2.5 rounded-[3px] bg-rain"></span>Rainfall</span>
    {#if season}<span class="flex items-center gap-1.5"><span class="block size-2.5 rounded-[3px] bg-season-band"></span>Growing season</span>{/if}
</div>
