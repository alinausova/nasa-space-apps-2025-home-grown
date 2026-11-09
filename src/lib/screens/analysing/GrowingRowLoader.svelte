<script lang="ts">
    import { onMount } from "svelte";
    import loaderSvg from "../../../assets/loader-growing-row.svg?raw";
    import PauseButton from "../../ui/PauseButton.svelte";

    // Five crops sprout one after another (SMIL, ~7.5 s loop). Inlined so it can be paused.
    // Reduced motion: start paused on a frame where the row is mostly grown.
    const STILL_FRAME_S = 6.2;

    let host: HTMLDivElement;
    let playing = $state(true);

    function svg(): SVGSVGElement | null {
        return host?.querySelector("svg") ?? null;
    }

    onMount(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            svg()?.setCurrentTime(STILL_FRAME_S);
            playing = false;
        }
    });

    $effect(() => {
        const el = svg();
        if (!el) return;
        if (playing) el.unpauseAnimations();
        else el.pauseAnimations();
    });
</script>

<div class="relative rounded-card border border-line bg-surface px-3.5 pt-2 pb-0.5" data-testid="loader" data-playing={playing}>
    <!-- Own asset, inlined for SMIL control. -->
    <div bind:this={host} class="[&_svg]:mx-auto">{@html loaderSvg}</div>
    <div class="absolute top-2.5 right-2.5">
        <PauseButton bind:playing />
    </div>
</div>
