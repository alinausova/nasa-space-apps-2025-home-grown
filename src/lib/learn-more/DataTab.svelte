<div class="prose prose-lg text-gray-700 max-w-none">
    <!-- Variables Section -->
    <h2 class="text-3xl font-bold text-black mb-4">Variables</h2>
    <p class="mb-4">
        The table below describes the different meteorological variables used to assess the suitability of different areas for various crops and plant varieties. These variables were selected as key data points needed to understand which environmental conditions - such as climate patterns, soil composition, and topography - are the primary drivers of successful growth rates and optimal yield within the selected geographic regions. The collective analysis of these variables allows users to make data-driven decisions regarding crop selection and agricultural planning.
    </p>

    <!-- Desktop: Table view -->
    <div class="hidden md:block overflow-x-auto mb-8">
        <table class="table table-zebra w-full">
            <thead>
                <tr>
                    <th class="font-bold">Variables</th>
                    <th class="font-bold">EO Data Source</th>
                    <th class="font-bold">Rationale for Inclusion</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="font-semibold">Irradiance</td>
                    <td><a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link">GMAO MERRA-2</a></td>
                    <td>Sunlight is the fundamental energy source that powers all the metabolic work crops need to grow and develop. This is categorized into three types: 1) Direct radiation: Direct light from the sun; 2) Diffuse radiation: Light scattered by the atmosphere, clouds, or other objects; and 3) Global radiation: a combination of both, dominated by Direct radiation on clear days. The amount of sunlight intercepted by crops is necessary in providing fundamental energy for physiological processes, primarily photosynthesis (conversion of light, water, and carbon dioxide (CO₂) into plant material) and transpiration (the evaporation of water that helps cool the plant and move nutrients) [2].</td>
                </tr>
                <tr>
                    <td class="font-semibold">Air Temperature</td>
                    <td><a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link">GMAO MERRA-2</a>, <a href="https://www.sciencebase.gov/catalog/item/6837862ed4be025379182951" target="_blank" class="link">Landsat 8/9</a></td>
                    <td>Air temperature, together with solar irradiance, is a major factor that determines how well plants grow. Warmer temperatures (up to a plant's optimal limit) generally mean faster growth, larger leaves, and longer stems. However, when air temperatures rise above the optimal range, it causes high-temperature stress, which can limit plant growth and productivity [11]. On the other hand, low temperatures slow down plant metabolic rates and overall growth due to reduced enzyme activity [1].</td>
                </tr>
                <tr>
                    <td class="font-semibold">Shade</td>
                    <td><a href="https://shademap.app/@48.13743,11.57549,15z,1759686599265t,0b,0p,0m" target="_blank" class="link">ShadeMap</a></td>
                    <td>The amount of shade applied affects stem and leaf growth patterns and yield produced, depending on the use of shade-tolerant or shade-sensitive crops [16]. When imposed early and maintained throughout the plants growing season, studies have shown that constant shade reduced growth severely by around 94% [6][18], however plants that were shaded for 45 days then placed in full light largely recovered from the effects of shading by the final harvest [6]. However, studies also show that shading or decreasing light availability also improved the height growth and seedling height of certain species, regardless of soil quality, which aligns with the characteristics typical of shade-tolerant species [18]. This is consistent with other studies which reported that species which grow well in shade are less equipped to survive severe dry months and vice versa [7]. A successful yield therefore depends on choosing crops that can be suitable to the light conditions specific to the area selected.</td>
                </tr>
                <tr>
                    <td class="font-semibold">Precipitation</td>
                    <td><a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link">GMAO MERRA-2</a></td>
                    <td>Plant growth is also closely associated with precipitation levels. The amount and frequency of precipitation affects soil moisture, affecting plant growth and productivity [9]. Depending on the plant species, different plants react differently to increased precipitation [13]. In most cases, an increase in rainfall have shown to have significant positive effects on photosynthetic capacities of certain species [13]. In tomatoes for example, total precipitation and frequency results in an accelerated and intensive stem elongation, whereas frequent but low amounts of precipitation, coupled with lower temperatures result in slow stem elongation growth [5], thereby producing shorter plants with thick stems. When grown in warm climates, a major factor limiting tomato plant growth, fruit yield, and quality was shown to be intense sunlight and excessively high air temperatures [5][12]. However, research in temperate climates showed that the amount and frequency of rainfall are the primary factors controlling plant development, yield, and quality, suggesting that precipitation has a greater impact than temperature in milder zones [5][14].</td>
                </tr>
                <tr>
                    <td class="font-semibold">Humidity</td>
                    <td><a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link">GMAO MERRA-2</a>, <a href="https://www.sciencebase.gov/catalog/item/6837862ed4be025379182951" target="_blank" class="link">Landsat 8/9</a></td>
                    <td>Humidity is another key factor for plant growth. This variable directly controls how much water a plant loses through transpiration and how wide its leaf pores (also known as stomata) open [15]. By controlling humidity, the rate of a plants capacity to photosynthesize and regulate tissue temperature, also affecting how it absorbs nutrients like calcium. Humidity also regulates water taken in by tissues through condensation and direct vapor uptake [15]. Research suggests that for the best growth, the ideal humidity level is around 85±2%. When humidity drops below suitable levels, it forces the stomata to close slightly, therefore cutting down CO₂ absorption and slowing down photosynthesis. Conversely, when humidity reaches above a plants optimal limits, it reduces the transpiration rate, interfering with the plant's ability to absorb and use nutrients, affecting overall growth and leaf development [4].</td>
                </tr>
                <tr>
                    <td class="font-semibold">Soil Moisture</td>
                    <td><a href="https://catalogue.ceda.ac.uk/uuid/779f116d0477439db1874592add5848c/" target="_blank" class="link">ESA Soil Moisture CCI</a>, <a href="https://www.fao.org/soils-portal/data-hub/soil-maps-and-databases/harmonized-world-soil-database-v20/en/" target="_blank" class="link">FAO HWSD v2.0</a></td>
                    <td>Soil moisture and nutrients are critical for plant growth. The level of soil moisture content allows plants to absorb water, minerals and organic materials within the soil [8]. Increased moist and organic matter content in soil has been shown to accelerate vegetative and reproductive growth in plants [8], positively affecting plant height, stem diameter, number of leaves, and biomass [3].</td>
                </tr>
                <tr>
                    <td class="font-semibold">Air Pollutants (SO₂, O₃, NOₓ)</td>
                    <td><a href="https://dataspace.copernicus.eu/explore-data/data-collections/sentinel-data/sentinel-3" target="_blank" class="link">Copernicus Sentinel-3</a></td>
                    <td>High concentrations of air pollutants such as sulfur dioxide (SO₂), ozone (O₃), and nitrogen oxide (NOₓ) can alter physiological processes, thereby affecting quality and yield of plants [17]. Pollutants also have an effect on the plants photosynthetic capability and leaf longevity [10].</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Mobile: Card view -->
    <div class="md:hidden space-y-4 mb-8">
        <!-- Irradiance -->
        <div class="card bg-base-100 ">
            <div class="card-body p-4">
                <h3 class="font-bold text-lg mb-2">Irradiance</h3>
                <div class="text-sm mb-2">
                    <span class="font-semibold">Data Source:</span>
                    <a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link ml-1">GMAO MERRA-2</a>
                </div>
                <p class="text-sm text-gray-700">Sunlight is the fundamental energy source that powers all the metabolic work crops need to grow and develop. This is categorized into three types: 1) Direct radiation: Direct light from the sun; 2) Diffuse radiation: Light scattered by the atmosphere, clouds, or other objects; and 3) Global radiation: a combination of both, dominated by Direct radiation on clear days. The amount of sunlight intercepted by crops is necessary in providing fundamental energy for physiological processes, primarily photosynthesis (conversion of light, water, and carbon dioxide (CO₂) into plant material) and transpiration (the evaporation of water that helps cool the plant and move nutrients) [2].</p>
            </div>
        </div>

        <!-- Air Temperature -->
        <div class="card bg-base-100 ">
            <div class="card-body p-4">
                <h3 class="font-bold text-lg mb-2">Air Temperature</h3>
                <div class="text-sm mb-2">
                    <span class="font-semibold">Data Source:</span>
                    <a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link ml-1">GMAO MERRA-2</a>,
                    <a href="https://www.sciencebase.gov/catalog/item/6837862ed4be025379182951" target="_blank" class="link ml-1">Landsat 8/9</a>
                </div>
                <p class="text-sm text-gray-700">Air temperature, together with solar irradiance, is a major factor that determines how well plants grow. Warmer temperatures (up to a plant's optimal limit) generally mean faster growth, larger leaves, and longer stems. However, when air temperatures rise above the optimal range, it causes high-temperature stress, which can limit plant growth and productivity [11]. On the other hand, low temperatures slow down plant metabolic rates and overall growth due to reduced enzyme activity [1].</p>
            </div>
        </div>

        <!-- Shade -->
        <div class="card bg-base-100 ">
            <div class="card-body p-4">
                <h3 class="font-bold text-lg mb-2">Shade</h3>
                <div class="text-sm mb-2">
                    <span class="font-semibold">Data Source:</span>
                    <a href="https://shademap.app/@48.13743,11.57549,15z,1759686599265t,0b,0p,0m" target="_blank" class="link ml-1">ShadeMap</a>
                </div>
                <p class="text-sm text-gray-700">The amount of shade applied affects stem and leaf growth patterns and yield produced, depending on the use of shade-tolerant or shade-sensitive crops [16]. When imposed early and maintained throughout the plants growing season, studies have shown that constant shade reduced growth severely by around 94% [6][18], however plants that were shaded for 45 days then placed in full light largely recovered from the effects of shading by the final harvest [6]. However, studies also show that shading or decreasing light availability also improved the height growth and seedling height of certain species, regardless of soil quality, which aligns with the characteristics typical of shade-tolerant species [18]. This is consistent with other studies which reported that species which grow well in shade are less equipped to survive severe dry months and vice versa [7]. A successful yield therefore depends on choosing crops that can be suitable to the light conditions specific to the area selected.</p>
            </div>
        </div>

        <!-- Precipitation -->
        <div class="card bg-base-100 ">
            <div class="card-body p-4">
                <h3 class="font-bold text-lg mb-2">Precipitation</h3>
                <div class="text-sm mb-2">
                    <span class="font-semibold">Data Source:</span>
                    <a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link ml-1">GMAO MERRA-2</a>
                </div>
                <p class="text-sm text-gray-700">Plant growth is also closely associated with precipitation levels. The amount and frequency of precipitation affects soil moisture, affecting plant growth and productivity [9]. Depending on the plant species, different plants react differently to increased precipitation [13]. In most cases, an increase in rainfall have shown to have significant positive effects on photosynthetic capacities of certain species [13]. In tomatoes for example, total precipitation and frequency results in an accelerated and intensive stem elongation, whereas frequent but low amounts of precipitation, coupled with lower temperatures result in slow stem elongation growth [5], thereby producing shorter plants with thick stems. When grown in warm climates, a major factor limiting tomato plant growth, fruit yield, and quality was shown to be intense sunlight and excessively high air temperatures [5][12]. However, research in temperate climates showed that the amount and frequency of rainfall are the primary factors controlling plant development, yield, and quality, suggesting that precipitation has a greater impact than temperature in milder zones [5][14].</p>
            </div>
        </div>

        <!-- Humidity -->
        <div class="card bg-base-100 ">
            <div class="card-body p-4">
                <h3 class="font-bold text-lg mb-2">Humidity</h3>
                <div class="text-sm mb-2">
                    <span class="font-semibold">Data Source:</span>
                    <a href="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/data-access_merra-2/" target="_blank" class="link ml-1">GMAO MERRA-2</a>,
                    <a href="https://www.sciencebase.gov/catalog/item/6837862ed4be025379182951" target="_blank" class="link ml-1">Landsat 8/9</a>
                </div>
                <p class="text-sm text-gray-700">Humidity is another key factor for plant growth. This variable directly controls how much water a plant loses through transpiration and how wide its leaf pores (also known as stomata) open [15]. By controlling humidity, the rate of a plants capacity to photosynthesize and regulate tissue temperature, also affecting how it absorbs nutrients like calcium. Humidity also regulates water taken in by tissues through condensation and direct vapor uptake [15]. Research suggests that for the best growth, the ideal humidity level is around 85±2%. When humidity drops below suitable levels, it forces the stomata to close slightly, therefore cutting down CO₂ absorption and slowing down photosynthesis. Conversely, when humidity reaches above a plants optimal limits, it reduces the transpiration rate, interfering with the plant's ability to absorb and use nutrients, affecting overall growth and leaf development [4].</p>
            </div>
        </div>

        <!-- Soil Moisture -->
        <div class="card bg-base-100 ">
            <div class="card-body p-4">
                <h3 class="font-bold text-lg mb-2">Soil Moisture</h3>
                <div class="text-sm mb-2">
                    <span class="font-semibold">Data Source:</span>
                    <a href="https://catalogue.ceda.ac.uk/uuid/779f116d0477439db1874592add5848c/" target="_blank" class="link ml-1">ESA Soil Moisture CCI</a>,
                    <a href="https://www.fao.org/soils-portal/data-hub/soil-maps-and-databases/harmonized-world-soil-database-v20/en/" target="_blank" class="link ml-1">FAO HWSD v2.0</a>
                </div>
                <p class="text-sm text-gray-700">Soil moisture and nutrients are critical for plant growth. The level of soil moisture content allows plants to absorb water, minerals and organic materials within the soil [8]. Increased moist and organic matter content in soil has been shown to accelerate vegetative and reproductive growth in plants [8], positively affecting plant height, stem diameter, number of leaves, and biomass [3].</p>
            </div>
        </div>

        <!-- Air Pollutants -->
        <div class="card bg-base-100 ">
            <div class="card-body p-4">
                <h3 class="font-bold text-lg mb-2">Air Pollutants (SO₂, O₃, NOₓ)</h3>
                <div class="text-sm mb-2">
                    <span class="font-semibold">Data Source:</span>
                    <a href="https://dataspace.copernicus.eu/explore-data/data-collections/sentinel-data/sentinel-3" target="_blank" class="link ml-1">Copernicus Sentinel-3</a>
                </div>
                <p class="text-sm text-gray-700">High concentrations of air pollutants such as sulfur dioxide (SO₂), ozone (O₃), and nitrogen oxide (NOₓ) can alter physiological processes, thereby affecting quality and yield of plants [17]. Pollutants also have an effect on the plants photosynthetic capability and leaf longevity [10].</p>
            </div>
        </div>
    </div>

    <!-- Bibliography -->
    <h3 class="text-2xl font-bold text-black mb-4">Bibliography</h3>
    <div class="text-sm space-y-2 mb-6">
        <p>[1] Al-Rajab, J. M. (2021). Environmental temperature and crop production. In <em>Agro-Hydrometeorology</em> (Chapter 3).</p>
        <p>[2] Campillo, C., Fortes, R., & Prieto, H. (2012). Solar radiation effect on crop production. In A. G. S. I. O. (Ed.), <em>Agricultural and food sciences, environmental science</em> (pp. 169-183). IntechOpen</p>
        <p>[3] Chadha A, Florentine SK, Chauhan BS, Long B, Jayasundera M. Influence of soil moisture regimes on growth, photosynthetic capacity, leaf biochemistry and reproductive capabilities of the invasive agronomic weed; Lactuca serriola. PLoS One. 2019 Jun 28;14(6):e0218191.</p>
        <p>[4] Chia, S. Y. and Lim, M. W., "A critical review on the influence of humidity for plant growth forecasting", in <em>Materials Science and Engineering Conference Series</em>, 2022, vol. 1257, no. 1, Art. no. 012001.</p>
        <p>[5] Jędrszczyk, E., Skowera, B., Gawęda, M., & Libik, A. (2016). The effect of temperature and precipitation conditions on the growth and development dynamics of five cultivars of processing tomato. <em>Journal of Horticultural Research</em>, 15(3), 63–74.</p>
        <p>[6] Gibson, K. D., Fischer, A. J., & Foin, T. C. (2001). Shading and the growth and photosynthetic responses of <em>Ammannia coccinnea</em>. <em>Weed Research</em>, 41(1), 59–67.</p>
        <p>[7] Kupers, S.J.; Wirth, C.; Engelbrecht, B.M.; Hernández, A.; Condit, R.; Wright, S.J.; Rüger, N. Performance of tropical forest seedlings under shade and drought: An interspecific trade-off in demographic responses. <em>Sci. Rep.</em> 2019, 9, 1–11.</p>
        <p>[8] Lee, EP., Han, YS., Lee, SI. et al. Effect of nutrient and moisture on the growth and reproduction of <em>Epilobium hirsutum</em> L., an endangered plant. <em>j ecology environ</em> 41, 35 (2017).</p>
        <p>[9] Morecroft, Mike & Paterson, James. (2007). Effects of Temperature and Precipitation Changes on Plant Communities.</p>
        <p>[10] Ogunkunle, C. O., Suleiman, L. B., Oyedeji, S., Awotoye, O. O., & Fatoba, P. O. (2022). Effects of Air Contamination on Agriculture. In K. B. S. M. Varma (Ed.), <em>Sustainable Plant Nutrition under Contaminated Environments</em> (pp. 1–16). Springer International Publishing.</p>
        <p>[11] Ozkaynak, E. (2013). Effects of Air Temperature and Hours of Sunlight on the Length of the Vegetation Period and the Yield of Some Field Crops. <em>Ekoloji</em>, 22(87), 58–63.</p>
        <p>[12] Rajasekar M., Arumugam T., Ramesh Kumar S. 2013. Influence of weather and growing environment on vegetable growth and field. Journal of Horticulture and Forestry 5(10): 160-167.</p>
        <p>[13] Song, B., Niu, S., & Wan, S. (2016). Precipitation regulates plant gas exchange and its long-term response to climate change in a temperate grassland. <em>Journal of Plant Ecology</em>, 9(5), 531–541.</p>
        <p>[14] Skowera B., Jędrszczyk E., Kopcińska J., Ambroszczyk A.M., Kołton A. 2014b. The effects of hydrothermal conditions during vegetation period on fruit quality of processing tomatoes. Polish of Journal Environmental Studies 23(1): 195-202</p>
        <p>[15] Tibbitts, Theodore. (1979). Humidity and Plants. BioScience. 29. 358-363.</p>
        <p>[16] Wang, J., Yao, R., Sun, Z., Wang, M., Jiang, C., Zhao, X., Liu, X., Zhong, C., Zhang, H., Zhao, S., Wang, X., & Yu, H. (2024). Effects of shading on morphology, photosynthesis characteristics, and yield of different shade-tolerant peanut varieties at the flowering stage. <em>Frontiers in Plant Science</em>, 15, Article 1429800.</p>
        <p>[17] Winner, W. E., & Atkinson, C. J. (1986). Absorption of air pollution by plants, and consequences for growth. <em>Trends in Ecology & Evolution</em>, 1(1), 15–18.</p>
        <p>[18] Youn, W. B., Hernandez, J. O., & Park, B. B. (2021). Effects of Shade and Planting Methods on the Growth of <em>Heracleum moellendorffii</em> and <em>Adenophora divaricata</em> in Different Soil Moisture and Nutrient Conditions. <em>Plants</em>, 10(10), 2203.</p>
    </div>
</div>
