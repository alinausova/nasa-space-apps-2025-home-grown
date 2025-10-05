<script lang="ts">
    import type { CropRecommendation } from './api';

    interface Props {
        crop: CropRecommendation;
        index: number;
    }

    let { crop, index }: Props = $props();

    function getSeasonColor(season: string): string {
        return season === 'cool' ? '#3b82f6' : '#f97316';
    }

    function getFrostToleranceColor(tolerance: string): string {
        switch(tolerance) {
            case 'very_hardy': return '#0ea5e9';  // sky-500 - icy blue, survives freezing
            case 'hardy': return '#38bdf8';       // sky-400 - light blue, handles cold
            case 'half_hardy': return '#a78bfa';  // violet-400 - purple, transitional
            case 'tender': return '#ec4899';      // pink-500 - needs warmth
            default: return '#9ca3af';            // gray-400
        }
    }

    function getDroughtResistanceColor(resistance: string): string {
        switch(resistance) {
            case 'tolerant': return '#d97706';           // amber-600 - desert adapted, low water
            case 'moderate_tolerant': return '#eab308';  // yellow-500 - low-moderate water
            case 'moderate': return '#84cc16';           // lime-500 - moderate water needs
            case 'moderate_sensitive': return '#06b6d4'; // cyan-500 - needs regular water
            case 'sensitive': return '#0891b2';          // cyan-600 - high water needs
            default: return '#9ca3af';                   // gray-400
        }
    }

    function getFrostIcon(tolerance: string): string {
        switch(tolerance) {
            case 'very_hardy': return '❄️❄️';
            case 'hardy': return '❄️';
            case 'tender': return '🌸';
            default: return '🌱';
        }
    }

    function getFrostToleranceDescription(tolerance: string): string {
        switch(tolerance) {
            case 'very_hardy': return 'Survives freezing';
            case 'hardy': return 'Handles cold well';
            case 'half_hardy': return 'Transitional';
            case 'tender': return 'Needs warmth';
            default: return '';
        }
    }

    function getDroughtResistanceDescription(resistance: string): string {
        switch(resistance) {
            case 'tolerant': return 'Desert adapted, low water';
            case 'moderate_tolerant': return 'Low-moderate water';
            case 'moderate': return 'Moderate water';
            case 'moderate_sensitive': return 'Needs regular water';
            case 'sensitive': return 'High water needs';
            default: return '';
        }
    }
</script>

<style>
.glassmorphism-accordion {
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0px 2px 8px 0 rgba(12, 74, 110, 0.1),
              inset 0px 0px 2px 1px rgba(255, 255, 255, 0.3);
}

.yield-glassmorphism {
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.25) 0%, rgba(34, 197, 94, 0.25) 100%);
  border: 1px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0px 2px 8px 0 rgba(34, 197, 94, 0.15);
}
</style>

