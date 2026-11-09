<script lang="ts">
    import { SDGS } from "./content";
</script>

<section class="border-t border-line px-5 py-8 md:px-10 md:py-10" aria-label="Sustainable Development Goals">
    <ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
        {#each SDGS as goal (goal.n)}
            <li class="flex flex-col gap-3 rounded-card border border-line-strong bg-surface p-4">
                <span class="flex items-baseline gap-2">
                    <span class="font-mono text-[11px] text-ink-muted">SDG</span>
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
        The UN Sustainable Development Goals are 17 targets every UN member agreed to reach by 2030.
        Read more at the <a href="https://sdgs.un.org/goals" target="_blank" rel="noopener noreferrer" class="text-ink">UN</a>.
    </p>
</section>
