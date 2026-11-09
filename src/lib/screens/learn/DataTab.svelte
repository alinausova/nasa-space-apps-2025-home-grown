<script lang="ts">
    import LearnSection from "./LearnSection.svelte";
    import { learn } from "./content";
    import cropIcons from "../../../assets/crop-icons/crop-icons.json";

    let c = $derived(learn());
    /** Crops the API scores (api/crop_database.py); kept in step by the icon map test. */
    const CROP_COUNT = Object.keys(cropIcons).length;

    let showBibliography = $state(false);
</script>

{#snippet table(rows: { variable: string; source: string; why: string; refs: string }[], caption: string, whyHeading = c.UI.data.whyItMatters)}
    <!-- Focusable so keyboard users can scroll the table sideways on narrow screens (WCAG 2.1.1, axe scrollable-region-focusable). -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="overflow-x-auto rounded-card border border-line-strong bg-surface focus-visible:outline-2 focus-visible:outline-ink" role="region" aria-label={caption} tabindex="0">
        <table class="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <caption class="sr-only">{caption}</caption>
            <thead>
                <tr class="text-xs text-ink-muted">
                    <th scope="col" class="px-4 py-2.5 font-normal">{c.UI.data.variable}</th>
                    <th scope="col" class="px-4 py-2.5 font-normal">{c.UI.data.source}</th>
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
    title={c.UI.data.usedTitle}
    body={c.UI.data.usedBody}
>
    {#snippet aside()}
        {@render table(c.DATA_USED, c.UI.data.usedCaption)}
    {/snippet}
</LearnSection>

<LearnSection
    label="02"
    title={c.UI.data.cropTitle}
    body={c.UI.data.cropBody(CROP_COUNT)}
>
    {#snippet aside()}
        {@render table(c.CROP_DATA, c.UI.data.cropCaption, c.UI.data.howWeUse)}
    {/snippet}
</LearnSection>

<LearnSection
    label="03"
    title={c.UI.data.researchedTitle}
    body={c.UI.data.researchedBody}
>
    {#snippet aside()}
        {@render table(c.DATA_RESEARCHED, c.UI.data.researchedCaption)}
    {/snippet}
</LearnSection>

<LearnSection label="04" title={c.UI.data.sources}>
    <button
        type="button"
        aria-expanded={showBibliography}
        aria-controls="bibliography"
        onclick={() => (showBibliography = !showBibliography)}
        class="mt-2 inline-flex min-h-11 items-center self-start rounded-full border border-ink px-5 text-sm hover:bg-surface"
    >
        {showBibliography ? c.UI.data.hideBibliography : c.UI.data.showBibliography(c.BIBLIOGRAPHY.length)}
    </button>
    {#if showBibliography}
        <ol id="bibliography" class="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[13px] text-ink-muted">
            {#each c.BIBLIOGRAPHY as entry, i (entry)}
                <li><span class="font-mono text-[11px]">[{i + 1}]</span> {entry}</li>
            {/each}
        </ol>
    {/if}
</LearnSection>
