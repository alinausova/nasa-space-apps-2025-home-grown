<script lang="ts">
    import LearnSection from "./LearnSection.svelte";
    import { BIBLIOGRAPHY, CROP_DATA, DATA_RESEARCHED, DATA_USED } from "./content";

    let showBibliography = $state(false);
</script>

{#snippet table(rows: { variable: string; source: string; why: string; refs: string }[], caption: string, whyHeading = "Why it matters")}
    <!-- Focusable so keyboard users can scroll the table sideways on narrow screens (WCAG 2.1.1, axe scrollable-region-focusable). -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="overflow-x-auto rounded-card border border-line-strong bg-surface focus-visible:outline-2 focus-visible:outline-ink" role="region" aria-label={caption} tabindex="0">
        <table class="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <caption class="sr-only">{caption}</caption>
            <thead>
                <tr class="text-xs text-ink-muted">
                    <th scope="col" class="px-4 py-2.5 font-normal">Variable</th>
                    <th scope="col" class="px-4 py-2.5 font-normal">Source</th>
                    <th scope="col" class="px-4 py-2.5 font-normal">{whyHeading}</th>
                </tr>
            </thead>
            <tbody>
                {#each rows as row (row.variable)}
                    <tr class="border-t border-line align-top">
                        <th scope="row" class="px-4 py-3 text-[15px] font-medium">{row.variable}</th>
                        <td class="px-4 py-3">{row.source}</td>
                        <td class="px-4 py-3 text-ink-muted">{row.why} {#if row.refs}<span class="font-mono text-[11px]">{row.refs}</span>{/if}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/snippet}

<LearnSection
    label="01"
    title="Used in your results"
    body="A year of daily NASA POWER data for the centre of your plot, plus Landsat 8/9 surface temperature from every clear scene over it."
>
    {#snippet aside()}
        {@render table(DATA_USED, "Variables used in your results")}
    {/snippet}
</LearnSection>

<LearnSection
    label="02"
    title="Crop data"
    body="Each of the 31 crops carries about 17 numbers. This is where they come from and what they drive. Temperatures, heat units and frost classes are team estimates for now. We are checking them against FAO ECOCROP and Oregon State’s field data, and will cite each one as it is replaced."
>
    {#snippet aside()}
        {@render table(CROP_DATA, "Where the crop numbers come from", "How we use it")}
    {/snippet}
</LearnSection>

<LearnSection
    label="03"
    title="Researched, not used yet"
    body="Variables our research says matter, which Home Grown does not read yet. Measured shade would replace the 30% assumption."
>
    {#snippet aside()}
        {@render table(DATA_RESEARCHED, "Variables researched but not used yet")}
    {/snippet}
</LearnSection>

<LearnSection label="04" title="Sources">
    <button
        type="button"
        aria-expanded={showBibliography}
        aria-controls="bibliography"
        onclick={() => (showBibliography = !showBibliography)}
        class="mt-2 inline-flex min-h-11 items-center self-start rounded-full border border-ink px-5 text-sm hover:bg-surface"
    >
        {showBibliography ? "Hide bibliography" : `Show bibliography · ${BIBLIOGRAPHY.length} sources`}
    </button>
    {#if showBibliography}
        <ol id="bibliography" class="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[13px] text-ink-muted">
            {#each BIBLIOGRAPHY as entry, i (entry)}
                <li><span class="font-mono text-[11px]">[{i + 1}]</span> {entry}</li>
            {/each}
        </ol>
    {/if}
</LearnSection>
