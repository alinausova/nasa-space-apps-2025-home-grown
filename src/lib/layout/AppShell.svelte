<script lang="ts" module>
    export type SheetSize = "low" | "mid" | "high";
</script>

<script lang="ts">
    import type { Snippet } from "svelte";
    import Logo from "./Logo.svelte";
    import MapView from "../map/MapView.svelte";

    // Desktop: sidebar + map panel on furrow texture. Mobile (< md): map full screen, sidebar becomes a bottom sheet.
    let {
        wide = false,
        sheet = "mid",
        headerAction,
        children,
        footer,
        mapOverlay,
    }: {
        wide?: boolean;
        /** Preferred mobile sheet height for the current screen; the user can drag between sizes. */
        sheet?: SheetSize;
        headerAction?: Snippet;
        children: Snippet;
        footer?: Snippet;
        mapOverlay?: Snippet;
    } = $props();

    const SIZES: SheetSize[] = ["low", "mid", "high"];
    const HEIGHT: Record<SheetSize, string> = { low: "34dvh", mid: "62dvh", high: "92dvh" };

    let size = $state<SheetSize>("mid");
    let dragOffset = $state(0);
    let dragStart: number | null = null;

    $effect.pre(() => {
        size = sheet;
    });

    function step(direction: 1 | -1): void {
        const next = SIZES[Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(size) + direction))];
        size = next;
    }

    function onPointerDown(event: PointerEvent): void {
        dragStart = event.clientY;
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent): void {
        if (dragStart !== null) dragOffset = event.clientY - dragStart;
    }

    function onPointerUp(): void {
        if (dragStart === null) return;
        if (dragOffset < -40) step(1);
        else if (dragOffset > 40) step(-1);
        else size = size === "high" ? sheet : "high";
        dragStart = null;
        dragOffset = 0;
    }

    function onHandleKey(event: KeyboardEvent): void {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            step(1);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            step(-1);
        }
    }
</script>

<div class="theme-leaf relative h-dvh w-full overflow-hidden md:flex">
    <section class="absolute inset-0 md:relative md:order-2 md:flex md:min-w-0 md:flex-1 md:bg-furrows md:p-5" aria-label="Map">
        <div class="relative h-full w-full overflow-hidden bg-surface md:rounded-panel md:border md:border-ink">
            <MapView />
            {#if mapOverlay}{@render mapOverlay()}{/if}
        </div>
    </section>

    <aside
        class="absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-[28px] border-t border-ink bg-paper
            transition-[height] duration-300 ease-out
            md:relative md:inset-auto md:order-1 md:h-full! md:w-[400px] md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:border-line md:transition-none
            {wide ? 'lg:w-[540px]' : 'lg:w-[480px]'}"
        style:height="calc({HEIGHT[size]} - {dragOffset}px)"
        data-sheet={size}
    >
        <button
            type="button"
            class="flex h-7 w-full shrink-0 touch-none items-center justify-center md:hidden"
            aria-label={size === "high" ? "Collapse panel" : "Expand panel"}
            onpointerdown={onPointerDown}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
            onpointercancel={onPointerUp}
            onkeydown={onHandleKey}
        >
            <span class="block h-1.5 w-12 rounded-full bg-ink/40"></span>
        </button>

        <header class="hidden shrink-0 items-center justify-between border-b border-line px-8 py-4 md:flex">
            <Logo />
            {#if headerAction}{@render headerAction()}{/if}
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6 md:px-8 md:py-8">
            {@render children()}
        </div>

        {#if footer}
            <div class="flex shrink-0 gap-2.5 px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:border-t md:border-line md:px-8 md:pt-5 md:pb-7">
                {@render footer()}
            </div>
        {/if}
    </aside>
</div>
