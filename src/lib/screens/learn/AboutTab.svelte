<script lang="ts">
    import laurel from "../../../assets/laurel.svg";
    import LearnSection from "./LearnSection.svelte";
    import { CONTACT, QUESTIONS, RECOGNITION, RECOGNITION_FEATURED, TEAM } from "./content";

    const pad = (i: number) => String(i + 1).padStart(2, "0");
</script>

<LearnSection
    label="01"
    title="Why we built it"
    body="Cities keep growing and the climate keeps shifting. Growing food locally makes a city more resilient. Home Grown shows what a patch of city could grow, from a backyard to an empty car park, anywhere in the world."
    asideLabel="Questions it answers for your plot"
>
    {#snippet aside()}
        <ol class="m-0 list-none overflow-hidden rounded-card border border-line-strong bg-surface p-0">
            {#each QUESTIONS as question, i (question)}
                <li class="flex items-center gap-5 px-4 py-3 text-[15px] {i ? 'border-t border-line' : ''}">
                    <span class="font-mono text-[11px] text-ink-muted">{pad(i)}</span>{question}
                </li>
            {/each}
        </ol>
    {/snippet}
</LearnSection>

<LearnSection label="02" title="The team">
    <ul class="m-0 mt-3 grid list-none grid-cols-2 border-t border-l border-line-strong p-0 md:grid-cols-3 lg:grid-cols-6">
        {#each TEAM as person (person.name)}
            <li class="flex flex-col gap-1 border-r border-b border-line-strong p-3">
                <img src={person.photo} alt="" loading="lazy" class="mb-2 aspect-[4/5] w-full rounded-sm object-cover grayscale-[30%]" />
                <span class="text-[15px] font-medium">{person.name}</span>
                <span class="text-[13px] text-ink-muted">{person.role}</span>
                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" class="mt-1 font-mono text-xs text-ink">
                    LinkedIn <span aria-hidden="true">↗</span><span class="sr-only">: {person.name} (opens in a new tab)</span>
                </a>
            </li>
        {/each}
    </ul>
</LearnSection>

<LearnSection id="recognition" label="03" title="Recognition" body="Where Home Grown has been shown, and what it won.">
    {#snippet aside()}
        <div class="on-ink flex gap-4 rounded-card bg-ink p-5 text-paper">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                <img src={laurel} alt="" width="26" height="26" />
            </span>
            <span class="flex flex-col gap-1.5">
                <span class="font-mono text-xs tracking-[0.1em] text-bright uppercase">{RECOGNITION_FEATURED.eyebrow}</span>
                <span class="text-xl leading-snug">{RECOGNITION_FEATURED.title}</span>
                <span class="text-[13px] text-paper/75">{RECOGNITION_FEATURED.where}</span>
                <span class="mt-1 text-[13px] leading-relaxed text-paper/90">{RECOGNITION_FEATURED.body}</span>
            </span>
        </div>
        {#each RECOGNITION as item (item.title)}
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

<LearnSection label="04" title="Get in touch" body="Planning a garden project, writing about urban food, or want to try Home Grown in your city?">
    {#snippet aside()}
        <div class="grid gap-2.5 sm:grid-cols-2">
            {#each CONTACT as item (item.title)}
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