<div class="collapse collapse-arrow glassmorphism-accordion mb-2">
    <input type="checkbox" />
    <div class="collapse-title min-h-0 py-2.5 pl-3 pr-10">
        <div class="flex justify-between items-center">
            <span class="font-medium text-neutral-900">{crop.crop_name}</span>
            <div class="flex items-center gap-2">
                {#if crop.suitability.metrics.irrigation_needed_mm > 0}
                <div class="tooltip" data-tip="Irrigation needed: {Math.round(crop.suitability.metrics.irrigation_needed_mm)} mm">
                    <span class="text-xl">💧</span>
                </div>
                {/if}
                <span class="badge badge-sm {crop.suitability.category.toLowerCase() === 'excellent' ? 'badge-success' : crop.suitability.category.toLowerCase() === 'good' ? 'badge-info' : crop.suitability.category.toLowerCase() === 'moderate' ? 'badge-warning' : 'badge-error'}">
                    {crop.suitability.overall_score}%
                </span>
            </div>
        </div>
    </div>
    <div class="collapse-content px-3">
        <div class="pt-3">
            {#if crop.suitability.yield_estimate}
            <div class="yield-glassmorphism p-4 rounded-lg mb-3 text-neutral-900">
                <div class="text-xs font-semibold uppercase opacity-80 mb-2">Expected Yield</div>
                <div class="flex items-baseline gap-2 mb-2">
                    <div class="text-[1.8rem] font-bold">{crop.suitability.yield_estimate.total_yield_kg.toLocaleString()} kg</div>
                    <div class="text-sm opacity-80">({crop.suitability.yield_estimate.total_yield_tons.toLocaleString()} tons)</div>
                </div>
                <div class="flex justify-between items-center text-sm pt-2 border-t border-black/10">
                    <span>{crop.suitability.yield_estimate.yield_per_m2_kg} kg/m²</span>
                    <span class="italic opacity-80">{crop.suitability.yield_estimate.yield_category}</span>
                </div>
            </div>
        {/if}
            <div class="flex justify-between items-center mb-2.5 text-sm gap-4">
                <span class="text-gray-500">Season</span>
                <span class="badge badge-sm text-white text-[0.7rem] font-semibold uppercase whitespace-nowrap" style="background-color: {getSeasonColor(crop.season)}">
                    {crop.season}
                </span>
            </div>

            {#if crop.suitability.metrics.irrigation_needed_mm > 0}
            <div class="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mb-2.5">
                <div class="flex justify-between items-center text-sm gap-4">
                    <span class="text-amber-900 font-semibold flex items-center gap-1.5">
                        <span class="text-lg">💧</span>
                        Irrigation Needed
                    </span>
                    <span class="font-bold text-amber-900 text-right">{Math.round(crop.suitability.metrics.irrigation_needed_mm)} mm</span>
                </div>
            </div>
        {/if}
           

            <div class="flex justify-between items-center mb-2.5 text-sm gap-4">
                <span class="text-gray-500 flex items-center gap-1.5 shrink-0">
                    <span>Frost Tolerance</span>
                    <span>{getFrostIcon(crop.frost_tolerance)}</span>
                </span>
                <div class="tooltip tooltip-left z-[9999]" data-tip={getFrostToleranceDescription(crop.frost_tolerance)}>
                    <span class="badge badge-sm text-white text-[0.7rem] font-semibold uppercase whitespace-nowrap" style="background-color: {getFrostToleranceColor(crop.frost_tolerance)}">
                        {crop.frost_tolerance.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div class="flex justify-between items-center mb-2.5 text-sm gap-4">
                <span class="text-gray-500 flex items-center gap-1.5 shrink-0">
                    <span>Drought Resistance</span>
                    <span>💧</span>
                </span>
                <div class="tooltip tooltip-left z-[9999]" data-tip={getDroughtResistanceDescription(crop.drought_resistance)}>
                    <span class="badge badge-sm text-white text-[0.7rem] font-semibold uppercase whitespace-nowrap" style="background-color: {getDroughtResistanceColor(crop.drought_resistance)}">
                        {crop.drought_resistance.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="font-semibold text-[0.8rem] text-gray-500 mb-2">
                    Score Breakdown
                </div>

                <div class="mb-2.5">
                    <div class="flex justify-between text-sm mb-1.5 text-gray-600">
                        <span>Growing Degree Days</span>
                        <span class="font-semibold">{crop.suitability.scores.gdd}%</span>
                    </div>
                    <div class="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div class="h-full rounded-full bg-green-400 transition-all duration-300" style="width: {crop.suitability.scores.gdd}%;"></div>
                    </div>
                </div>

                <div class="mb-2.5">
                    <div class="flex justify-between text-sm mb-1.5 text-gray-600">
                        <span>Sunlight</span>
                        <span class="font-semibold">{crop.suitability.scores.sunlight}%</span>
                    </div>
                    <div class="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div class="h-full rounded-full bg-amber-400 transition-all duration-300" style="width: {crop.suitability.scores.sunlight}%;"></div>
                    </div>
                    <div class="flex justify-between text-xs mt-1 text-gray-500">
                        <span>Available: {crop.suitability.metrics.adjusted_sun_hours} hrs/day</span>
                        <span>Optimal: {crop.suitability.metrics.optimal_sun_hours} hrs/day</span>
                    </div>
                </div>

                <div class="mb-2.5">
                    <div class="flex justify-between text-sm mb-1.5 text-gray-600">
                        <span>Temperature</span>
                        <span class="font-semibold">{crop.suitability.scores.temperature}%</span>
                    </div>
                    <div class="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div class="h-full rounded-full bg-orange-500 transition-all duration-300" style="width: {crop.suitability.scores.temperature}%;"></div>
                    </div>
                </div>

                <div class="mb-2.5">
                    <div class="flex justify-between text-sm mb-1.5 text-gray-600">
                        <span>Water Availability</span>
                        <span class="font-semibold">{crop.suitability.scores.water}%</span>
                    </div>
                    <div class="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div class="h-full rounded-full bg-blue-500 transition-all duration-300" style="width: {crop.suitability.scores.water}%;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
