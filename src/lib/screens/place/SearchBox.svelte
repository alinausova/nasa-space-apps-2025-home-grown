<script lang="ts">
    import Icon from "../../ui/Icon.svelte";
    import type { LngLat } from "../../derive/geo";
    import type { PlaceSuggestion } from "../../derive/search";
    import { searchPlaces } from "../../geo/search";

    // Address search as an ARIA combobox. "Use my location" is always the last option.
    let {
        onpick,
        onlocate,
        proximity,
        highlight = false,
        locating = false,
        input = $bindable(),
    }: {
        onpick: (place: PlaceSuggestion) => void;
        onlocate: () => void;
        proximity?: () => LngLat | undefined;
        highlight?: boolean;
        locating?: boolean;
        input?: HTMLInputElement;
    } = $props();

    const id = $props.id();
    const MIN_QUERY = 2;

    let query = $state("");
    let open = $state(false);
    let results = $state<PlaceSuggestion[]>([]);
    let status = $state<"idle" | "loading" | "error">("idle");
    let active = $state(-1);
    let root: HTMLDivElement;

    let searching = $derived(query.trim().length >= MIN_QUERY);
    let optionCount = $derived(results.length + 1);
    let locateIndex = $derived(results.length);
    let message = $derived(
        !searching
            ? ""
            : status === "loading" && results.length === 0
              ? "Searching…"
              : status === "error"
                ? "Search is not available right now. Try a sample climate below."
                : status === "idle" && results.length === 0
                  ? "No places found. Try another spelling."
                  : "",
    );

    $effect(() => {
        const q = query.trim();
        if (q.length < MIN_QUERY) {
            results = [];
            status = "idle";
            return;
        }
        status = "loading";
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            const found = await searchPlaces(q, { proximity: proximity?.(), signal: controller.signal });
            if (controller.signal.aborted) return;
            results = found ?? [];
            status = found === null ? "error" : "idle";
            active = results.length > 0 ? 0 : -1;
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    });

    function choose(index: number): void {
        open = false;
        active = -1;
        if (index === locateIndex) {
            onlocate();
            return;
        }
        const place = results[index];
        if (!place) return;
        query = place.name;
        onpick(place);
    }

    function onkeydown(event: KeyboardEvent): void {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
                open = true;
                return;
            }
            const step = event.key === "ArrowDown" ? 1 : -1;
            active = (active + step + optionCount) % optionCount;
        } else if (event.key === "Enter") {
            if (!open) return;
            event.preventDefault();
            if (active >= 0) choose(active);
            else if (results.length > 0) choose(0);
        } else if (event.key === "Escape") {
            // A search input clears itself on Escape; close the list first instead.
            event.preventDefault();
            if (open) open = false;
            else query = "";
        }
    }

    function onfocusout(event: FocusEvent): void {
        if (!root.contains(event.relatedTarget as Node | null)) open = false;
    }
</script>

<div class="flex flex-col" bind:this={root} {onfocusout} data-testid="search">
    <div
        class="flex min-h-14 items-center gap-3 border border-ink bg-surface px-5 transition-shadow
            {open ? 'rounded-t-[14px]' : 'rounded-[14px]'}
            {highlight ? 'shadow-[0_0_0_4px_color-mix(in_srgb,var(--hg-bright)_35%,transparent)]' : 'focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--hg-bright)_30%,transparent)]'}"
    >
        <span class="shrink-0 text-ink-muted"><Icon name="search" size={18} /></span>
        <input
            bind:this={input}
            bind:value={query}
            type="search"
            role="combobox"
            autocomplete="off"
            spellcheck="false"
            aria-label="Search for an address or place"
            aria-expanded={open}
            aria-controls="{id}-list"
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
            placeholder="Search an address or place"
            class="min-w-0 flex-1 bg-transparent py-3 text-[17px] text-ink outline-none placeholder:text-ink-muted/70 [&::-webkit-search-cancel-button]:hidden"
            onfocus={() => (open = true)}
            onclick={() => (open = true)}
            oninput={() => (open = true)}
            {onkeydown}
        />
    </div>

    {#if open}
        <div class="overflow-hidden rounded-b-[14px] border border-t-0 border-ink bg-surface">
            {#if message}
                <p class="m-0 border-b border-line px-5 py-3 text-[13px] text-ink-muted" role="status">{message}</p>
            {/if}
            <ul id="{id}-list" role="listbox" aria-label="Places" class="m-0 list-none p-0">
                {#each results as place, i (place.id)}
                    <!-- svelte-ignore a11y_click_events_have_key_events (keyboard is handled on the combobox input) -->
                    <li
                        id="{id}-option-{i}"
                        role="option"
                        aria-selected={active === i}
                        class="cursor-pointer border-b border-line px-5 py-3 {active === i ? 'bg-selected' : ''}"
                        onmousedown={(event) => event.preventDefault()}
                        onmousemove={() => (active = i)}
                        onclick={() => choose(i)}
                    >
                        <span class="block text-[17px] {active === i ? 'font-semibold' : ''}">{place.name}</span>
                        {#if place.detail}<span class="block text-[13px] text-ink-muted">{place.detail}</span>{/if}
                    </li>
                {/each}
                <!-- svelte-ignore a11y_click_events_have_key_events (keyboard is handled on the combobox input) -->
                <li
                    id="{id}-option-{locateIndex}"
                    role="option"
                    aria-selected={active === locateIndex}
                    class="flex cursor-pointer items-center gap-3 px-5 py-3 {active === locateIndex ? 'bg-selected' : ''}"
                    onmousedown={(event) => event.preventDefault()}
                    onmousemove={() => (active = locateIndex)}
                    onclick={() => choose(locateIndex)}
                >
                    <span class="flex flex-col">
                        <span class="text-[17px] {active === locateIndex ? 'font-semibold' : ''}">Use my location</span>
                        <span class="text-[13px] text-ink-muted">{locating ? "Finding you…" : "Your browser will ask first"}</span>
                    </span>
                </li>
            </ul>
        </div>
    {/if}
</div>
