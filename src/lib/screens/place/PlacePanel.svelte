<script lang="ts">
    import StepLabel from "../../ui/StepLabel.svelte";
    import SampleCities from "./SampleCities.svelte";
    import type { SampleCity } from "../../data/cities";

    let { selected, onpick }: { selected: string | null; onpick: (city: SampleCity) => void } = $props();
</script>

<div class="flex flex-col gap-6">
    <StepLabel step={1} label="Pick a place">
        <h1 class="m-0 text-[34px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[38px]">Where do you want to grow?</h1>
        <p class="m-0 hidden text-[15px] leading-relaxed text-ink-muted md:block">
            Move the map to any rooftop, yard or empty lot in the world, or start from a sample climate.
        </p>
    </StepLabel>

    <!-- TODO(redesign v3): address search with suggestions and "Use my location" goes here. -->

    <section class="flex flex-col gap-2.5" aria-labelledby="sample-climates">
        <span id="sample-climates" class="text-[13px] text-ink-muted">Try a sample climate</span>
        <SampleCities {selected} {onpick} />
    </section>
</div>
