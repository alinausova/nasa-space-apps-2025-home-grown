<script lang="ts">
    import LearnSection from "./LearnSection.svelte";
    import { learn } from "./content";

    let c = $derived(learn());

    const pad = (i: number) => String(i + 1).padStart(2, "0");
</script>

<LearnSection
    label="01"
    title={c.UI.about.whyTitle}
    body={c.UI.about.whyBody}
    asideLabel={c.UI.about.questionsLabel}
>
    {#snippet aside()}
        <ol class="m-0 list-none overflow-hidden rounded-card border border-line-strong bg-surface p-0">
            {#each c.QUESTIONS as question, i (question)}
                <li class="flex items-center gap-5 px-4 py-3 text-[15px] {i ? 'border-t border-line' : ''}">
                    <span class="font-mono text-[11px] text-ink-muted">{pad(i)}</span>{question}
                </li>
            {/each}
        </ol>
    {/snippet}
</LearnSection>

<LearnSection label="02" title={c.UI.about.team}>
    <ul class="m-0 mt-3 grid list-none grid-cols-2 border-t border-l border-line-strong p-0 md:grid-cols-3 lg:grid-cols-6">
        {#each c.TEAM as person (person.name)}
            <li class="flex flex-col gap-1 border-r border-b border-line-strong p-3">
                <img src={person.photo} alt="" loading="lazy" class="mb-2 aspect-[4/5] w-full rounded-sm object-cover grayscale-[30%]" />
                <span class="text-[15px] font-medium">{person.name}</span>
                <span class="text-[13px] text-ink-muted">{person.role}</span>
                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" class="mt-1 font-mono text-xs text-ink">
                    {c.UI.about.linkedin} <span aria-hidden="true">↗</span><span class="sr-only">{c.UI.about.opensNewTab(person.name)}</span>
                </a>
            </li>
        {/each}
    </ul>
</LearnSection>

<LearnSection label="03" title={c.UI.about.contact} body={c.UI.about.contactBody}>
    {#snippet aside()}
        <div class="grid gap-2.5 sm:grid-cols-2">
            {#each c.CONTACT as item (item.title)}
                <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex min-h-16 flex-col gap-0.5 rounded-card border border-ink bg-surface px-4 py-3 text-ink no-underline hover:bg-paper"
                >
                    <span class="text-[15px] font-semibold">{item.title}</span>
                    <span class="text-[13px] text-ink-muted">{item.body}</span>
                </a>
            {/each}
        </div>
    {/snippet}
</LearnSection>
