<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import { lower } from "../../i18n/format";
    import LeafLabel from "../../ui/LeafLabel.svelte";
    import type { TipsState } from "../../state/journey.svelte";
    import { paragraphs } from "../../derive/text";

    let { cropName, tips, onask }: { cropName: string; tips: TipsState | undefined; onask: () => void } = $props();

    let status = $derived(tips?.status ?? "idle");
    let blocks = $derived(tips?.status === "done" ? paragraphs(tips.text) : []);
</script>

<section class="flex flex-col gap-3 border-t border-line pt-6" aria-label={i18n.m.crop.tipsLabel(cropName)} data-testid="crop-tips">
    {#if status === "idle" || status === "failed"}
        <button
            type="button"
            onclick={onask}
            class="self-end rounded-full border border-ink bg-surface px-5 py-2.5 text-[17px] text-ink hover:bg-selected focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
            {status === "failed" ? i18n.m.crop.askAgain : i18n.m.crop.askTips(lower(cropName))}
        </button>
    {/if}

    <div class="flex flex-col gap-2" role="status" aria-live="polite">
        {#if status === "loading"}
            <LeafLabel />
            <p class="m-0 text-[15px] text-ink-muted">{i18n.m.crop.writingTips(lower(cropName))}</p>
            <span class="block h-3 w-11/12 animate-pulse rounded bg-ink/8 motion-reduce:animate-none" aria-hidden="true"></span>
            <span class="block h-3 w-3/4 animate-pulse rounded bg-ink/8 motion-reduce:animate-none" aria-hidden="true"></span>
        {:else if status === "failed"}
            <p class="m-0 text-[15px] text-ink-muted">{i18n.m.crop.tipsUnavailable}</p>
        {:else if blocks.length > 0}
            <LeafLabel />
            {#each blocks as block, i (i)}
                <p class="m-0 text-base leading-relaxed md:text-[17px]">
                    {#each block as segment, j (j)}{#if segment.bold}<strong class="font-semibold">{segment.text}</strong>{:else}{segment.text}{/if}{/each}
                </p>
            {/each}
            <span class="text-xs text-ink-muted">{i18n.m.crop.tipsDisclaimer}</span>
        {/if}
    </div>
</section>
