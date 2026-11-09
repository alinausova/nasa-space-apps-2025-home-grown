<script lang="ts">
    import { spreadLabels, type Plan } from "../../derive/plan";
    import { bedCount, formatKg, listJoin } from "../../derive/format";

    let { plan, totalUsable }: { plan: Plan; totalUsable: number } = $props();

    const BED_FILLS = ["#1FA34A", "#22C55E", "#5ED68A", "#9BE6B2"];
    const id = $props.id();

    // Plan drawing sits in a 460 × 300 canvas: plot on the left (x 20–170), labels on the right.
    const OFFSET = { x: 20, y: 28 };
    const LABEL_X = 204;

    let pts = (shape: { x: number; y: number }[]) => shape.map((p) => `${p.x + OFFSET.x},${p.y + OFFSET.y}`).join(" ");
    let outline = $derived(pts(plan.outline));
    // Label rows: as close to their bed as possible, never overlapping (thin plots put beds close together).
    const LABEL_GAP = 42;
    let centers = $derived(plan.beds.map((b) => ({ x: b.center.x + OFFSET.x, y: b.center.y + OFFSET.y })));
    let labelYs = $derived(spreadLabels(centers.map((c) => c.y), LABEL_GAP, 34, 262));
    let numbered = $derived(plan.axis === "vertical");
    let elbowX = $derived(Math.max(...plan.outline.map((p) => p.x)) + OFFSET.x + 14);

    let names = $derived(plan.beds.map((b) => b.crop.crop_name));
    let ariaLabel = $derived(
        `Example planting plan for your plot: ${bedCount(plan.beds.length).toLowerCase()} of ${listJoin(names.map((n) => n.toLowerCase()))}, with paths between them.`,
    );
</script>

<!-- Desktop: drawn plan with labels. -->
<div class="hidden justify-center rounded-panel border border-line-strong bg-paper bg-geo-lines p-2.5 md:flex">
    <svg class="block h-auto w-full max-w-[440px]" viewBox="0 0 460 300" role="img" aria-label={ariaLabel}>
        <defs>
            <clipPath id="{id}-clip"><polygon points={outline} /></clipPath>
            {#each BED_FILLS as fill, i (i)}
                <pattern id="{id}-p{i}" width="9" height="9" patternUnits="userSpaceOnUse">
                    <rect width="9" height="9" {fill} />
                    <circle cx="4.5" cy="4.5" r="1.7" fill="#D9FCD4" fill-opacity="0.55" />
                </pattern>
            {/each}
        </defs>
        <polygon points={outline} fill="#F2FEF0" />
        <g clip-path="url(#{id}-clip)" stroke="#F2FEF0" stroke-width="6" paint-order="stroke">
            {#each plan.beds as bed, i (bed.crop.crop_id)}
                <polygon points={pts(bed.shape)} fill="url(#{id}-p{i})" />
            {/each}
        </g>
        <polygon points={outline} fill="none" stroke="#1B6A24" stroke-width="1.5" stroke-linejoin="round" />
        <g font-family="var(--hg-font)" fill="#1B6A24">
            {#each plan.beds as bed, i (bed.crop.crop_id)}
                {@const c = centers[i]}
                {@const ly = labelYs[i]}
                {#if numbered}
                    <!-- Side-by-side strips: lines would cross other beds, so beds and labels share a number. -->
                    <circle cx={c.x} cy={c.y} r="7.5" fill="#F2FEF0" stroke="#1B6A24" stroke-width="1" />
                    <text x={c.x} y={c.y + 3.5} text-anchor="middle" font-family="var(--hg-font-mono)" font-size="10">{i + 1}</text>
                    <circle cx={LABEL_X - 14} cy={ly - 8} r="7.5" fill="none" stroke="#1B6A24" stroke-width="1" />
                    <text x={LABEL_X - 14} y={ly - 4.5} text-anchor="middle" font-family="var(--hg-font-mono)" font-size="10">{i + 1}</text>
                {:else}
                    <circle cx={c.x} cy={c.y} r="2.5" fill="#1B6A24" />
                    <path
                        d="M{c.x} {c.y} H{elbowX} L{Math.min(elbowX + 12, LABEL_X - 12)} {ly} H{LABEL_X - 8}"
                        fill="none"
                        stroke="#1B6A24"
                        stroke-opacity="0.5"
                        stroke-dasharray="3 3"
                    />
                {/if}
                <text x={LABEL_X} y={ly - 3} font-size="15">
                    {bed.crop.crop_name}
                    <tspan font-family="var(--hg-font-mono)" font-size="12">{Math.round(bed.crop.suitability.overall_score)}</tspan>
                </text>
                <text x={LABEL_X} y={ly + 14} font-family="var(--hg-font-mono)" font-size="11" fill="#256F2D">
                    {Math.round(bed.areaM2).toLocaleString("en-US")} m² · {formatKg(bed.yieldKg, { approx: true })}
                </text>
            {/each}
            <text x={OFFSET.x + 18} y="296" font-size="11" fill="#256F2D">Example plan · 70% planted, the rest left for paths</text>
        </g>
    </svg>
</div>

<!-- Mobile: compact summary. -->
<div class="flex items-center gap-4 rounded-panel border border-line-strong p-4 md:hidden">
    <svg class="h-20 w-12 shrink-0" viewBox="0 0 {plan.width} {plan.height}" aria-hidden="true">
        <defs><clipPath id="{id}-mclip"><polygon points={plan.outline.map((p) => `${p.x},${p.y}`).join(" ")} /></clipPath></defs>
        <g clip-path="url(#{id}-mclip)" stroke="#F2FEF0" stroke-width="10">
            {#each plan.beds as bed, i (bed.crop.crop_id)}
                <polygon points={bed.shape.map((p) => `${p.x},${p.y}`).join(" ")} fill={BED_FILLS[i]} />
            {/each}
        </g>
        <polygon points={plan.outline.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#1B6A24" stroke-width="5" />
    </svg>
    <p class="m-0 flex flex-col gap-1 text-[15px] leading-snug">
        <span class="font-semibold">{listJoin(names.map((n, i) => (i === 0 ? n : n.toLowerCase())))}</span>
        <span>
            {bedCount(plan.beds.length)} fill your plot, about {formatKg(plan.totalYieldKg)} a season.
            {totalUsable} {totalUsable === 1 ? "crop fits" : "crops fit"} in total.
        </span>
    </p>
</div>
