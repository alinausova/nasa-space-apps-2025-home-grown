<script lang="ts">
    import { onMount } from "svelte";
    import LearnPage from "./lib/screens/learn/LearnPage.svelte";
    import Landing from "./lib/screens/landing/Landing.svelte";
    import { router } from "./lib/router/router.svelte";
    import { wakeServer } from "./lib/api/recommendations";

    onMount(() => {
        wakeServer();
        const stop = router.start();

        return stop;
    });

    // The page behind overscroll ("rubber band") and the mobile browser bar follow the area's theme.
    const THEME_COLOR = { night: "#0C2414", stone: "#E8E6E0", leaf: "#D9FCD4" } as const;

    $effect(() => {
        const name = router.route.name;
        const theme = name === "learn" || name === "legacy-learn" ? "stone" : name === "landing" ? "night" : "leaf";
        const root = document.documentElement;
        root.classList.remove("theme-night", "theme-stone", "theme-leaf");
        root.classList.add(`theme-${theme}`);
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
    });

    $effect(() => {
        const route = router.route;
        if (route.name === "not-found") router.navigate({ name: "landing" }, { replace: true });
        // Old links to /learn-more keep working.
        if (route.name === "legacy-learn") router.navigate({ name: "learn", tab: "about" }, { replace: true });
    });
</script>

{#if router.route.name === "dev-ui" && import.meta.env.DEV}
    {#await import("./lib/dev/UiGallery.svelte") then gallery}
        <gallery.default />
    {/await}
{:else if router.route.name === "app" || router.route.name === "crop"}
    <!-- Lazy: keeps Mapbox (most of the bundle) off the landing and Learn more pages. -->
    {#await import("./lib/screens/AppPage.svelte") then page}
        <page.default />
    {/await}
{:else if router.route.name === "learn"}
    <LearnPage tab={router.route.tab} />
{:else if router.route.name === "legacy-learn"}
    <!-- redirecting to /learn/about -->
{:else}
    <Landing />
{/if}
