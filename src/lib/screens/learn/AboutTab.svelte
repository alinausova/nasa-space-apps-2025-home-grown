<script lang="ts">
    import laurel from "../../../assets/laurel.svg";
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

<LearnSection id="recognition" label="03" title={c.UI.about.recognition} body={c.UI.about.recognitionBody}>
    {#snippet aside()}
        <div class="on-ink flex gap-4 rounded-card bg-ink p-5 text-paper">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                <img src={laurel} alt="" width="26" height="26" />
            </span>
            <span class="flex flex-col gap-1.5">
                <span class="font-mono text-xs tracking-[0.1em] text-bright uppercase">{c.RECOGNITION_FEATURED.eyebrow}</span>
                <span class="text-xl leading-snug">{c.RECOGNITION_FEATURED.title}</span>
                <span class="text-[13px] text-paper/75">{c.RECOGNITION_FEATURED.where}</span>
                <span class="mt-1 text-[13px] leading-relaxed text-paper/90">{c.RECOGNITION_FEATURED.body}</span>
            </span>
        </div>
        {#each c.RECOGNITION as item (item.title)}
            <div class="flex items-center gap-4 rounded-card border border-line-strong bg-surface px-5 py-4">
                <span class="flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[11px]">{item.year}</span>
                <span class="flex flex-col gap-0.5">
                    <span class="text-[17px]">{item.title}</span>
                    <span class="text-[13px] text-ink-muted">{item.body}</span>
                </span>
            </div>
        {/each}
    {/snippet}
</LearnSection>

<LearnSection label="04" title={c.UI.about.contact} body={c.UI.about.contactBody}>
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
