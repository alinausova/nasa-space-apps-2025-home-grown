<script lang="ts">
    import * as turf from '@turf/turf';
    import type { CropRecommendation, RecommendationsResponse } from './api';

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
    let expandedCropId = $state<string | null>(null);

    async function handleAnalyze() {
        if (!onAnalyze) return;

        isLoading = true;
        recommendations = null;
        climateSummary = null;

        try {
            const response = await onAnalyze();
            recommendations = response.recommendations;
            climateSummary = response.climate_summary;
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
        expandedCropId = null;
        if (onClear) onClear();
    }

    function toggleCrop(cropId: string) {
        expandedCropId = expandedCropId === cropId ? null : cropId;
    }

    function getSeasonColor(season: string): string {
        return season === 'cool' ? '#3b82f6' : '#f97316';
    }

    function getFrostIcon(tolerance: string): string {
        switch(tolerance) {
            case 'very_hardy': return '❄️❄️';
            case 'hardy': return '❄️';
            case 'tender': return '🌸';
            default: return '🌱';
        }
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
    .polygon-card {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 20px;
        max-width: 420px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #4ade80;
    }

    .card-title {
        font-size: 1.2rem;
        font-weight: bold;
        color: #1a1a1a;
        padding-right: 36px;
    }

    .action-button {
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s;
    }

    .select-area-button {
        background: #4ade80;
        color: #1a1a1a;
    }

    .select-area-button:hover {
        background: #22c55e;
    }

    .clear-button {
        background: #ef4444;
        color: white;
    }

    .clear-button:hover {
        background: #dc2626;
    }

    .coordinates-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .coordinate-item {
        background: #f3f4f6;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        color: #374151;
    }

    .point-number {
        font-weight: bold;
        color: #4ade80;
        margin-right: 8px;
    }

    .no-polygon {
        text-align: center;
        color: #9ca3af;
        padding: 20px;
        font-style: italic;
    }

    .area-display {
        background: #4ade80;
        color: #1a1a1a;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-weight: 600;
    }

    .area-label {
        font-size: 0.85rem;
        opacity: 0.8;
        margin-bottom: 4px;
    }

    .area-value {
        font-size: 1.1rem;
    }

    .analyze-button {
        width: 100%;
        background: #4ade80;
        color: #1a1a1a;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 16px;
    }

    .analyze-button:hover:not(:disabled) {
        background: #22c55e;
        transform: translateY(-1px);
    }

    .analyze-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .recommendations-section {
        margin-top: 16px;
    }

    .recommendations-title {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
    }

    .crop-item {
        background: #f3f4f6;
        padding: 10px 14px;
        margin-bottom: 8px;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: space-between;
    }

    .crop-name {
        font-weight: 500;
        color: #1a1a1a;
    }

    .crop-badge {
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .badge-excellent {
        background: #4ade80;
        color: #1a1a1a;
    }

    .badge-good {
        background: #3b82f6;
        color: white;
    }

    .badge-moderate {
        background: #fbbf24;
        color: #1a1a1a;
    }

    .badge-poor {
        background: #ef4444;
        color: white;
    }

    .loading-text {
        text-align: center;
        color: #6b7280;
        padding: 20px;
        font-style: italic;
    }

    .climate-summary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 16px;
    }

    .climate-title {
        font-size: 0.9rem;
        font-weight: 600;
        opacity: 0.9;
        margin-bottom: 8px;
    }

    .climate-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        font-size: 0.85rem;
    }

    .climate-item {
        display: flex;
        flex-direction: column;
    }

    .climate-label {
        opacity: 0.8;
        font-size: 0.75rem;
        margin-bottom: 2px;
    }

    .climate-value {
        font-weight: 600;
        font-size: 0.95rem;
    }

    .season-badge {
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        color: white;
        margin-left: 10px;
        white-space: nowrap;
    }

    .crop-header {
        cursor: pointer;
        user-select: none;
    }

    .crop-details {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #d1d5db;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 0.85rem;
        gap: 16px;
    }

    .detail-label {
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .detail-value {
        font-weight: 500;
        color: #1a1a1a;
        text-align: right;
    }

    .score-bar {
        margin-bottom: 8px;
    }

    .score-bar-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        margin-bottom: 4px;
        color: #6b7280;
    }

    .score-bar-bg {
        background: #e5e7eb;
        height: 6px;
        border-radius: 3px;
        overflow: hidden;
    }

    .score-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
    }

    .expand-icon {
        transition: transform 0.2s;
    }

    .expand-icon.expanded {
        transform: rotate(180deg);
    }

    .yield-section {
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 12px;
        color: #1a1a1a;
    }

    .yield-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.8;
        margin-bottom: 8px;
    }

    .yield-main {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
    }

    .yield-large {
        font-size: 1.8rem;
        font-weight: 700;
    }

    .yield-secondary {
        font-size: 0.9rem;
        opacity: 0.8;
    }

    .yield-detail {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .yield-category {
        font-style: italic;
        opacity: 0.8;
    }
</style>

<div class="polygon-card">
    <div class="card-header">
        <div class="card-title">
            {coordinates && coordinates.length > 0 ? 'Area Info' : 'Home Grown'}
        </div>
        {#if coordinates && coordinates.length > 0}
            <button class="action-button clear-button" onclick={handleClear}>Clear</button>
        {:else if onToggleDraw}
            <button class="action-button select-area-button" onclick={onToggleDraw}>
                {isDrawing ? 'Cancel' : 'Select Area'}
            </button>
        {/if}
    </div>

    {#if coordinates && coordinates.length > 0}

        {#if area()}
            <div class="area-display">
                <div class="area-label">Total Area</div>
                <div class="area-value">{area().sqkm} km² ({area().sqm} m²)</div>
            </div>
        {/if}

        {#if onAnalyze}
            <button class="analyze-button" onclick={handleAnalyze} disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Analyze Crops'}
            </button>
        {/if}

        {#if isLoading}
            <div class="loading-text">Fetching climate data and calculating crop suitability...</div>
        {/if}

        {#if climateSummary}
            <div class="climate-summary">
                <div class="climate-title">Climate Summary (2023)</div>
                <div class="climate-grid">
                    <div class="climate-item">
                        <div class="climate-label">Temperature</div>
                        <div class="climate-value">{climateSummary.avg_temp_min}° - {climateSummary.avg_temp_max}°C</div>
                    </div>
                    <div class="climate-item">
                        <div class="climate-label">Sun Hours</div>
                        <div class="climate-value">{climateSummary.avg_sun_hours_daily} hrs/day</div>
                    </div>
                    <div class="climate-item">
                        <div class="climate-label">Precipitation</div>
                        <div class="climate-value">{Math.round(climateSummary.annual_precipitation_mm)} mm/year</div>
                    </div>
                    <div class="climate-item">
                        <div class="climate-label">Suitable Crops</div>
                        <div class="climate-value">{recommendations?.length || 0} found</div>
                    </div>
                </div>
            </div>
        {/if}

        {#if recommendations && recommendations.length > 0}
            <div class="recommendations-section">
                <div class="recommendations-title">Recommended Crops</div>
                {#each recommendations as crop}
                    <div class="crop-item">
                        <div class="crop-header" onclick={() => toggleCrop(crop.crop_id)}>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center;">
                                    <span class="crop-name">{crop.crop_name}</span>
                                    <span class="season-badge" style="background-color: {getSeasonColor(crop.season)}">
                                        {crop.season}
                                    </span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span class="crop-badge badge-{crop.suitability.category.toLowerCase()}">
                                        {crop.suitability.overall_score}%
                                    </span>
                                    <span class="expand-icon" class:expanded={expandedCropId === crop.crop_id}>▼</span>
                                </div>
                            </div>
                        </div>

                        {#if expandedCropId === crop.crop_id}
                            <div class="crop-details">
                                {#if crop.suitability.yield_estimate}
                                    <div class="yield-section">
                                        <div class="yield-title">Expected Yield</div>
                                        <div class="yield-main">
                                            <div class="yield-large">{crop.suitability.yield_estimate.total_yield_kg.toLocaleString()} kg</div>
                                            <div class="yield-secondary">({crop.suitability.yield_estimate.total_yield_tons.toLocaleString()} tons)</div>
                                        </div>
                                        <div class="yield-detail">
                                            <span>{crop.suitability.yield_estimate.yield_per_m2_kg} kg/m²</span>
                                            <span class="yield-category">{crop.suitability.yield_estimate.yield_category}</span>
                                        </div>
                                    </div>
                                {/if}

                                <div class="detail-row">
                                    <span class="detail-label">
                                        <span>Frost Tolerance</span>
                                        <span>{getFrostIcon(crop.frost_tolerance)}</span>
                                    </span>
                                    <span class="detail-value">{crop.frost_tolerance.replace('_', ' ')}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Drought Resistance</span>
                                    <span class="detail-value">{crop.drought_resistance.replace('_', ' ')}</span>
                                </div>
                                {#if crop.suitability.metrics.irrigation_needed_mm > 0}
                                    <div class="detail-row">
                                        <span class="detail-label">💧 Irrigation Needed</span>
                                        <span class="detail-value">{Math.round(crop.suitability.metrics.irrigation_needed_mm)} mm</span>
                                    </div>
                                {/if}

                                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                                    <div style="font-weight: 600; font-size: 0.8rem; color: #6b7280; margin-bottom: 8px;">
                                        Score Breakdown
                                    </div>

                                    <div class="score-bar">
                                        <div class="score-bar-label">
                                            <span>Growing Degree Days</span>
                                            <span>{crop.suitability.scores.gdd}%</span>
                                        </div>
                                        <div class="score-bar-bg">
                                            <div class="score-bar-fill" style="width: {crop.suitability.scores.gdd}%; background: #4ade80;"></div>
                                        </div>
                                    </div>

                                    <div class="score-bar">
                                        <div class="score-bar-label">
                                            <span>Sunlight</span>
                                            <span>{crop.suitability.scores.sunlight}%</span>
                                        </div>
                                        <div class="score-bar-bg">
                                            <div class="score-bar-fill" style="width: {crop.suitability.scores.sunlight}%; background: #fbbf24;"></div>
                                        </div>
                                    </div>

                                    <div class="score-bar">
                                        <div class="score-bar-label">
                                            <span>Temperature</span>
                                            <span>{crop.suitability.scores.temperature}%</span>
                                        </div>
                                        <div class="score-bar-bg">
                                            <div class="score-bar-fill" style="width: {crop.suitability.scores.temperature}%; background: #f97316;"></div>
                                        </div>
                                    </div>

                                    <div class="score-bar">
                                        <div class="score-bar-label">
                                            <span>Water Availability</span>
                                            <span>{crop.suitability.scores.water}%</span>
                                        </div>
                                        <div class="score-bar-bg">
                                            <div class="score-bar-fill" style="width: {crop.suitability.scores.water}%; background: #3b82f6;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>
