<script lang="ts">
    import { i18n } from "../i18n/locale.svelte";
    let {
        value,
        color,
        label,
        size = 76,
    }: { value: number; color: string; label: string; size?: number } = $props();

    const radius = 31;
    const circumference = 2 * Math.PI * radius;

    let clamped = $derived(Math.min(100, Math.max(0, value)));
    let dash = $derived(`${(circumference * clamped) / 100} ${circumference}`);
</script>

<svg width={size} height={size} viewBox="0 0 76 76" role="img" aria-label={i18n.m.results.ringLabel(label, Math.round(clamped))}>
    <circle cx="38" cy="38" r={radius} fill="none" stroke="currentColor" stroke-opacity="0.14" stroke-width="7" />
    <circle
        cx="38"
        cy="38"
        r={radius}
        fill="none"
        stroke={color}
        stroke-width="7"
        stroke-linecap="round"
        stroke-dasharray={dash}
        transform="rotate(-90 38 38)"
    />
    <text x="38" y="43" text-anchor="middle" font-family="var(--hg-font-mono)" font-size="15" fill="currentColor">
        {Math.round(clamped)}
    </text>
</svg>
