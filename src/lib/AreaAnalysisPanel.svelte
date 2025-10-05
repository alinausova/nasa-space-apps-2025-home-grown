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
    }

    let { coordinates = null, onClear, onAnalyze, onToggleDraw, isDrawing = false }: Props = $props();

    let isLoading = $state(false);
    let recommendations = $state<CropRecommendation[] | null>(null);
    let climateSummary = $state<RecommendationsResponse['climate_summary'] | null>(null);
    let sunshineFactor = $state<number | null>(null);
    let totalFilteredBySunlight = $state<number | null>(null);
    let monthlyTemperatures = $state<RecommendationsResponse['monthly_temperature_averages'] | null>(null);

    async function handleAnalyze() {
        if (!onAnalyze) return;

        isLoading = true;
        recommendations = null;
        climateSummary = null;
        sunshineFactor = null;
        totalFilteredBySunlight = null;
        monthlyTemperatures = null;

        try {
            const response = await onAnalyze();
            recommendations = response.recommendations;
            climateSummary = response.climate_summary;
            sunshineFactor = response.sunshine_factor;
            totalFilteredBySunlight = response.total_filtered_by_sunlight;
            monthlyTemperatures = response.monthly_temperature_averages || null;
        } catch (error) {
            console.error('Failed to analyze polygon:', error);
            alert('Failed to get crop recommendations. Please try again.');
        } finally {
            isLoading = false;
        }
    }

    function handleClear() {
        recommendations = null;
        climateSummary = null;
        sunshineFactor = null;
        totalFilteredBySunlight = null;
        monthlyTemperatures = null;
        if (onClear) onClear();
    }

    // Calculate area in square meters and convert to square kilometers
    let area = $derived(() => {
        if (!coordinates || coordinates.length === 0) return null;

        const polygon = turf.polygon(coordinates);
        const areaInSquareMeters = turf.area(polygon);
        const areaInSquareKm = areaInSquareMeters / 1_000_000;

        return {
            sqm: areaInSquareMeters.toFixed(2),
            sqkm: areaInSquareKm.toFixed(6)
        };
    });
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

<div class="glassmorphism-menu fixed top-5 right-5 w-[460px] z-[1000] p-5"
     class:h-[calc(100vh-40px)]={recommendations && recommendations.length > 0}
     class:flex={recommendations && recommendations.length > 0}
     class:flex-col={recommendations && recommendations.length > 0}>
    <div class="flex justify-between items-center mb-4 pb-3 border-b-2 border-green-400">
        <div class="text-base text-neutral-900 pr-9">
            {#if coordinates && coordinates.length > 0}
                <span class="font-bold">Area Info</span>
            {:else}
                <span>Select an area on the map to get crop recommendations</span>
            {/if}
        </div>
        {#if coordinates && coordinates.length > 0}
            <button class="btn btn-error btn-sm" onclick={handleClear}>Clear</button>
        {:else if onToggleDraw}
            <button class="btn btn-success btn-sm" onclick={onToggleDraw}>
                {isDrawing ? 'Cancel' : 'Select Area'}
            </button>
        {/if}
    </div>

    {#if coordinates && coordinates.length > 0}

        {#if area()}
            <div class="glassmorphism-accordion text-neutral-900 p-3 rounded-lg mb-4 font-semibold">
                <div class="text-sm opacity-80 mb-1">Selected Area</div>
                <div class="text-lg">{area().sqkm} km² ({area().sqm} m²)</div>
            </div>
        {/if}

        {#if onAnalyze && (!recommendations || recommendations.length === 0)}
            <button
                class="btn btn-primary btn-block mb-4"
                class:btn-disabled={isLoading}
                onclick={handleAnalyze}
                disabled={isLoading}
            >
                {isLoading ? 'Analyzing...' : 'Analyze Crops'}
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
                                <div class="opacity-80 text-xs mb-0.5">Temperature</div>
                                <div class="font-semibold text-[0.95rem]">{climateSummary.avg_temp_min}° - {climateSummary.avg_temp_max}°C</div>
                            </div>
                            <div class="flex flex-col">
                                <div class="opacity-80 text-xs mb-0.5">Sun Hours</div>
                                <div class="font-semibold text-[0.95rem]">{climateSummary.avg_sun_hours_daily} hrs/day</div>
                            </div>
                            {#if climateSummary.adjusted_sun_hours_daily !== undefined}
                            <div class="flex flex-col">
                                <div class="opacity-80 text-xs mb-0.5">Adjusted Sun Hours</div>
                                <div class="font-semibold text-[0.95rem]">{climateSummary.adjusted_sun_hours_daily} hrs/day</div>
                            </div>
                            {/if}
                            {#if sunshineFactor !== null}
                            <div class="flex flex-col">
                                <div class="opacity-80 text-xs mb-0.5">Sunshine Factor</div>
                                <div class="font-semibold text-[0.95rem]">{(sunshineFactor * 100).toFixed(0)}%</div>
                            </div>
                            {/if}
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

        {#if recommendations && recommendations.length > 0}
            <div class="mt-4 flex-1 flex flex-col min-h-0">
                <div class="text-base font-semibold text-gray-700 mb-3">Recommended Crops</div>
                <div class="flex-1 overflow-y-auto pr-1">
                    {#each recommendations as crop, index}
                        <CropRecommendationCard {crop} {index} />
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
</div>
