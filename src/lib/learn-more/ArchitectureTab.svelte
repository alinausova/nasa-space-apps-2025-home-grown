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
</div>
