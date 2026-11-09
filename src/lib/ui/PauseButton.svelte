<script lang="ts">
    let { playing = $bindable(true) }: { playing?: boolean } = $props();
</script>

<button
    type="button"
    aria-label={playing ? "Pause animation" : "Play animation"}
    aria-pressed={!playing}
    onclick={() => (playing = !playing)}
    class="tap-target flex size-[30px] items-center justify-center rounded-full border border-ink/35 bg-transparent text-ink
        hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
>
    {#if playing}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <rect x="2" y="1.5" width="2.6" height="9" rx="0.8" />
            <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8" />
        </svg>
    {:else}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5z" />
        </svg>
    {/if}
</button>
