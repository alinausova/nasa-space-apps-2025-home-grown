<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
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
    <StepLabel step={1} label={i18n.m.place.step}>
        <h1 class="m-0 text-[34px] leading-[1.1] font-normal tracking-[-0.02em] md:text-[38px]">{i18n.m.place.title}</h1>
        <p class="m-0 hidden text-[15px] leading-relaxed text-ink-muted md:block">
            {i18n.m.place.intro}
        </p>
    </StepLabel>

    <div class="flex flex-col gap-3">
        <SearchBox onpick={place} onlocate={locate} {proximity} highlight={refused !== null} {locating} bind:input />
        {#if refused}<LocationNotice reason={refused} />{/if}
    </div>

    <section class="flex flex-col gap-2.5" aria-labelledby="sample-climates">
        <span id="sample-climates" class="text-[13px] text-ink-muted">{i18n.m.place.samples}</span>
        <SampleCities {selected} onpick={city} />
    </section>
</div>
