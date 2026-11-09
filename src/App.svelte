<script lang="ts">
    import { onMount } from "svelte";
    import LearnMore from "./lib/LearnMore.svelte";
    import AppPage from "./lib/screens/AppPage.svelte";
    import Landing from "./lib/screens/landing/Landing.svelte";
    import { router } from "./lib/router/router.svelte";
    import { wakeServer } from "./lib/api/recommendations";
    import { journey } from "./lib/state/journey.svelte";
    import { mapController } from "./lib/map/controller.svelte";

    onMount(() => {
        wakeServer();
        const stop = router.start();

        if (import.meta.env.DEV) {
            // Test hook for e2e (drawing a polygon without mouse gestures).
            (window as unknown as { __hg: unknown }).__hg = { journey, map: mapController, router };
        }

        return stop;
    });

    $effect(() => {
        if (router.route.name === "not-found") router.navigate({ name: "landing" }, { replace: true });
    });
</script>

{#if router.route.name === "dev-ui" && import.meta.env.DEV}
    {#await import("./lib/dev/UiGallery.svelte") then gallery}
        <gallery.default />
    {/await}
{:else if router.route.name === "app" || router.route.name === "crop"}
    <AppPage />
{:else if router.route.name === "learn" || router.route.name === "legacy-learn"}
    <!-- TODO(redesign PR 8): new Learn more pages. -->
    <LearnMore />
{:else}
    <Landing />
{/if}
