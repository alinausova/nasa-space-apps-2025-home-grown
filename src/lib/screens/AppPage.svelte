<script lang="ts">
    import AppShell, { type SheetSize } from "../layout/AppShell.svelte";
    import Button from "../ui/Button.svelte";
    import StepLabel from "../ui/StepLabel.svelte";
    import { journey, type Step } from "../state/journey.svelte";
    import { mapController } from "../map/controller.svelte";
    import { router } from "../router/router.svelte";

    // Placeholder screens; replaced by the real Place/Draw/Analysing/Results/Crop screens in later PRs.
    const SCREEN: Record<Step, { n: number; label: string; title: string; sheet: SheetSize; wide?: boolean }> = {
        place: { n: 1, label: "Pick a place", title: "Where do you want to grow?", sheet: "mid" },
        draw: { n: 2, label: "Draw your plot", title: "Mark the space you want to grow on", sheet: "low" },
        analysing: { n: 3, label: "Reading your plot", title: "Checking a year of sun, heat and rain", sheet: "mid" },
        results: { n: 3, label: "What grows here", title: "Results", sheet: "mid", wide: true },
    };

    let screen = $derived(SCREEN[journey.step]);
    let cropId = $derived(router.route.name === "crop" ? router.route.id : null);

    $effect(() => {
        // Deep links to a crop need results in memory; without them, start over.
        if (cropId && !journey.results) router.navigate({ name: "app" }, { replace: true });
    });
</script>

<AppShell wide={screen.wide || cropId !== null} sheet={screen.sheet}>
    {#snippet headerAction()}
        <a href={router.href({ name: "learn", tab: "scoring" })} class="text-sm text-ink no-underline hover:underline">How it works</a>
    {/snippet}

    <StepLabel step={Math.min(screen.n, 3)} label={screen.label}>
        <h1 class="m-0 text-[30px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[38px]">{screen.title}</h1>
        <p class="m-0 text-[15px] leading-relaxed text-ink-muted">Layout preview. The real screen arrives in a later PR.</p>
    </StepLabel>

    {#snippet footer()}
        {#if journey.step === "place"}
            <Button size="lg" block onclick={() => { journey.startDrawing(); mapController.startDrawing(); }}>
                Draw your plot here <span aria-hidden="true">→</span>
            </Button>
        {:else if journey.step === "draw"}
            <Button size="lg" block disabled={!journey.canAnalyse} onclick={() => journey.analyse()}>
                Analyse this plot <span aria-hidden="true">→</span>
            </Button>
            <Button variant="outline" size="lg" onclick={() => mapController.startDrawing()}>Redraw</Button>
        {:else if journey.step === "analysing"}
            <Button variant="outline" onclick={() => journey.cancel()}>Cancel</Button>
        {:else}
            <Button variant="outline" onclick={() => { journey.newPlot(); mapController.startDrawing(); }}>New plot</Button>
        {/if}
    {/snippet}
</AppShell>
