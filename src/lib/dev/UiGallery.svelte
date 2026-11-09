<script lang="ts">
    // Dev-only page (/dev/ui) for checking primitives against design-handoff/screens.
    import Button from "../ui/Button.svelte";
    import Card from "../ui/Card.svelte";
    import Chip from "../ui/Chip.svelte";
    import Collapsible from "../ui/Collapsible.svelte";
    import FactorBar from "../ui/FactorBar.svelte";
    import Notice from "../ui/Notice.svelte";
    import PauseButton from "../ui/PauseButton.svelte";
    import ScoreDot from "../ui/ScoreDot.svelte";
    import ScorePill from "../ui/ScorePill.svelte";
    import ScoreRing from "../ui/ScoreRing.svelte";
    import StepLabel from "../ui/StepLabel.svelte";
    import Tag from "../ui/Tag.svelte";
    import WaterPill from "../ui/WaterPill.svelte";
    import { FACTORS } from "../derive/score";

    const rows = [
        { name: "Kale", season: "Cool season", score: 92, water: 0, scores: { gdd: 95, sunlight: 88, temperature: 94, water: 90 } },
        { name: "Peas", season: "Cool season", score: 81, water: 0, scores: { gdd: 86, sunlight: 77, temperature: 85, water: 78 } },
        { name: "Beans", season: "Warm season", score: 72, water: 85, scores: { gdd: 74, sunlight: 70, temperature: 76, water: 66 } },
        { name: "Squash", season: "Warm season", score: 58, water: 140, scores: { gdd: 60, sunlight: 62, temperature: 55, water: 50 } },
        { name: "Rice", season: "Warm season", score: 31, water: 600, scores: { gdd: 30, sunlight: 40, temperature: 25, water: 20 } },
    ];
    const rings = [95, 88, 94, 90];

    let filter = $state("all");
    let playing = $state(true);
    let climateOpen = $state(true);
</script>

<main class="theme-leaf min-h-screen">
    <div class="mx-auto flex max-w-[600px] flex-col gap-10 px-8 py-10">
        <StepLabel step={2} label="Draw your plot">
            <h1 class="m-0 text-[38px] leading-[1.1] font-normal tracking-[-0.02em]">UI primitives</h1>
            <p class="m-0 text-[15px] leading-relaxed text-ink-muted">Leaf theme. Compare with design-handoff/screens.</p>
        </StepLabel>

        <section class="flex flex-col gap-3">
            <h2 class="text-[17px] font-medium">Buttons</h2>
            <div class="flex flex-wrap items-center gap-2.5">
                <Button size="lg">Analyse this plot <span aria-hidden="true">→</span></Button>
                <Button size="lg" disabled>Analyse this plot</Button>
                <Button variant="outline">Cancel</Button>
                <Button variant="outline" size="sm">Export PDF</Button>
                <Button variant="ghost">How it works</Button>
            </div>
        </section>

        <section class="flex flex-col gap-3">
            <h2 class="text-[17px] font-medium">Chips and tags</h2>
            <div class="flex flex-wrap gap-2">
                {#each [["all", "All 18"], ["cool", "Cool season"], ["warm", "Warm season"], ["dry", "No irrigation"]] as [id, label] (id)}
                    <Chip selected={filter === id} onclick={() => (filter = id)}>{label}</Chip>
                {/each}
            </div>
            <div class="flex flex-wrap gap-2"><Tag>Cool season</Tag><Tag>Survives freezing</Tag></div>
        </section>

        <section class="flex flex-col">
            <div class="flex justify-between pb-2 text-[13px] text-ink-muted">
                <span>Ranked crops</span>
                <span class="flex flex-wrap gap-2.5">
                    {#each FACTORS as f (f.key)}
                        <span class="flex items-center gap-[5px]"><span class="block size-2.5 rounded-[3px]" style:background={f.color}></span>{f.short}</span>
                    {/each}
                </span>
            </div>
            {#each rows as r (r.name)}
                <div class="grid grid-cols-[16px_minmax(0,1fr)_76px_40px] grid-rows-[auto_auto] items-center gap-x-3 gap-y-1 border-t border-line py-3">
                    <span class="row-span-2 flex"><ScoreDot score={r.score} /></span>
                    <span class="col-start-2 row-start-1 text-[19px] leading-tight font-semibold tracking-[-0.01em]">{r.name}</span>
                    <span class="col-start-3 row-span-2 row-start-1"><FactorBar scores={r.scores} /></span>
                    <span class="col-start-4 row-span-2 row-start-1 grid"><ScorePill score={r.score} /></span>
                    <span class="col-start-2 row-start-2 flex items-center gap-1.5 whitespace-nowrap">
                        <span class="text-xs text-ink-muted">{r.season}</span>
                        {#if r.water > 0}<span aria-hidden="true" class="text-xs text-ink-muted">·</span><WaterPill mm={r.water} />{/if}
                    </span>
                </div>
            {/each}
        </section>

        <section class="flex flex-col gap-3.5">
            <h2 class="text-[17px] font-medium">Why it scores 92</h2>
            <div class="grid grid-cols-4 gap-2.5">
                {#each FACTORS as f, i (f.key)}
                    <span class="flex flex-col items-center gap-2 text-center">
                        <ScoreRing value={rings[i]} color={f.color} label={f.label} />
                        <span class="inline-flex items-center gap-1.5 text-[13px] font-medium"><span class="size-[9px] rounded-[3px]" style:background={f.color}></span>{f.label}</span>
                    </span>
                {/each}
            </div>
        </section>

        <Collapsible title="Climate at this plot" subtitle="NASA POWER · 2025" bind:open={climateOpen}>
            <p class="text-sm text-ink-muted">Chart goes here (PR 5).</p>
        </Collapsible>

        <Card class="flex flex-col gap-3.5">
            <span class="flex items-baseline justify-between">
                <span class="text-[13px] font-semibold text-warn-ink">Plot too large</span>
                <span class="font-mono text-xs text-ink-muted">5 corners</span>
            </span>
            <span class="font-mono text-[34px] tracking-[-0.02em] text-warn-ink">1.42 km²</span>
        </Card>

        <Notice title="We could not see where you are">
            Location is switched off for this site. Type an address above instead.
        </Notice>

        <div class="flex items-center gap-3">
            <PauseButton bind:playing />
            <span class="text-sm text-ink-muted">{playing ? "Playing" : "Paused"}</span>
        </div>
    </div>

    <div class="theme-stone bg-furrows-stone px-8 py-10">
        <p class="mx-auto max-w-[600px]">Stone theme on stone furrows.</p>
    </div>
    <div class="theme-night px-8 py-10">
        <p class="mx-auto max-w-[600px]">Night theme. <Button size="lg">Pick a spot on Earth</Button></p>
    </div>
    <div class="bg-furrows h-40"></div>
    <div class="bg-geo-lines h-40 bg-paper"></div>
</main>
