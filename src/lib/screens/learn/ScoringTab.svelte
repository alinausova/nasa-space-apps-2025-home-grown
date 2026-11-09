<script lang="ts">
    import LearnSection from "./LearnSection.svelte";
    import { FORMULAS, SCORE_PARTS } from "./content";

    // Shades of stone ink for the weight bar (the factor greens belong to the app theme).
    const SHADES = ["#2F3336", "#5F6366", "#8E9194", "#BEC0C2"];
    const total = FORMULAS.length;
</script>

<LearnSection
    label="Overview"
    title="What makes up the score"
    body="Crops without enough sun are removed first. Every other crop gets a score from 0 to 100, built from four weighted parts."
>
    {#snippet aside()}
        <div class="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]" role="img" aria-label="Weights: heat 35%, sunlight 25%, temperature 25%, water 15%">
            {#each SCORE_PARTS as part, i (part.title)}
                <span class="block h-full" style:width="{part.weight}%" style:background={SHADES[i]}></span>
            {/each}
        </div>
        <dl class="m-0 grid grid-cols-2 overflow-hidden rounded-card border border-line-strong bg-surface md:grid-cols-4">
            {#each SCORE_PARTS as part, i (part.title)}
                <div class="flex flex-col gap-1 p-3.5 {i % 2 ? '' : 'border-r'} {i < 2 ? 'border-b md:border-b-0' : ''} border-line md:border-r md:last:border-r-0">
                    <dt class="order-2 text-[13px] font-medium">{part.title}</dt>
                    <dd class="order-1 m-0 font-mono text-lg">{part.weight}%</dd>
                    <dd class="order-3 m-0 text-xs leading-snug text-ink-muted">{part.body}</dd>
                </div>
            {/each}
        </dl>
    {/snippet}
</LearnSection>

{#each FORMULAS as formula, i (formula.title)}
    <LearnSection label="{String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}" title={formula.title} body={formula.body}>
        {#snippet aside()}
            <!-- Focusable so keyboard users can scroll long formulas sideways (WCAG 2.1.1, axe scrollable-region-focusable). -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <pre
                class="m-0 overflow-x-auto rounded-card border border-ink bg-surface px-4 py-3.5 font-mono text-[13px] leading-relaxed focus-visible:outline-2 focus-visible:outline-ink"
                role="region"
                aria-label="Formula: {formula.title}"
                tabindex="0">{formula.code}</pre>
        {/snippet}
    </LearnSection>
{/each}
