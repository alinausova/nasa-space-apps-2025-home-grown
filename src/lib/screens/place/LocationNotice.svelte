<script lang="ts">
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
            <span class="text-[15px] font-semibold text-warn-ink">We could not see where you are</span>
            <span class="text-sm leading-relaxed">
                Location is switched off for this site. Type an address above instead. You can turn location on later in your browser settings.
            </span>
        {:else}
            <span class="text-[15px] font-semibold text-warn-ink">We could not find your location</span>
            <span class="text-sm leading-relaxed">Your browser did not give us a position in time. Type an address above instead.</span>
        {/if}
    </div>
</div>
