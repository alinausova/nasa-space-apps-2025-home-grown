<div class="prose prose-lg text-gray-700 max-w-none">
    <p class="mb-6">
        In this section we will define the various parameters chosen and the key assumptions that have been made to structure the decision logic.
    </p>

    <div class="space-y-6">
        <div class="bg-blue-50 p-6 rounded-lg ">
            <h4 class="font-bold text-xl mb-3">1. Growing Season</h4>
            <p class="mb-3"><strong>Assumption:</strong> Crops only grow when daily average temperature > crop's base temperature</p>
            <p class="mb-2 font-semibold">Why this matters:</p>
            <ul class="list-disc pl-6 space-y-1">
                <li>Winter sunshine is irrelevant if it's too cold for growth</li>
                <li>Each crop has different growing season (lettuce: 4°C, tomatoes: 8.5°C, peppers: 10°C)</li>
                <li>Enables season-aware calculations</li>
            </ul>
        </div>

        <div class="bg-green-50 p-6 rounded-lg ">
            <h4 class="font-bold text-xl mb-3">2. Sunshine Hour Conversion</h4>
            <p class="mb-3"><strong>Formula:</strong> sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35</p>
            <p class="mb-2"><strong>Assumptions:</strong></p>
            <ul class="list-disc pl-6 space-y-1">
                <li>1 MJ = 0.278 kWh (standard conversion)</li>
                <li>Average solar intensity during sunny periods = 350 W/m² (not peak 1000 W/m²)</li>
                <li>Accounts for morning/evening having lower intensity than noon</li>
                <li>Capped at 16 hours maximum (physical daylight limit)</li>
                <li>Shade Factor: User-provided (Shademap, but it only works on locally hosted sites without paywall) or default 0.7 (assumes 30% shade from urban structures)</li>
            </ul>
        </div>

        <div class="bg-yellow-50 p-6 rounded-lg ">
            <h4 class="font-bold text-xl mb-3">3. Growing Degree Days (GDD)</h4>
            <p class="mb-3"><strong>Formula:</strong> GDD = (T_avg - T_base) when T_avg > T_base, with temperature adjustments:</p>
            <ul class="list-disc pl-6 mb-3 space-y-1">
                <li>If T_max > T_upper: use T_upper</li>
                <li>If T_min &lt; T_base: use T_base</li>
            </ul>
            <p class="mb-2">Based on <a href="https://www.fao.org/4/x0490e/x0490e00.htm" target="_blank" class="link">FAO56 methodology</a>. This takes into account growth arrest due to heat</p>
            <p><strong>Purpose:</strong> Measures accumulated heat for crop development</p>
        </div>

        <div class="bg-purple-50 p-6 rounded-lg ">
            <h4 class="font-bold text-xl mb-3">4. Polygon Area Calculation</h4>
            <p class="mb-3"><strong>Method:</strong> Shoelace formula with equirectangular projection</p>
            <ul class="list-disc pl-6 space-y-1">
                <li>Converts lat/lon to meters: x = R × lon × cos(center_lat), y = R × lat</li>
                <li>Earth radius: 6,371,000 meters</li>
                <li>Accuracy: &lt;5% error for areas &lt;10 km per side (suitable for urban agriculture)</li>
            </ul>
        </div>

        <div class="bg-pink-50 p-6 rounded-lg ">
            <h4 class="font-bold text-xl mb-3">5. Yield Estimation</h4>
            <p class="mb-3"><strong>Assumptions:</strong></p>
            <ul class="list-disc pl-6 space-y-1">
                <li>70% of area is usable (30% for walkways, equipment, edges)</li>
                <li>Yield scales with suitability score:
                    <ul class="list-circle pl-6 mt-2 space-y-1">
                        <li>Score ≥90%: Upper bound yield</li>
                        <li>Score 50-90%: Interpolate</li>
                        <li>Score &lt;50%: Minimal yield</li>
                    </ul>
                </li>
            </ul>
        </div>

        <div class="bg-indigo-50 p-6 rounded-lg ">
            <h4 class="font-bold text-xl mb-3">6. Suitability Scoring</h4>
            <p class="mb-3"><strong>Assumption:</strong> Filter out crop (insufficient sunlight)</p>
            <p class="mb-3">Four scored components (0-100 each):</p>

            <div class="space-y-4">
                <div class="ml-4">
                    <h5 class="font-bold mb-2">GDD Score (35% weight)</h5>
                    <ul class="list-disc pl-6 space-y-1">
                        <li>Calculate total annual GDD for crop</li>
                        <li>Ratio = total_GDD / required_GDD</li>
                        <li>Score: 100 if ratio ≥1.0, scaled below that</li>
                    </ul>
                </div>

                <div class="ml-4">
                    <h5 class="font-bold mb-2">Sunlight Score (25% weight)</h5>
                    <ul class="list-disc pl-6 space-y-1">
                        <li>Ratio = adjusted_sun_hours / optimal_sun_hours</li>
                        <li>Score: min(100, ratio × 100)</li>
                    </ul>
                </div>

                <div class="ml-4">
                    <h5 class="font-bold mb-2">Temperature Score (25% weight)</h5>
                    <ul class="list-disc pl-6 space-y-1">
                        <li>Compare annual avg to crop's optimal range</li>
                        <li>Perfect score if within 3°C of optimal midpoint</li>
                        <li>Degrades with distance from optimal</li>
                    </ul>
                </div>

                <div class="ml-4">
                    <h5 class="font-bold mb-2">Water Score (15% weight)</h5>
                    <ul class="list-disc pl-6 space-y-1">
                        <li>Compare annual precipitation to seasonal water requirement</li>
                        <li>Adjusted for drought resistance traits</li>
                        <li>Calculates irrigation needs</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
