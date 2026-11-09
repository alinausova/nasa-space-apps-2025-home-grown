<script lang="ts">
    let { mm }: { mm: number } = $props();
</script>

<span class="inline-flex items-center gap-1 rounded-full bg-water-pill px-2 py-px text-xs font-semibold text-water-pill-ink">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3c-3.5 4.5-6 7.8-6 11a6 6 0 0 0 12 0c0-3.2-2.5-6.5-6-11z" />
    </svg>
    Water {Math.round(mm)} mm
</span>
