<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import Icon from "../../ui/Icon.svelte";
    import StepLabel from "../../ui/StepLabel.svelte";
    import AreaMeter from "./AreaMeter.svelte";
    import SampleCities from "../place/SampleCities.svelte";
    import type { Plot } from "../../state/journey.svelte";
    import type { SampleCity } from "../../data/cities";

    let {
        plot,
        tooLarge,
        selectedCity,
        onpick,
        onBack,
    }: {
        plot: Plot | null;
        tooLarge: boolean;
        selectedCity: string | null;
        onpick: (city: SampleCity) => void;
        /** Back to step 01. Desktop only: on mobile the round button over the map does this. */
        onBack?: () => void;
    } = $props();

    let corners = $derived(plot?.corners ?? 0);
</script>

<div class="flex flex-col gap-3 md:gap-6">
    {#if onBack}
        <button
            type="button"
            onclick={onBack}
            class="-mt-2 -mb-2 hidden items-center gap-1.5 self-start rounded-full py-1 pr-2 text-sm text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:inline-flex"
        >
            <Icon name="back" size={16} /> {i18n.m.draw.backToPlace}
        </button>
    {/if}
    <div class="hidden md:block">
        <StepLabel step={2} label={i18n.m.draw.step}>
            <h1 class="m-0 text-[38px] leading-[1.1] font-normal tracking-[-0.02em]">{i18n.m.draw.title}</h1>
            <p class="m-0 text-[15px] leading-relaxed text-ink-muted">{i18n.m.draw.intro}</p>
        </StepLabel>
    </div>

    <h1 class="m-0 font-mono text-xs font-normal text-ink-muted md:hidden">
        02 / {i18n.m.draw.step}{corners > 0 ? ` · ${i18n.m.draw.corners(corners)}` : ""}
    </h1>

    <section class="hidden flex-col gap-2.5 md:flex" aria-label={i18n.m.place.jumpToSample}>
        <SampleCities variant="chips" selected={selectedCity} {onpick} />
    </section>

    <AreaMeter {plot} {tooLarge} />
</div>
