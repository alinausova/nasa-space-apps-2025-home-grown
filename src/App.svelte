<script lang="ts">
    import { onMount } from "svelte";
    import MapLayer from "./lib/MapLayer.svelte";
    import LearnMore from "./lib/LearnMore.svelte";
    import { checkHealth } from "./lib/api";

    let currentPath = $state(window.location.pathname);

    onMount(() => {
        // Wake up the backend server (Render free tier)
        checkHealth().catch(() => {
            // Silently ignore errors - we just want to wake up the server
        });

        // Handle GitHub Pages 404 redirect
        const query = window.location.search;
        if (query.startsWith('?/')) {
            const path = query.slice(2).replace(/~and~/g, '&');
            const fullPath = '/nasa-space-apps-2025-home-grown/' + path;
            window.history.replaceState({}, '', fullPath);
            currentPath = fullPath;
        }

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
