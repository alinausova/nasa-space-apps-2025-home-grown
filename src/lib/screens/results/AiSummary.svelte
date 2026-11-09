<script lang="ts">
    import LeafLabel from "../../ui/LeafLabel.svelte";
    import { paragraphs } from "../../derive/text";

    let { text }: { text: string } = $props();

    let blocks = $derived(paragraphs(text));
</script>

{#if blocks.length > 0}
    <section class="flex flex-col gap-2" aria-label="Summary by Mistral AI">
        <LeafLabel />
        {#each blocks as block, i (i)}
            <p class="m-0 text-base leading-relaxed">
                {#each block as segment, j (j)}{#if segment.bold}<strong class="font-semibold">{segment.text}</strong>{:else}{segment.text}{/if}{/each}
            </p>
        {/each}
    </section>
{/if}
