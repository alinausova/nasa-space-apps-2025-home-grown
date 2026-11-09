<script lang="ts">
    import { learn } from "./content";

    let c = $derived(learn());
</script>

<section class="border-t border-line" aria-label={c.UI.impact.label}>
    <div class="mx-auto max-w-[1156px] px-5 py-8 md:px-10 md:py-10">
        <ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
            {#each c.SDGS as goal (goal.n)}
                <li class="flex flex-col gap-3 rounded-card border border-line-strong bg-surface p-4">
                    <span class="flex items-baseline gap-2">
                        <span class="font-mono text-[11px] text-ink-muted">{c.UI.impact.sdg}</span>
                        <span class="font-mono text-3xl">{goal.n}</span>
                    </span>
                    <span class="text-[17px] font-medium leading-snug">{goal.title}</span>
                    <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
                        {#each goal.points as point (point)}
                            <li class="rounded-full border border-line-strong px-2.5 py-0.5 text-xs">{point}</li>
                        {/each}
                    </ul>
                    <span class="text-[13px] leading-relaxed text-ink-muted">{goal.body}</span>
                </li>
            {/each}
        </ul>
        <p class="m-0 mt-6 max-w-[640px] text-[13px] text-ink-muted">
            {c.UI.impact.footnote}
            {c.UI.impact.readMore} <a href="https://sdgs.un.org/goals" target="_blank" rel="noopener noreferrer" class="text-ink underline underline-offset-2">{c.UI.impact.un}</a>.
        </p>
    </div>
</section>
