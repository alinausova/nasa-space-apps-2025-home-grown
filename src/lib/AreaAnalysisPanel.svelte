<script lang="ts">
    import * as turf from '@turf/turf';
    import type { CropRecommendation, RecommendationsResponse } from './api';
    import CropRecommendationCard from './CropRecommendationCard.svelte';
    import MonthlyTemperatureChart from './MonthlyTemperatureChart.svelte';

    interface Props {
        coordinates: number[][][] | null;
        onClear?: () => void;
        onAnalyze?: () => Promise<RecommendationsResponse>;
        onToggleDraw?: () => void;
        isDrawing?: boolean;
        onFlyTo?: (lat: number, lng: number, zoom?: number) => void;
    }

    let { coordinates = null, onClear, onAnalyze, onToggleDraw, isDrawing = false, onFlyTo }: Props = $props();

    type AreaCalculation = {
        sqm: string;
        sqkm: string;
        raw: number;
    } | null;

    let isLoading = $state(false);
    let recommendations = $state<CropRecommendation[] | null>(null);
    let climateSummary = $state<RecommendationsResponse['climate_summary'] | null>(null);
    let sunshineFactor = $state<number | null>(null);
    let totalFilteredBySunlight = $state<number | null>(null);
    let monthlyTemperatures = $state<RecommendationsResponse['monthly_temperature_averages'] | null>(null);
    let llmSummary = $state<string | null>(null);
    let isExpanded = $state(false);

    async function handleAnalyze(): Promise<void> {
        if (!onAnalyze) return;

        isLoading = true;
        recommendations = null;
        climateSummary = null;
        sunshineFactor = null;
        totalFilteredBySunlight = null;
        monthlyTemperatures = null;
        llmSummary = null;

        try {
            const response = await onAnalyze();
            recommendations = response.recommendations;
            climateSummary = response.climate_summary;
            sunshineFactor = response.sunshine_factor;
            totalFilteredBySunlight = response.total_filtered_by_sunlight ?? null;
            monthlyTemperatures = response.monthly_temperature_averages || null;
            llmSummary = response.llm_summary || null;
        } catch (error) {
            console.error('Failed to analyze polygon:', error);
            alert('Failed to get crop recommendations. Please try again.');
        } finally {
            isLoading = false;
        }
    }

    function handleClear(): void {
        recommendations = null;
        climateSummary = null;
        sunshineFactor = null;
        totalFilteredBySunlight = null;
        monthlyTemperatures = null;
        llmSummary = null;
        if (onClear) onClear();
    }

    // Calculate area in square meters and convert to square kilometers
    let area = $derived((): AreaCalculation => {
        if (!coordinates || coordinates.length === 0) return null;

        const polygon = turf.polygon(coordinates);
        const areaInSquareMeters = turf.area(polygon);
        const areaInSquareKm = areaInSquareMeters / 1_000_000;

        return {
            sqm: areaInSquareMeters.toFixed(2),
            sqkm: areaInSquareKm.toFixed(6),
            raw: areaInSquareMeters
        };
    });

    // Check if area exceeds 1 km² limit
    const MAX_AREA_M2 = 1_000_000; // 1 km²
    let isAreaTooLarge = $derived((area?.()?.raw ?? 0) > MAX_AREA_M2);
</script>

<style>
.glassmorphism-menu {
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  background: rgba(224, 242, 254, 0.1);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0px 8px 24px 0 rgba(12, 74, 110, 0.15),
              inset 0 0 0px rgba(255, 255, 255, 0),
              inset 0px 0px 4px 2px rgba(255, 255, 255, 0.2);
}

.glassmorphism-menu::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(to left top, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 50%);
  z-index: 1;
}

.glassmorphism-menu::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%);
  z-index: 1;
}

.glassmorphism-menu > * {
  position: relative;
  z-index: 2;
}

.climate-glassmorphism {
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  box-shadow: 0px 2px 8px 0 rgba(102, 126, 234, 0.15);
}

.glassmorphism-accordion {
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0px 2px 8px 0 rgba(12, 74, 110, 0.1),
              inset 0px 0px 2px 1px rgba(255, 255, 255, 0.3);
}

</style>

