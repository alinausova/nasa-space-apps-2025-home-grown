<script lang="ts">
    import { i18n } from "../../i18n/locale.svelte";
    import Icon from "../../ui/Icon.svelte";

    let { reason }: { reason: "denied" | "unavailable" } = $props();
</script>

<div
    role="alert"
    class="flex gap-3 rounded-[14px] border-[1.5px] border-dashed border-warn-border bg-warn px-4 py-3.5 text-[#6B3D05]"
    data-testid="location-notice"
>
    <span class="mt-0.5 shrink-0 text-warn-ink"><Icon name="locationOff" size={20} /></span>
    <div class="flex flex-col gap-1">
        {#if reason === "denied"}
            <span class="text-[15px] font-semibold text-warn-ink">{i18n.m.place.location.deniedTitle}</span>
            <span class="text-sm leading-relaxed">
                {i18n.m.place.location.deniedBody}
            </span>
        {:else}
            <span class="text-[15px] font-semibold text-warn-ink">{i18n.m.place.location.unavailableTitle}</span>
            <span class="text-sm leading-relaxed">{i18n.m.place.location.unavailableBody}</span>
        {/if}
    </div>
</div>
