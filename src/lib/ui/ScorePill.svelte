<script lang="ts">
    let { score }: { score: number } = $props();
</script>

<span class="inline-block min-w-10 rounded-lg bg-ink/8 px-1 py-[3px] text-center font-mono text-sm tabular">
    <span class="sr-only">Score </span>{Math.round(score)}
</span>
