<script lang="ts">
    import { onMount } from "svelte";
    import AboutTab from "./learn-more/AboutTab.svelte";
    import ImpactTab from "./learn-more/ImpactTab.svelte";
    import DataTab from "./learn-more/DataTab.svelte";
    import MethodologyTab from "./learn-more/MethodologyTab.svelte";
    import ArchitectureTab from "./learn-more/ArchitectureTab.svelte";

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

<div class="min-h-screen bg-[#EDE8DC] p-5">
    <div class="max-w-full mx-auto px-5">
        <!-- Header with GitHub, Title, Tabs, and Button -->
        <div class="flex justify-between items-center mb-8">
            <!-- Left side: GitHub and Title -->
            <div class="flex items-center gap-3">
                <div class="flex flex-col">
                    <h1 class="text-3xl font-bold text-black uppercase">Home Grown</h1>
                  </div>
                <a
                    href="https://github.com/alinausova/nasa-space-apps-2025-home-grown"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-8 h-8 flex items-center justify-center transition-opacity duration-200 hover:opacity-70 no-underline self-start mt-1"
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
                    <input type="radio" name="learn_tabs" class="tab" aria-label="About Us" checked="checked" />
                    <input type="radio" name="learn_tabs" class="tab" aria-label="Impact" />
                    <input type="radio" name="learn_tabs" class="tab" aria-label="Data" />
                    <input type="radio" name="learn_tabs" class="tab" aria-label="Methodology" />
                    <input type="radio" name="learn_tabs" class="tab" aria-label="Architecture" />
                    <input type="radio" name="learn_tabs" class="tab" aria-label="Media" />
                </div>

                <a href="/nasa-space-apps-2025-home-grown/" class="btn bg-black text-white font-semibold whitespace-nowrap">
                    Go to Interactive Map
                </a>
            </div>
        </div>

        <!-- Tab Content -->
        <div class="tabs tabs-border max-w-6xl mx-auto">
            <input type="radio" name="content_tabs" class="tab " aria-label="About Us" checked="checked" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                
                <AboutTab />
            </div>

            <input type="radio" name="content_tabs" class="tab " aria-label="Impact" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                <h2 class="text-3xl font-bold text-black mb-6">Impact</h2>
                <ImpactTab />
            </div>

            <input type="radio" name="content_tabs" class="tab" aria-label="Data" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                
                <DataTab />
            </div>

            <input type="radio" name="content_tabs" class="tab" aria-label="Methodology" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                <h2 class="text-3xl font-bold text-black mb-6">Methodology</h2>
                <MethodologyTab />
            </div>

            <input type="radio" name="content_tabs" class="tab" aria-label="Architecture" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                <h2 class="text-3xl font-bold text-black mb-6">Architecture</h2>
                <ArchitectureTab />
            </div>

            <input type="radio" name="content_tabs" class="tab" aria-label="Media" hidden/>
            <div class="tab-content bg-white/50 backdrop-blur-md rounded-lg p-8 border border-white/30">
                <h2 class="text-3xl font-bold text-black mb-6">Media</h2>
                <div class="prose prose-lg text-gray-700 max-w-none">
                    <!-- YouTube Video Embed -->
                    <div class="mb-8">
                        <h3 class="text-xl font-bold mb-4">Project Video</h3>
                        <div class="aspect-video w-full max-w-4xl mx-auto">
                            <iframe
                                width="100%"
                                height="100%"
                                src="https://www.youtube.com/embed/_Yw2AXcosS4"
                                title="Home Grown - NASA Space Apps Challenge 2025"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowfullscreen
                                class="rounded-lg"
                            ></iframe>
                        </div>
                        <p class="text-center mt-4">
                            <a href="https://youtu.be/_Yw2AXcosS4" target="_blank" class="link">Watch on YouTube</a>
                        </p>
                    </div>

                    <!-- Press Release -->
                    <div class="mb-6">
                        <h3 class="text-xl font-bold mb-4">Press Release</h3>
                        <div class="bg-[#EDE8DC] p-6 rounded-lg border border-gray-300 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <a href="/nasa-space-apps-2025-home-grown/pressrelease.pdf" target="_blank" class="btn bg-[#D4C5E8] hover:bg-[#C4B5D8] border-[#D4C5E8]">
                                Download Press Release (PDF)
                            </a>
                        </div>
                    </div>
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
