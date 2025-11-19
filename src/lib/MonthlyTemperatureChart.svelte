<script lang="ts">
    import type { MonthlyTemperatureData } from './api';

    interface Props {
        data: MonthlyTemperatureData[];
        yearsAnalyzed: number;
    }

    let { data, yearsAnalyzed }: Props = $props();

    // Calculate chart dimensions and scaling
    const chartHeight = 120;
    const chartWidth = 360;
    const padding = { top: 10, right: 10, bottom: 20, left: 35 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Find min and max temperatures for scaling
    let minTemp = $derived(() => {
        const temps = data.flatMap(d => [d.avg_temp_min, d.avg_temp_max]);
        return Math.floor(Math.min(...temps) / 5) * 5; // Round down to nearest 5
    });

    let maxTemp = $derived(() => {
        const temps = data.flatMap(d => [d.avg_temp_min, d.avg_temp_max]);
        return Math.ceil(Math.max(...temps) / 5) * 5; // Round up to nearest 5
    });

    // Scale functions
    function scaleX(index: number): number {
        return padding.left + (index / (data.length - 1)) * innerWidth;
    }

    function scaleY(temp: number): number {
        const range = maxTemp() - minTemp();
        const normalized = (temp - minTemp()) / range;
        return padding.top + innerHeight - (normalized * innerHeight);
    }

    // Generate path for max temperature line
    let maxTempPath = $derived(() => {
        return data.map((d, i) => {
            const x = scaleX(i);
            const y = scaleY(d.avg_temp_max);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    });

    // Generate path for min temperature line
    let minTempPath = $derived(() => {
        return data.map((d, i) => {
            const x = scaleX(i);
            const y = scaleY(d.avg_temp_min);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    });

    // Generate area path (filled area between min and max)
    let areaPath = $derived(() => {
        const topLine = data.map((d, i) => {
            const x = scaleX(i);
            const y = scaleY(d.avg_temp_max);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const bottomLine = data.slice().reverse().map((d, i) => {
            const x = scaleX(data.length - 1 - i);
            const y = scaleY(d.avg_temp_min);
            return `L ${x} ${y}`;
        }).join(' ');

        return `${topLine} ${bottomLine} Z`;
    });

    // Generate y-axis ticks
    let yTicks = $derived(() => {
        const range = maxTemp() - minTemp();
        const numTicks = 5;
        const step = range / (numTicks - 1);
        return Array.from({ length: numTicks }, (_, i) => {
            const temp = minTemp() + (i * step);
            return {
                temp: Math.round(temp),
                y: scaleY(temp)
            };
        });
    });
</script>

<div class="mb-2">
    <div class="text-xs font-semibold text-neutral-700 mb-2">
        Monthly Temperature Average ({yearsAnalyzed}-Year)
    </div>

    <svg viewBox="0 0 {chartWidth} {chartHeight}" class="w-full h-auto overflow-visible" preserveAspectRatio="xMidYMid meet">
        <!-- Area fill -->
        <path
            d={areaPath()}
            fill="url(#tempGradient)"
            opacity="0.3"
        />

        <!-- Temperature gradient -->
        <defs>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#f97316;stop-opacity:0.6" />
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.6" />
            </linearGradient>
        </defs>

        <!-- Grid lines -->
        {#each yTicks() as tick}
            <line
                x1={padding.left}
                y1={tick.y}
                x2={chartWidth - padding.right}
                y2={tick.y}
                stroke="#e5e7eb"
                stroke-width="1"
                stroke-dasharray="2,2"
            />
        {/each}

        <!-- Y-axis labels -->
        {#each yTicks() as tick}
            <text
                x={padding.left - 5}
                y={tick.y}
                text-anchor="end"
                dominant-baseline="middle"
                class="text-[10px] fill-neutral-600"
            >
                {tick.temp}°
            </text>
        {/each}

        <!-- Max temperature line -->
        <path
            d={maxTempPath()}
            fill="none"
            stroke="#f97316"
            stroke-width="2"
        />

        <!-- Min temperature line -->
        <path
            d={minTempPath()}
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
        />

        <!-- Data points -->
        {#each data as d, i}
            <circle
                cx={scaleX(i)}
                cy={scaleY(d.avg_temp_max)}
                r="3"
                fill="#f97316"
            />
            <circle
                cx={scaleX(i)}
                cy={scaleY(d.avg_temp_min)}
                r="3"
                fill="#3b82f6"
            />
        {/each}

        <!-- X-axis labels (abbreviated month names) -->
        {#each data as d, i}
            <text
                x={scaleX(i)}
                y={chartHeight - 5}
                text-anchor="middle"
                class="text-[9px] fill-neutral-600"
            >
                {d.month_name.slice(0, 3)}
            </text>
        {/each}
    </svg>

    <!-- Legend -->
    <div class="flex justify-center gap-4 mt-2 text-xs">
        <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-[#f97316]"></div>
            <span class="text-neutral-700">Max Temp</span>
        </div>
        <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span class="text-neutral-700">Min Temp</span>
        </div>
    </div>
</div>
