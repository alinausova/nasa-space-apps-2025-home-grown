<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import { inSentence } from "../../i18n/format";
    import type { CropCalendar } from "../../api/types";
    import { calendarRows, calendarSentence } from "../../derive/calendar";

    let { calendar, cropName, year }: { calendar: CropCalendar | null; cropName: string; year: number } = $props();

    const LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    const COLOR = { sow: "var(--hg-ink)", grow: "var(--hg-bright)", harvest: "var(--hg-harvest)" };

    let rows = $derived(calendar ? calendarRows(calendar) : []);
</script>

<section class="flex flex-col gap-3.5 border-t border-line pt-6" aria-labelledby="when-to-grow" data-testid="grow-calendar">
    <h2 id="when-to-grow" class="m-0 text-[19px] font-medium md:text-[22px]">{i18n.m.crop.calendarTitle}</h2>
    {#if calendar}
        <p class="sr-only">{calendarSentence(calendar)}</p>
        <div class="grid grid-cols-[4.5rem_repeat(12,minmax(0,1fr))] items-center gap-x-1 gap-y-1.5" aria-hidden="true">
            <span></span>
            {#each LETTERS as letter, i (i)}
                <span class="text-center font-mono text-[11px] text-ink-muted">{letter}</span>
            {/each}
            {#each rows as row (row.key)}
                <span class="text-[13px] text-ink-muted md:text-sm">{row.label}</span>
                {#each row.months as on, i (i)}
                    <span
                        class="h-6 rounded-[4px] {on ? '' : 'bg-ink/10'}"
                        style:background={on ? COLOR[row.key] : undefined}
                        data-on={on || undefined}
                        data-row={row.key}
                    ></span>
                {/each}
            {/each}
        </div>
        <p class="m-0 text-[13px] leading-relaxed text-ink-muted">
            {#if calendar.mode === "plant"}
                {i18n.m.crop.calendarPlant(year)}
            {:else if calendar.mode === "plant_out"}
                {i18n.m.crop.calendarPlantOut(year)}
            {:else}
                {i18n.m.crop.calendarSow(year)}
            {/if}
        </p>
    {:else}
        <p class="m-0 text-[15px] leading-relaxed text-ink-muted">
            {i18n.m.crop.calendarNone(inSentence(cropName), year)}
        </p>
    {/if}
</section>
