<div class="mb-6">
    <p class="text-gray-700 mb-6">
        Home Grown uses a modern tech stack combining client-side rendering with server-side data processing to deliver real-time crop recommendations based on NASA climate data and AI-powered insights.
    </p>

    <!-- Architecture Diagram -->
    <div class="flex justify-center mb-8">
        <img src="/nasa-space-apps-2025-home-grown/architecture-diagram.png" alt="System Architecture Diagram" class="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"/>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-[#E8DCC8] p-4 rounded-lg border border-gray-300">
            <h3 class="font-bold text-lg mb-2 text-gray-900">🎨 Client-Side Frontend</h3>
            <ul class="text-sm text-gray-700 space-y-1">
                <li>• Svelte 5 with TypeScript for reactive UI</li>
                <li>• Mapbox GL JS for 3D globe & polygon drawing</li>
                <li>• Tailwind CSS + DaisyUI for styling</li>
                <li>• Turf.js for geospatial calculations</li>
            </ul>
        </div>

        <div class="bg-[#D4C5E8] p-4 rounded-lg border border-gray-300">
            <h3 class="font-bold text-lg mb-2 text-gray-900">⚙️ Server-Side Backend</h3>
            <ul class="text-sm text-gray-700 space-y-1">
                <li>• FastAPI (Python) with REST endpoints</li>
                <li>• Crop database with requirements</li>
                <li>• CORS middleware for cross-origin requests</li>
                <li>• Mistral AI for LLM-powered summaries</li>
            </ul>
        </div>

        <div class="bg-[#E8C8D8] p-4 rounded-lg border border-gray-300">
            <h3 class="font-bold text-lg mb-2 text-gray-900">🚀 Deployment</h3>
            <ul class="text-sm text-gray-700 space-y-1">
                <li>• Frontend: GitHub Pages (static hosting)</li>
                <li>• Backend: Render (cloud hosting)</li>
                <li>• SPA routing with 404 redirect technique</li>
            </ul>
        </div>

        <div class="bg-[#F4F1D0] p-4 rounded-lg border border-gray-300">
            <h3 class="font-bold text-lg mb-2 text-gray-900">🛰️ External Data Sources</h3>
            <ul class="text-sm text-gray-700 space-y-1">
                <li>• NASA POWER API: Climate & solar data</li>
                <li>• Microsoft Planetary Computer: Landsat imagery</li>
                <li>• Mistral AI: Text summarization</li>
            </ul>
        </div>
    </div>

    <!-- Pipeline Explanation -->
    <div class="mb-8 mt-12">
        <h3 class="text-2xl font-bold text-black mb-4">Processing Pipeline</h3>
        <p class="text-gray-700 mb-4">
            When a user submits polygon coordinates for their field, the system follows a multi-stage pipeline to generate crop recommendations:
        </p>

        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="font-bold text-lg mb-2">Stage 1: Geometry Processing</h4>
                <p class="text-gray-700">
                    The polygon coordinates are analyzed to calculate the field's centroid (center point) and total area in square meters (shoelace approximation). This centroid becomes the reference point for climate data queries.
                </p>
            </div>

            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 class="font-bold text-lg mb-2">Stage 2: Parallel Data Acquisition</h4>
                <p class="text-gray-700 mb-2">
                    Two data sources are queried simultaneously using asyncio to minimize response time:
                </p>
                <ul class="list-disc pl-6 text-gray-700 space-y-1">
                    <li>NASA POWER API fetches complete daily climate data (temperature, solar radiation, precipitation) for the entire year at the centroid location</li>
                    <li>Microsoft Planetary Computer queries Landsat satellite imagery for high-resolution surface temperature measurements across the actual polygon area</li>
                </ul>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 class="font-bold text-lg mb-2">Stage 3: Data Integration</h4>
                <p class="text-gray-700">
                    Landsat provides superior spatial resolution (30m vs 50km grid) but sparse temporal coverage. Landsat temperatures coverage is increased by forward-fill interpolation to simulate 365-day coverage.
                </p>
            </div>

            <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 class="font-bold text-lg mb-2">Stage 4: Crop Suitability Analysis</h4>
                <p class="text-gray-700 mb-2">
                    For each crop in the database, the system calculates Growing Degree Days (GDD), analyzes temperature ranges, evaluates water requirements, and assesses sunshine availability during the crop's specific growing season. Each crop receives a suitability score (0-100) with detailed metrics.
                </p>
                <p class="text-gray-700 mb-2 mt-3">
                    <strong>Key Assumptions:</strong>
                </p>
                <ul class="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Soil is ignored due to the assumption that urban gardens provide soil, and irrigation influence is factored in with a low coefficient since irrigation in small inner city gardens can be provided easily</li>
                    <li><strong>Shadow consideration:</strong> Depending on the availability of ShadeMap data on sunshine hours per day on the given area, we either use the specific sunshine hours the area receives, or we offset the total, estimated sunshine hours derived from solar radiation by multiplication with 0.7 (default assumption that inside a city, some of the light is blocked by buildings. Improvement potential, if we could infer roof vs. ground level by imagery)</li>
                    <li>Crops that don't have their sunlight demands for maturation fulfilled are filtered out, as this is a crucial factor. Leafy greens provide low-sunlight alternatives</li>
                </ul>
            </div>

            <div class="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h4 class="font-bold text-lg mb-2">Stage 5: Response Construction</h4>
                <p class="text-gray-700">
                    Crops are ranked by suitability score, yield estimates are calculated based on the field area, and the top recommendations are returned with actionable insights including irrigation needs and expected harvest quantities.
                </p>
            </div>
        </div>
    </div>

    
</div>
