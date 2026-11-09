<script lang="ts">
    import LearnSection from "./LearnSection.svelte";
    import { BIBLIOGRAPHY, DATA_RESEARCHED, DATA_USED } from "./content";

    let showBibliography = $state(false);
</script>

{#snippet table(rows: { variable: string; source: string; why: string; refs: string }[], caption: string)}
    <div class="overflow-x-auto rounded-card border border-line-strong bg-surface">
        <table class="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <caption class="sr-only">{caption}</caption>
            <thead>
                <tr class="text-xs text-ink-muted">
                    <th scope="col" class="px-4 py-2.5 font-normal">Variable</th>
                    <th scope="col" class="px-4 py-2.5 font-normal">Source</th>
                    <th scope="col" class="px-4 py-2.5 font-normal">Why it matters</th>
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
    body="A year of daily NASA POWER data for the centre of your plot, refined with Landsat surface temperature wherever a clear scene exists."
>
    {#snippet aside()}
        {@render table(DATA_USED, "Variables used in your results")}
    {/snippet}
</LearnSection>

<LearnSection
    label="02"
    title="Researched, not used yet"
    body="Variables our research says matter, which Home Grown does not read yet. Measured shade would replace the 30% assumption."
>
    {#snippet aside()}
        {@render table(DATA_RESEARCHED, "Variables researched but not used yet")}
    {/snippet}
</LearnSection>

<LearnSection label="03" title="Sources">
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
