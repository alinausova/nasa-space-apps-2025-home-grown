<script lang="ts">
    import type { Snippet } from "svelte";
    import Button from "../../ui/Button.svelte";
    import Logo from "../../layout/Logo.svelte";
    import { learn, TAB_ORDER } from "./content";
    import { router } from "../../router/router.svelte";
    import type { LearnTab } from "../../router/paths";

    let c = $derived(learn());

    let { tab, children }: { tab: LearnTab; children: Snippet } = $props();

    let info = $derived(c.TAB_INFO[tab]);
    let next = $derived(TAB_ORDER[TAB_ORDER.indexOf(tab) + 1] ?? null);
</script>

<div class="theme-stone min-h-dvh">
    <div class="sticky top-0 z-20 bg-paper/95 backdrop-blur-sm">
        <header class="mx-auto flex max-w-[1156px] items-center justify-between px-5 py-3 md:px-10">
            <Logo size="sm" />
            <Button href={router.href({ name: "app" })} size="sm" class="font-semibold">{c.UI.layout.openMap}</Button>
        </header>
        <nav class="overflow-x-auto border-y border-line" aria-label={c.UI.layout.nav}>
            <ul class="m-0 mx-auto flex max-w-[1156px] list-none gap-6 px-5 py-0 whitespace-nowrap md:px-10">
                {#each TAB_ORDER as key (key)}
                    <li>
                        <a
                            href={router.href({ name: "learn", tab: key })}
                            aria-current={key === tab ? "page" : undefined}
                            class="-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 text-sm text-ink no-underline
                                {key === tab ? 'border-ink font-semibold' : 'border-transparent hover:border-line-strong'}"
                        >
                            <span class="font-mono text-[11px] text-ink-muted">{c.TAB_INFO[key].n}</span>{c.TAB_INFO[key].label}
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>
    </div>

    <main>
        <div class="relative overflow-hidden">
            <!-- Map sketch behind the hero, as in the design. -->
            <svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1156 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <g stroke="#2F3336" stroke-opacity="0.08" fill="none">
                    <path d="M0 30 L1156 12" stroke-width="10" />
                    <path d="M0 110 L1156 90" stroke-width="3" />
                    <path d="M0 205 L1156 190" stroke-width="3" />
                    <path d="M255 0 L262 280" stroke-width="3" />
                    <path d="M525 0 L540 280" stroke-width="8" />
                    <path d="M890 0 L905 280" stroke-width="8" />
                    <path d="M1030 0 L1040 280" stroke-width="3" />
                </g>
                <path d="M780 92 L870 82 L875 160 L830 200 L785 194 Z" class="hidden md:block" fill="none" stroke="#2F3336" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="6 5" />
            </svg>
            <div class="relative mx-auto flex max-w-[1156px] flex-col gap-3 px-5 py-12 md:px-10 md:py-16">
                <span class="font-mono text-xs tracking-[0.12em] text-ink-muted uppercase">{c.UI.layout.eyebrow(info.n)}</span>
                <h1 class="m-0 max-w-[900px] text-[38px] leading-[1.05] font-normal tracking-[-0.025em] md:text-[56px]">{info.title}</h1>
                <p class="m-0 max-w-[520px] text-base leading-relaxed text-ink-muted md:text-[17px]">{info.intro}</p>
            </div>
        </div>

        {@render children()}

        <div class="border-t border-line">
            <div class="mx-auto flex max-w-[1156px] flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-10">
                {#if next}
                    <a href={router.href({ name: "learn", tab: next })} class="text-xl text-ink no-underline hover:underline md:text-[22px]">
                        {c.UI.layout.next(c.TAB_INFO[next].label)} <span aria-hidden="true">→</span>
                    </a>
                {:else}
                    <span></span>
                {/if}
                <Button href={router.href({ name: "app" })}>{c.UI.layout.drawPlot}</Button>
            </div>
        </div>
    </main>
</div>
