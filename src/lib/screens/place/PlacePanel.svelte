<script lang="ts">
    import { tick } from "svelte";
    import StepLabel from "../../ui/StepLabel.svelte";
    import SampleCities from "./SampleCities.svelte";
    import SearchBox from "./SearchBox.svelte";
    import LocationNotice from "./LocationNotice.svelte";
    import type { SampleCity } from "../../data/cities";
    import type { LngLat } from "../../derive/geo";
    import type { PlaceSuggestion } from "../../derive/search";
    import type { LocateResult } from "../../geo/location";

    let {
        selected,
        onpick,
        onplace,
        onlocate,
        proximity,
    }: {
        selected: string | null;
        onpick: (city: SampleCity) => void;
        onplace: (place: PlaceSuggestion) => void;
        onlocate: () => Promise<LocateResult["status"]>;
        proximity?: () => LngLat | undefined;
    } = $props();

    let refused = $state<"denied" | "unavailable" | null>(null);
    let locating = $state(false);
    let input = $state<HTMLInputElement>();

    async function locate(): Promise<void> {
        locating = true;
        const status = await onlocate();
        locating = false;
        refused = status === "ok" ? null : status;
        if (refused) {
            await tick();
            input?.focus({ preventScroll: true });
        }
    }

    function place(suggestion: PlaceSuggestion): void {
        refused = null;
        onplace(suggestion);
    }

    function city(sample: SampleCity): void {
        refused = null;
        onpick(sample);
    }
</script>

<div class="flex flex-col gap-6">
    <StepLabel step={1} label="Pick a place">
        <h1 class="m-0 text-[34px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[38px]">Where do you want to grow?</h1>
        <p class="m-0 hidden text-[15px] leading-relaxed text-ink-muted md:block">
            Search any address, park or rooftop in the world, or start from a sample city.
        </p>
    </StepLabel>

    <div class="flex flex-col gap-3">
        <SearchBox onpick={place} onlocate={locate} {proximity} highlight={refused !== null} {locating} bind:input />
        {#if refused}<LocationNotice reason={refused} />{/if}
    </div>

    <section class="flex flex-col gap-2.5" aria-labelledby="sample-climates">
        <span id="sample-climates" class="text-[13px] text-ink-muted">Or try a sample climate</span>
        <SampleCities {selected} onpick={city} />
    </section>
</div>
