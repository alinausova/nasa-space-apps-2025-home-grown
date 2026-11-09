<script lang="ts">
    import LearnSection from "./LearnSection.svelte";
    import LeafLabel from "../../ui/LeafLabel.svelte";
    import { learn } from "./content";

    let c = $derived(learn());
</script>

<LearnSection
    label="01"
    title={c.UI.architecture.title}
    body={c.UI.architecture.body}
>
    {#snippet aside()}
        <ol class="m-0 list-none overflow-hidden rounded-card border border-line-strong bg-surface p-0">
            {#each c.PIPELINE as stage, i (stage.title)}
                <li class="flex gap-3.5 px-[18px] py-4 {i ? 'border-t border-line' : ''}">
                    <span class="flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-xs">{i + 1}</span>
                    <span class="flex flex-col gap-0.5">
                        <span class="text-[15px] font-medium">{stage.title}</span>
                        <span class="text-[13px] text-ink-muted">{stage.body}</span>
                    </span>
                </li>
            {/each}
        </ol>
    {/snippet}
</LearnSection>

<LearnSection label="02" title={c.UI.architecture.stack}>
    {#snippet aside()}
        <dl class="m-0 grid overflow-hidden rounded-card border border-line-strong bg-surface sm:grid-cols-2">
            {#each c.STACK as item, i (item.title)}
                <div class="flex flex-col gap-1 px-4 py-3.5 {i ? 'border-t border-line' : ''} {i === 1 ? 'sm:border-t-0' : ''} {i % 2 === 0 ? 'sm:border-r' : ''}">
                    <dt class="text-xs text-ink-muted">{item.title}</dt>
                    <dd class="m-0 text-[15px]">{item.body}</dd>
                </div>
            {/each}
        </dl>
    {/snippet}
</LearnSection>

<LearnSection label="03" title={c.UI.architecture.assumptions} body={c.UI.architecture.assumptionsBody}>
    {#snippet aside()}
        <div class="flex flex-col gap-2 rounded-card border border-line-strong bg-surface p-5">
            <LeafLabel />
            <p class="m-0 text-[15px] leading-relaxed">{c.ASSUMPTIONS}</p>
        </div>
    {/snippet}
</LearnSection>
