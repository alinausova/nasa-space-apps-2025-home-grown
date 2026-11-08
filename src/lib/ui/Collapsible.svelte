<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        title,
        subtitle,
        open = $bindable(true),
        children,
    }: { title: string; subtitle?: string; open?: boolean; children: Snippet } = $props();

    const id = $props.id();
</script>

<section class="rounded-card border border-line-strong bg-surface">
    <button
        type="button"
        aria-expanded={open}
        aria-controls="{id}-panel"
        onclick={() => (open = !open)}
        class="flex w-full items-center justify-between gap-4 rounded-card px-5 py-4 text-left
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
        <span class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[17px] font-medium">{title}</span>
            {#if subtitle}<span class="font-mono text-xs text-ink-muted">{subtitle}</span>{/if}
        </span>
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/35" aria-hidden="true">
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="transition-transform duration-150 {open ? 'rotate-180' : ''}"
            >
                <path d="M6 9l6 6 6-6" />
            </svg>
        </span>
    </button>
    {#if open}
        <div id="{id}-panel" class="px-5 pb-5">
            {@render children()}
        </div>
    {/if}
</section>