<div class="glassmorphism-menu fixed bottom-0 left-0 right-0 md:top-5 md:right-5 md:left-auto md:bottom-auto w-full md:w-[400px] lg:w-[568px] z-[1000] p-4 md:p-5 flex flex-col {isExpanded ? 'max-h-screen' : 'max-h-[50vh]'} md:max-h-[calc(100vh-40px)] rounded-t-2xl md:rounded-2xl transition-all duration-300">
    <!-- Expand/Collapse chevron (mobile only, only show when there are results) -->
    {#if recommendations && recommendations.length > 0}
        <button
            class="md:hidden w-full flex items-center justify-center pt-2 -mt-4 cursor-pointer hover:bg-black/5 active:bg-black/10 transition-colors rounded-t-2xl"
            onclick={() => isExpanded = !isExpanded}
            aria-label={isExpanded ? 'Collapse drawer' : 'Expand drawer'}
        >
            <svg
                class="w-6 h-6 text-gray-600 transition-transform duration-300 {isExpanded ? '' : 'rotate-180'}"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    {/if}

    <div class="flex justify-between items-center mb-4 pb-3 border-b-2 border-[#A8C896] flex-shrink-0">
        <div class="text-base text-neutral-900 pr-9">
            {#if coordinates && coordinates.length > 0}
                <span class="font-bold">Area Info</span>
            {:else}
                <div>
                    <p class="text-sm mb-2 font-semibold">Empowering urban communities to grow their own food 🌱</p>
                    <span class="text-sm">Draw an area on the map to get crop recommendations</span>
                </div>
            {/if}
        </div>
        <div class="flex items-center gap-2">
            {#if coordinates && coordinates.length > 0}
                <button class="btn btn-sm bg-[#E8C8D8] hover:bg-[#E8C8D8]/80 border-none text-black" onclick={handleClear}>Clear</button>
            {:else if onToggleDraw}
                <button class="btn btn-sm bg-[#A8C896] hover:bg-[#A8C896]/80 border-none text-black flex items-center gap-1 px-4" onclick={onToggleDraw}>
                    {#if isDrawing}
                        Cancel
                    {:else}
                        <span>Start</span>
                    {/if}
                </button>
            {/if}
        </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-1">
    {#if !coordinates || coordinates.length === 0}
        <!-- Instructions when drawing -->
        {#if isDrawing}
            <div class="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-neutral-900">
                <p class="font-semibold mb-1">📍 Drawing Mode Active</p>
                <p class="text-xs opacity-80">Click on the map to place points. Double-click to finish drawing your area.</p>
            </div>
        {/if}

        <!-- Quick jump buttons when no area selected and not drawing -->
        {#if onFlyTo && !isDrawing}
            <div class="mb-4">
                <div class="text-sm text-neutral-900 mb-2 font-semibold">Try these locations:</div>
                <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                        class="glassmorphism-accordion text-neutral-900 p-1 rounded-lg font-medium text-xs hover:bg-green-400/30 transition-all flex flex-col items-center justify-center cursor-pointer min-h-[48px]"
                        onclick={() => onFlyTo(48.1460, 11.5623, 15)}
                    >
                        <span>🇩🇪 Munich</span>
                        <span class="opacity-70 font-normal text-[10px]">Temperate</span>
                    </button>
                    <button
                        class="glassmorphism-accordion text-neutral-900 p-1 rounded-lg font-medium text-xs hover:bg-green-400/30 transition-all flex flex-col items-center justify-center cursor-pointer min-h-[48px]"
                        onclick={() => onFlyTo(30.0444, 31.2357, 15)}
                    >
                        <span>🇪🇬 Cairo</span>
                        <span class="opacity-70 font-normal text-[10px]">Hot/Arid</span>
                    </button>
                    <button
                        class="glassmorphism-accordion text-neutral-900 p-1 rounded-lg font-medium text-xs hover:bg-green-400/30 transition-all flex flex-col items-center justify-center cursor-pointer min-h-[48px]"
                        onclick={() => onFlyTo(-1.4218295, -48.4565636, 15)}
                    >
                        <span>🇧🇷 Belem</span>
                        <span class="opacity-70 font-normal text-[10px]">Tropical</span>
                    </button>
                    <button
                        class="glassmorphism-accordion text-neutral-900 p-1 rounded-lg font-medium text-xs hover:bg-green-400/30 transition-all flex flex-col items-center justify-center cursor-pointer min-h-[48px]"
                        onclick={() => onFlyTo(64.1466, -21.8952, 15)}
                    >
                        <span>🇮🇸 Reykjavik</span>
                        <span class="opacity-70 font-normal text-[10px]">Cold</span>
                    </button>
                </div>
            </div>
        {/if}
    {:else}
    {#if coordinates && coordinates.length > 0}

        {#if area() && (!recommendations || recommendations.length === 0)}
            <div class="glassmorphism-accordion text-neutral-900 p-3 rounded-lg mb-4 font-semibold">
                <div class="text-sm opacity-80 mb-1">Selected Area</div>
                <div class="text-lg">{area()?.sqkm} km² ({area()?.sqm} m²)</div>
            </div>
        {/if}

        {#if onAnalyze && (!recommendations || recommendations.length === 0)}
            {#if isAreaTooLarge}
                <div class="alert alert-warning mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <div class="font-bold">Selection too large!</div>
                        <div class="text-sm">Area: {area?.()?.sqkm} km². Maximum allowed: 1 km². Please select a smaller area.</div>
                    </div>
                </div>
            {/if}
            <button
                class="btn btn-block mb-4 bg-[#D4C5E8] hover:bg-[#D4C5E8]/80 border-none text-black"
                class:btn-disabled={isLoading || isAreaTooLarge}
                onclick={handleAnalyze}
                disabled={isLoading || isAreaTooLarge}
            >
            {#if isLoading}
                <span class="loading loading-spinner"></span>
                Analyzing...
            {:else}
                Analyze Crops
            {/if}
            </button>
        {/if}

        {#if isLoading}
            <div class="text-center text-gray-500 p-5 italic">Fetching climate data and calculating crop suitability...</div>
        {/if}

        {#if climateSummary}
            <div class="collapse collapse-arrow climate-glassmorphism text-neutral-900 rounded-lg mb-4">
                <input type="checkbox" checked />
                <div class="collapse-title min-h-0 py-2.5 pl-3 pr-10">
                    <span class="font-semibold text-sm">Climate Summary (2023)</span>
                </div>
                <div class="collapse-content px-3">
                    <div class="pt-3">
                        <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div class="flex flex-col">
                                <div class="opacity-80 text-xs mb-0.5">Growing Season Sun</div>
                                <div class="font-semibold text-[0.95rem]">{climateSummary.representative_sun_hours_daily} hrs/day</div>
                            </div>
                            <div class="flex flex-col">
                                <div class="opacity-80 text-xs mb-0.5">Sunshine Factor</div>
                                <div class="font-semibold text-[0.95rem]">{sunshineFactor !== null ? (sunshineFactor * 100).toFixed(0) : '0'}%</div>
                            </div>
                            <div class="flex flex-col">
                                <div class="opacity-80 text-xs mb-0.5">Precipitation</div>
                                <div class="font-semibold text-[0.95rem]">{Math.round(climateSummary.annual_precipitation_mm)} mm/year</div>
                            </div>
                            <div class="flex flex-col">
                                <div class="opacity-80 text-xs mb-0.5">Suitable Crops</div>
                                <div class="font-semibold text-[0.95rem]">{recommendations?.length || 0} found</div>
                            </div>
                        </div>
                        {#if totalFilteredBySunlight && totalFilteredBySunlight > 0}
                            <div class="mb-3 pb-3 border-b border-black/10 text-xs opacity-80">
                                {totalFilteredBySunlight} crop{totalFilteredBySunlight === 1 ? '' : 's'} filtered due to insufficient sunlight
                            </div>
                        {/if}
                        {#if monthlyTemperatures && monthlyTemperatures.monthly_averages}
                            <MonthlyTemperatureChart
                                data={monthlyTemperatures.monthly_averages}
                                yearsAnalyzed={monthlyTemperatures.years_analyzed}
                            />
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        {#if llmSummary}
        <div class="collapse collapse-arrow glassmorphism-accordion text-neutral-900 rounded-lg mb-4">
            <input type="checkbox" checked />
            <div class="collapse-title min-h-0 py-2.5 pl-3 pr-10">
                <span class="font-semibold text-sm flex items-center gap-2">
                    <span>🌱</span>
                    Reccomendation
                </span>
            </div>
            <div class="collapse-content px-3">
                <div class="pt-3 overflow-y-auto pr-2">
                    <div class="text-gray-700 leading-relaxed text-sm prose prose-sm max-w-none">
                        {@html llmSummary
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n- /g, '\n• ')
                            .replace(/\n/g, '<br/>')
                        }
                    </div>
                </div>
            </div>
        </div>
    {/if}

        {#if recommendations && recommendations.length > 0}
            <div class="mt-4">
                <div class="text-base font-semibold text-gray-700 mb-3">Recommended Crops</div>
                <div>
                    {#each recommendations as crop, index}
                        <CropRecommendationCard {crop} {index} />
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
    {/if}
    </div>
</div>
