<script lang="ts">
    import { onMount } from "svelte";
    import orbitDesktop from "../../../assets/landing-orbit.svg?raw";
    import orbitMobile from "../../../assets/landing-orbit-mobile.svg?raw";
    import AwardBadge from "./AwardBadge.svelte";
    import Button from "../../ui/Button.svelte";
    import { router } from "../../router/router.svelte";

    // Night sky, line globe and orbiting satellite from the design (SMIL inside the SVG).
    // One pause button stops everything; reduced motion starts paused; hidden tabs pause too.
    const WIDE = "(min-width: 1024px)";

    let host: HTMLDivElement;
    let wide = $state(window.matchMedia(WIDE).matches);
    let playing = $state(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let tabVisible = $state(document.visibilityState === "visible");

    const steps = [
        { n: "01", title: "Draw your plot", text: "Pick a spot on the map and outline it." },
        { n: "02", title: "We read satellite data", text: "And analyse a year of sun, heat and rain at your spot." },
        { n: "03", title: "Get your crops", text: "Ranked by how well they will grow there." },
    ];

    onMount(() => {
        const media = window.matchMedia(WIDE);
        const onMedia = () => (wide = media.matches);
        const onVisibility = () => (tabVisible = document.visibilityState === "visible");
        media.addEventListener("change", onMedia);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            media.removeEventListener("change", onMedia);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    });

    $effect(() => {
        void wide; // the SVG is swapped at the breakpoint; re-apply the state to the new one
        const svg = host?.querySelector("svg");
        if (!svg) return;
        if (playing && tabVisible) svg.unpauseAnimations();
        else svg.pauseAnimations();
    });
</script>

<div class="theme-night relative min-h-dvh overflow-hidden" data-testid="landing" data-playing={playing}>
    <!-- Own asset, inlined so its SMIL animations can be paused. -->
    <div bind:this={host} class="pointer-events-none absolute inset-0" aria-hidden="true">
        {@html wide ? orbitDesktop : orbitMobile}
    </div>

    <header class="relative z-10 flex items-center justify-between px-5 py-[18px] lg:px-14 lg:py-[22px]">
        <span class="flex items-center gap-2.5 text-[17px] font-semibold lg:text-[19px]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 21v-9" /><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z" /><path d="M12 14c0-3.5-2.5-6-7-6 0 3.5 2.5 6 7 6z" />
            </svg>
            Home Grown
        </span>
        <nav class="flex items-center gap-7 text-sm lg:text-[15px]" aria-label="Main">
            <a href={router.href({ name: "learn", tab: "scoring" })} class="text-ink no-underline hover:text-bright">How it works</a>
            <a href={router.href({ name: "learn", tab: "data" })} class="hidden text-ink no-underline hover:text-bright lg:inline">Data</a>
            <a href={router.href({ name: "learn", tab: "about" })} class="hidden text-ink no-underline hover:text-bright lg:inline">Team</a>
        </nav>
    </header>

    <!-- Desktop -->
    <main class="relative z-10 hidden max-w-[820px] flex-col gap-[26px] px-14 pt-16 pb-24 lg:flex">
        <span class="font-mono text-xs tracking-[0.12em] text-bright uppercase">Seen from space, grown at home</span>
        <h1 class="m-0 text-[clamp(76px,6.6vw,96px)] leading-[0.98] font-normal tracking-[-0.035em]">What could your city grow?</h1>
        <p class="m-0 max-w-[520px] text-[19px] leading-[1.55] text-ink-muted">
            Home Grown turns NASA climate data into a planting list for any roof, yard or empty lot.
        </p>
        <div class="flex gap-3">
            <Button href={router.href({ name: "app" })} size="lg" class="h-[52px]!">Pick a spot on Earth <span aria-hidden="true">→</span></Button>
            <Button href={router.href({ name: "learn", tab: "scoring" })} variant="outline" size="lg" class="h-[52px]! border-line-strong font-normal!">How it works</Button>
        </div>
        <AwardBadge />
        <ol class="m-0 grid list-none grid-cols-[repeat(3,minmax(0,200px))] gap-7 p-0 pt-6">
            {#each steps as step (step.n)}
                <li class="flex flex-col gap-1.5 border-t border-line-strong pt-3">
                    <span class="font-mono text-[13px] text-bright">{step.n}</span>
                    <span class="text-lg font-medium">{step.title}</span>
                    <span class="text-[13px] leading-[1.45] text-ink-muted">{step.text}</span>
                </li>
            {/each}
        </ol>
    </main>

    <!-- Mobile -->
    <main class="relative z-10 flex min-h-[calc(100dvh-64px)] flex-col justify-between gap-8 px-5 pt-5 pb-6 lg:hidden">
        <div class="flex flex-col gap-3.5">
            <span class="font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase">Seen from space, grown at home</span>
            <h1 class="m-0 text-[44px] leading-[1.04] font-normal tracking-[-0.025em]">What could your city grow?</h1>
            <p class="m-0 text-[15px] leading-normal text-ink-muted">Home Grown turns NASA climate data into a planting list for any roof, yard or empty lot.</p>
            <ol class="m-0 flex list-none flex-col p-0 pt-1">
                {#each steps as step (step.n)}
                    <li class="grid grid-cols-[26px_minmax(0,1fr)] gap-2.5 border-t border-line py-2.5">
                        <span class="pt-0.5 font-mono text-xs text-bright">{step.n}</span>
                        <span class="flex flex-col gap-0.5">
                            <span class="text-[15px] font-medium">{step.title}</span>
                            <span class="text-xs text-ink-muted">{step.text}</span>
                        </span>
                    </li>
                {/each}
            </ol>
        </div>
        <div class="flex flex-col gap-3">
            <AwardBadge compact />
            <Button href={router.href({ name: "app" })} size="lg" block class="h-[52px]!">Pick a spot on Earth <span aria-hidden="true">→</span></Button>
        </div>
    </main>

    <button
        type="button"
        aria-label={playing ? "Pause animation" : "Play animation"}
        aria-pressed={!playing}
        onclick={() => (playing = !playing)}
        class="absolute right-5 bottom-[150px] z-20 flex size-11 items-center justify-center rounded-full border border-ink/40 bg-paper text-ink
            hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bright
            lg:right-6 lg:bottom-6"
    >
        {#if playing}
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx="0.8" /><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8" /></svg>
        {:else}
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5z" /></svg>
        {/if}
    </button>
</div>
