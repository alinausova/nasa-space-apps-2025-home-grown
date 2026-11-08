<script lang="ts">
    // Small "Home Grown" label above AI-written text.
    let { text = "Home Grown" }: { text?: string } = $props();
</script>

<span class="inline-flex items-center gap-1.5 text-sm font-semibold">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 21v-9" />
        <path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z" />
        <path d="M12 14c0-3.5-2.5-6-7-6 0 3.5 2.5 6 7 6z" />
    </svg>
    {text}
</span>
