<script lang="ts">
    import { tick } from "svelte";
    import LearnLayout from "./LearnLayout.svelte";
    import AboutTab from "./AboutTab.svelte";
    import ScoringTab from "./ScoringTab.svelte";
    import DataTab from "./DataTab.svelte";
    import ArchitectureTab from "./ArchitectureTab.svelte";
    import ImpactTab from "./ImpactTab.svelte";
    import type { LearnTab } from "../../router/paths";

    let { tab }: { tab: LearnTab } = $props();

    $effect(() => {
        void tab;
        // Deep links like /learn/about#recognition: scroll to the section once it is rendered.
        tick().then(() => {
            const id = window.location.hash.slice(1);
            const target = id ? document.getElementById(id) : null;
            if (target) target.scrollIntoView();
            else window.scrollTo(0, 0);
        });
    });
</script>

<LearnLayout {tab}>
    {#if tab === "about"}
        <AboutTab />
    {:else if tab === "scoring"}
        <ScoringTab />
    {:else if tab === "data"}
        <DataTab />
    {:else if tab === "architecture"}
        <ArchitectureTab />
    {:else}
        <ImpactTab />
    {/if}
</LearnLayout>
