<script lang="ts">
    import { onMount } from "svelte";
    import MapLayer from "./lib/MapLayer.svelte";
    import LearnMore from "./lib/LearnMore.svelte";

    let currentPath = $state(window.location.pathname);

    onMount(() => {
        const handleNavigation = () => {
            currentPath = window.location.pathname;
        };

        window.addEventListener("popstate", handleNavigation);

        // Intercept link clicks
        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a");

            if (link && link.href && link.target !== "_blank") {
                const url = new URL(link.href);
                if (url.origin === window.location.origin && url.pathname.startsWith("/nasa-space-apps-2025-home-grown")) {
                    e.preventDefault();
                    window.history.pushState({}, "", url.pathname);
                    currentPath = url.pathname;
                }
            }
        });

        return () => {
            window.removeEventListener("popstate", handleNavigation);
        };
    });

    $effect(() => {
        currentPath = window.location.pathname;
    });
</script>

{#if currentPath === "/nasa-space-apps-2025-home-grown/learn-more"}
    <LearnMore />
{:else}
    <MapLayer />
{/if}
