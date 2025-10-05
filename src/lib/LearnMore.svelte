<script lang="ts">
    import { onMount } from "svelte";

    onMount(() => {
        // Sync header tabs with content tabs
        const headerTabs = document.querySelectorAll('input[name="learn_tabs"]');
        const contentTabs = document.querySelectorAll('input[name="content_tabs"]');

        headerTabs.forEach((tab, index) => {
            tab.addEventListener('change', () => {
                if ((tab as HTMLInputElement).checked) {
                    (contentTabs[index] as HTMLInputElement).checked = true;
                }
            });
        });
    });
</script>

<div class="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-5">
    <div class="max-w-full mx-auto px-5">
        <!-- Header with GitHub, Title, Tabs, and Button -->
        <div class="flex justify-between items-center mb-8">
            <!-- Left side: GitHub and Title -->
            <div class="flex items-center gap-3">
                <h1 class="text-3xl font-bold text-black uppercase">Home Grown</h1>
                <a
                    href="https://github.com/alinausova/nasa-space-apps-2025-home-grown"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-8 h-8 flex items-center justify-center transition-opacity duration-200 hover:opacity-70 no-underline"
                    title="View on GitHub"
                >
                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-black">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                </a>

            </div>

            <!-- Right side: Tabs and Button -->
            <div class="flex items-center gap-4">
                <div class="tabs tabs-border max-w-6xl mx-auto">
                    <input type="radio" name="learn_tabs" class="tab" aria-label="Data Infrastructure" checked="checked" />
                    <input type="radio" name="learn_tabs" class="tab" aria-label="NASA Data" />
                    <input type="radio" name="learn_tabs" class="tab" aria-label="Impact" />
                </div>

                <a href="/nasa-space-apps-2025-home-grown/" class="btn bg-black text-white font-semibold whitespace-nowrap">
                    Go to Interactive Map
                </a>
            </div>
        </div>

        <!-- Tab Content -->
        <div class="tabs tabs-border max-w-6xl mx-auto">
            <input type="radio" name="content_tabs" class="tab " aria-label="Data Infrastructure" checked="checked" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                <h2 class="text-3xl font-bold text-black mb-6">Data Infrastructure</h2>
                <div class="mb-6">
                    <p class="text-gray-700 mb-4">
                        Our platform integrates multiple data sources to provide accurate crop recommendations including NASA's POWER API for climate data, temperature analysis, and precipitation patterns.
                    </p>
                    <p class="text-gray-700 mb-4">
                        We analyze historical climate data to provide you with accurate growing season information and crop suitability recommendations tailored to your specific location.
                    </p>
                </div>
            </div>

            <input type="radio" name="content_tabs" class="tab" aria-label="NASA Data" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                <h2 class="text-3xl font-bold text-black mb-6">NASA Data</h2>
                <p class="text-gray-700 mb-4">
                    We leverage various NASA datasets to provide accurate climate and environmental data:
                </p>
                <div class="overflow-x-auto">
                    <table class="table table-zebra">
                        <thead>
                            <tr>
                                <th>Dataset</th>
                                <th>Description</th>
                                <th>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>POWER API</td>
                                <td>Climate data including temperature, precipitation, and solar radiation</td>
                                <td>NASA POWER</td>
                            </tr>
                            <tr>
                                <td>Temperature Data</td>
                                <td>Monthly average temperatures for growing season analysis</td>
                                <td>NASA POWER</td>
                            </tr>
                            <tr>
                                <td>Precipitation Data</td>
                                <td>Rainfall patterns and water availability</td>
                                <td>NASA POWER</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <input type="radio" name="content_tabs" class="tab" aria-label="Impact" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                <h2 class="text-3xl font-bold text-black mb-6">Impact</h2>
                <div class="prose prose-lg text-gray-700">
                    <p class="mb-4">
                        [Impact text to be provided]
                    </p>
                    <p class="mb-4">
                        Urban agriculture and local food production can have transformative effects on cities:
                    </p>
                    <ul class="list-disc pl-6 mb-4">
                        <li>Increased food security and resilience</li>
                        <li>Reduced carbon footprint from food transportation</li>
                        <li>Enhanced community engagement and education</li>
                        <li>Improved urban biodiversity</li>
                        <li>Economic opportunities for local communities</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .glassmorphism-tabs {
        backdrop-filter: blur(8px) saturate(110%);
        -webkit-backdrop-filter: blur(8px) saturate(110%);
        background: rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0px 2px 8px 0 rgba(0, 0, 0, 0.1),
                    inset 0px 0px 2px 1px rgba(255, 255, 255, 0.3);
        border-radius: 0.5rem;
    }

    .glassmorphism-button {
        backdrop-filter: blur(8px) saturate(110%);
        -webkit-backdrop-filter: blur(8px) saturate(110%);
        background: rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0px 2px 8px 0 rgba(0, 0, 0, 0.1),
                    inset 0px 0px 2px 1px rgba(255, 255, 255, 0.3);
    }

    .glassmorphism-button:hover {
        background: rgba(255, 255, 255, 0.4);
    }
</style>
