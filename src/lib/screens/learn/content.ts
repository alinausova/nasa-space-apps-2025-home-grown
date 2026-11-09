import type { LearnTab } from '../../router/paths';

const BASE = import.meta.env.BASE_URL;

export const TAB_INFO: Record<LearnTab, { n: string; label: string; title: string; intro: string }> = {
  about: {
    n: '01',
    label: 'About',
    title: 'Who we are and why we built it',
    intro: 'A NASA Space Apps 2025 project by six people across climate science, engineering and communication.',
  },
  scoring: {
    n: '02',
    label: 'How scoring works',
    title: 'How a crop gets its score',
    intro: 'Four weighted parts, checked against each crop’s own needs from published crop research. Here is every formula we use.',
  },
  data: {
    n: '03',
    label: 'Data sources',
    title: 'Where the data comes from',
    intro: 'What your results are built on: NASA climate data, and the published crop studies behind every number we use.',
  },
  architecture: {
    n: '04',
    label: 'Architecture',
    title: 'How the system runs',
    intro: 'From the shape you draw to a ranked list of crops, in five steps.',
  },
  impact: {
    n: '05',
    label: 'Impact',
    title: 'Why growing food in cities matters',
    intro: 'Home Grown supports five of the UN Sustainable Development Goals.',
  },
};

export const TAB_ORDER: LearnTab[] = ['about', 'scoring', 'data', 'architecture', 'impact'];

// About -----------------------------------------------------------------------

export const QUESTIONS = [
  'Which crop suits it best?',
  'When should you plant it?',
  'How much should it yield?',
  'Does it need irrigation?',
  'How should the planting be laid out?',
  'How long is the growing season?',
  'What is the climate like through the year?',
];

export const TEAM = [
  { name: 'Vishnu Sunil Kumar', role: 'Climate science', photo: `${BASE}team/vishnu.jpg`, linkedin: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { name: 'Alina Usova', role: 'Full-stack engineering', photo: `${BASE}team/alina.JPG`, linkedin: 'https://www.linkedin.com/in/alina-usova-21868a165/' },
  { name: 'Franz Josef Birkeneder', role: 'Back-end engineering', photo: `${BASE}team/franz.jpg`, linkedin: 'https://www.linkedin.com/in/franz-birkeneder-19520ba9/' },
  { name: 'Guillaume Leclerc', role: 'Geospatial engineering', photo: `${BASE}team/guillaume.jpg`, linkedin: 'https://www.linkedin.com/in/guillaume-leclerc1/' },
  { name: 'Angela Rubilla', role: 'Research and analysis', photo: `${BASE}team/angela.jpg`, linkedin: 'https://www.linkedin.com/in/angelarubilla/' },
  { name: 'Katy Larkin', role: 'Communications', photo: `${BASE}team/katy.jpg`, linkedin: 'https://www.linkedin.com/in/katylarkin/' },
];

export const RECOGNITION_FEATURED = {
  eyebrow: 'Winner · 19 Nov 2025',
  title: 'Pitch Perfect, Capacity-building Hub at COP30',
  where: 'UN Climate Change Conference · Belém, Brazil · run by UN University (UNU-VIE) and Youth4Capacity',
  body: 'Vishnu Sunil Kumar pitched Home Grown as “Food Secure Cities of Tomorrow” and won the audience and mentor vote.',
};

export const RECOGNITION = [
  { year: '2026', title: 'Climate Pitch, Munich Climate Week', body: 'Pitched Home Grown in Munich' },
  { year: '2026', title: 'Climate Café, Global Shapers Munich and TUM Think Tank', body: 'Presented Home Grown in Munich' },
  { year: '2025', title: 'Where it started: NASA International Space Apps Challenge', body: 'The first version of Home Grown was built here, in a weekend' },
];

export const CONTACT = [
  { title: 'Contact the team', body: 'Vishnu Sunil Kumar on LinkedIn', href: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { title: 'Report an issue', body: 'Bugs and feature requests on GitHub', href: 'https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues' },
];

// Scoring ---------------------------------------------------------------------

export const SCORE_PARTS = [
  { weight: 35, title: 'Heat', body: 'Growing degree days against what the crop needs. Just enough scores 80; full marks need a quarter to spare.' },
  { weight: 25, title: 'Sunlight', body: 'Sun hours after shade against the optimum.' },
  { weight: 25, title: 'Temperature', body: 'Each growing day scored against the crop’s ideal range, falling to zero at its base and upper limits.' },
  { weight: 15, title: 'Water', body: 'Rain while it grows against its seasonal need. A shortfall costs more than a surplus.' },
];

export const FORMULAS = [
  {
    title: 'Growing season',
    body: 'A crop only grows on days averaging above its base temperature, inside the months its calendar grows through. Lettuce 4°C, tomatoes 7°C, peppers 10°C.',
    code: 'growing_day  =  T_avg > T_base',
  },
  {
    title: 'Sunshine hours',
    body: '0.278 converts MJ to kWh. 0.35 kW/m² is the average intensity in sunny periods. Capped at 16 hours. Without shade data, multiplied by 0.7 for buildings.',
    code: 'sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35',
  },
  {
    title: 'Temperature response',
    body: 'Full marks inside the crop’s ideal range, a straight line down to zero at its base and upper temperature, averaged over its growing days. The same response the FAO EcoCrop model uses.',
    code: 'r(T) = 1                        ideal_min ≤ T ≤ ideal_max\nr(T) = (T − T_base) / (ideal_min − T_base)   below\nr(T) = (T_upper − T) / (T_upper − ideal_max)  above',
  },
  {
    title: 'Weakest factor',
    body: 'Plenty of rain cannot make up for a crop being too cold. The score stays within 12 points of the weakest of heat, sun and temperature. Water is left out: watering fixes it. The 12 is our choice.',
    code: 'score = min(weighted_average,\n            min(heat, sun, temperature) + 12)',
  },
  {
    title: 'Growing degree days',
    body: 'Highs above the crop’s upper limit count as the limit, lows below the base count as the base. Method from the FAO56 revision.',
    code: 'GDD = T_avg − T_base    when T_avg > T_base',
  },
  {
    title: 'Plot area',
    body: 'Shoelace formula on an equirectangular projection. Under 5% error for plots less than 10 km a side.',
    code: 'x = R × lon × cos(lat₀)\ny = R × lat\nR = 6,371,000 m',
  },
  {
    title: 'Yield',
    body: '70% of the plot is planted, the rest is paths. 90+ gets the upper-bound yield, 50 to 89 is scaled, under 50 is minimal.',
    code: 'yield = area × 0.7 × kg_per_m²(score)',
  },
];

// Data ------------------------------------------------------------------------

export const DATA_USED = [
  { variable: 'Irradiance', source: 'NASA POWER (CERES)', why: 'Sunlight powers photosynthesis and transpiration.', refs: '[2]' },
  { variable: 'Air temperature', source: 'NASA POWER (MERRA-2)', why: 'Growth speeds up to a crop’s optimum, then heat stress sets in.', refs: '[1][11]' },
  { variable: 'Surface temperature', source: 'Landsat 8/9, via Microsoft Planetary Computer', why: 'Shows how much warmer the plot’s surface runs than the air, at 30 m detail. Reported alongside the scores, not used in them.', refs: '' },
  { variable: 'Precipitation', source: 'NASA POWER (MERRA-2)', why: 'Sets soil moisture. In mild climates it matters more than temperature.', refs: '[5][9][14]' },
  { variable: 'Shade', source: 'Assumed: 30% of sunlight lost to buildings', why: 'Constant shade can cut growth by about 94%.', refs: '[6][16][18]' },
];

/** Where each crop number comes from (api/crop_database.py) and what it drives. Refs point into BIBLIOGRAPHY. */
export const CROP_DATA = [
  { variable: 'Base and upper temperature', source: 'Consolidated thresholds from Paredes et al. for 43 crops. Kale and arugula use cabbage-family values.', why: 'Which days count towards growth, in the heat score and the calendar.', refs: '[20][28]' },
  { variable: 'Heat units to first harvest', source: 'Field-measured totals from Paredes et al. for 16 crops and Oregon State’s Croptime for tomatoes, peppers, cucumbers and green beans. The other 25 are estimates, from FAO ECOCROP crop cycles for the newest crops.', why: 'Heat score, the cap on every score, and when a sowing is ready.', refs: '[27][28]' },
  { variable: 'Ideal temperature range', source: 'FAO ECOCROP for the newest crops; team estimates for the original 31, being checked against ECOCROP', why: 'Temperature score over the growing season.', refs: '[26]' },
  { variable: 'Frost tolerance', source: 'Team estimates', why: 'Which frosts end a sowing in the calendar.', refs: '' },
  { variable: 'Water need per season', source: 'FAO Irrigation and Drainage Paper 56 and FAO Irrigation Water Management Training Manual 3', why: 'Water score: growing-season rain against this need.', refs: '[19][29]' },
  { variable: 'Germination temperatures', source: 'J. F. Harrington, UC Davis', why: 'The week after sowing has to be warm enough for seeds to come up.', refs: '[21]' },
  { variable: 'Sun hours', source: 'University extension services (Rutgers, Penn State, Maryland, Michigan State)', why: 'Sunlight score, and crops below their minimum are left out.', refs: '[24]' },
  { variable: 'Yield per m²', source: 'Michigan State University Extension, La Ferme de Sainte Marthe, Knott’s Handbook, University of Vermont Extension; FAOSTAT world averages for field crops', why: 'Expected harvest on the planted 70% of the plot.', refs: '[22][23][30][31][32]' },
  { variable: 'Drought tolerance', source: 'Estimated from crop type; Nemeskéri & Helyes for peas, beans, tomatoes and sweet corn', why: 'Shown as a tag. Not used in the score.', refs: '[25]' },
];

export const DATA_RESEARCHED = [
  { variable: 'Shade, measured', source: 'ShadeMap', why: 'Real shadow hours per plot instead of the 30% assumption.', refs: '[6][16][18]' },
  { variable: 'Humidity', source: 'GMAO MERRA-2', why: 'Controls water loss. Growth peaks around 85%.', refs: '[4][15]' },
  { variable: 'Soil moisture', source: 'ESA CCI, FAO HWSD v2.0', why: 'Lets roots take up water and nutrients.', refs: '[3][8]' },
  { variable: 'Air pollutants', source: 'Copernicus Sentinel-3', why: 'SO₂, O₃ and NOₓ reduce photosynthesis and yield.', refs: '[10][17]' },
];

export const BIBLIOGRAPHY = [
  'Al-Rajab, J. M. (2021). Environmental temperature and crop production.',
  'Campillo, C. et al. (2012). Solar radiation effect on crop production.',
  'Chadha, A. et al. (2019). Influence of soil moisture regimes on Lactuca serriola. PLoS One.',
  'Chia, S. Y. & Lim, M. W. (2022). Humidity for plant growth forecasting.',
  'Jędrszczyk, E. et al. (2016). Temperature and precipitation on processing tomato.',
  'Gibson, K. D. et al. (2001). Shading and Ammannia coccinea. Weed Research.',
  'Kupers, S. J. et al. (2019). Tropical seedlings under shade and drought. Sci. Rep.',
  'Lee, E. P. et al. (2017). Nutrient and moisture on Epilobium hirsutum.',
  'Morecroft, M. & Paterson, J. (2007). Temperature and precipitation changes on plant communities.',
  'Ogunkunle, C. O. et al. (2022). Effects of air contamination on agriculture.',
  'Ozkaynak, E. (2013). Air temperature and sunlight on field crops. Ekoloji.',
  'Rajasekar, M. et al. (2013). Weather and vegetable growth.',
  'Song, B. et al. (2016). Precipitation regulates plant gas exchange. J. Plant Ecology.',
  'Skowera, B. et al. (2014). Hydrothermal conditions and tomato quality.',
  'Tibbitts, T. (1979). Humidity and plants. BioScience.',
  'Wang, J. et al. (2024). Shading on shade-tolerant peanut varieties.',
  'Winner, W. E. & Atkinson, C. J. (1986). Absorption of air pollution by plants.',
  'Youn, W. B. et al. (2021). Shade and planting methods on Heracleum moellendorffii.',
  'Allen, R. G., Pereira, L. S., Raes, D. & Smith, M. (1998). Crop evapotranspiration. FAO Irrigation and Drainage Paper 56.',
  'Paredes, P. et al. (2025). Base and upper temperature thresholds to support the calculation of growing degree days aiming at their use with the FAO56rev crop coefficients curve: a review. Agricultural Water Management 319, 109755.',
  'Harrington, J. F. (1954). Soil temperature conditions for vegetable seed germination. University of California, Davis, Agricultural Extension.',
  'Michigan State University Extension. Vegetable yields per 100 square feet (Table 4).',
  'La Ferme de Sainte Marthe. Vegetable yields per square metre.',
  'Rutgers, Penn State, University of Maryland and Michigan State University Extension. Sunlight needs of vegetable crops.',
  'Nemeskéri, E. & Helyes, L. (2019). Physiological responses of selected vegetable crop species to water stress. Agronomy 9(8), 447.',
  'FAO. ECOCROP crop environmental requirements database. Copy used: OpenCLIM ecocrop, EcoCrop_DB.csv.',
  'Andrews, N., Coop, L., Stoven, H., Noordijk, H. & Heinrich, A. Vegetable degree-day models: an introduction for farmers and gardeners. Oregon State University Extension, EM 9305.',
  'Paredes, P. et al. (2025). Estimating the lengths of crop growth stages to define the crop coefficient curves using growing degree days (GDD): application of the revised FAO56 guidelines. Agricultural Water Management 319, 109758.',
  'Brouwer, C. & Heibloem, M. (1986). Irrigation water management: irrigation water needs. FAO Training Manual 3.',
  'Maynard, D. N. & Hochmuth, G. J. (2007). Knott’s Handbook for Vegetable Growers, 5th edition. Wiley.',
  'University of Vermont Extension. Vegetable and berry crop yield estimates for New England.',
  'FAO (2025). FAOSTAT Crops and livestock products: world yields 2024. Bulk download, and via Our World in Data.',
];

// Architecture ----------------------------------------------------------------

export const PIPELINE = [
  { title: 'Measure the plot', body: 'Centre point and area in square metres.' },
  { title: 'Fetch the climate', body: 'NASA POWER: a year of daily heat, sun and rain. Shown as soon as it arrives.' },
  { title: 'Read Landsat', body: 'Landsat 8/9 surface readings at 30 m show how much warmer the plot runs than the air. The scores use NASA’s air temperatures.' },
  { title: 'Score every crop', body: 'Heat, sun, temperature and water for each crop.' },
  { title: 'Rank and reply', body: 'Sorted by score, with yield and irrigation. A short summary from Mistral AI follows.' },
];

export const STACK = [
  { title: 'Front end', body: 'Svelte 5, TypeScript, Mapbox GL JS, Turf.js' },
  { title: 'Back end', body: 'FastAPI in Python, crop database, Mistral AI summaries and crop tips' },
  { title: 'Data', body: 'NASA POWER, Microsoft Planetary Computer (Landsat)' },
  { title: 'Hosting', body: 'GitHub Pages and Render' },
];

export const ASSUMPTIONS =
  'Climate comes from one year of daily data. Soil is ignored, because city gardens usually bring their own. Watering counts for little, because small plots are easy to water. Without shade data, 30% of sunlight is assumed lost to buildings.';

// Impact ----------------------------------------------------------------------

export const SDGS = [
  { n: 2, title: 'Zero hunger', points: ['Food security', 'Better nutrition'], body: 'Fresh food close to home, with less reliance on long supply chains.' },
  { n: 3, title: 'Good health and well-being', points: ['Healthier diets', 'Mental health', 'Cleaner air'], body: 'Fresh produce, time outdoors and greenery that cools the street.' },
  { n: 10, title: 'Reduced inequalities', points: ['Fair access', 'Lower grocery bills'], body: 'Affordable food in neighbourhoods that lack it.' },
  { n: 11, title: 'Sustainable cities', points: ['Unused space', 'Climate resilience', 'Community'], body: 'Roofs and balconies become productive and soak up stormwater.' },
  { n: 12, title: 'Responsible consumption', points: ['Less waste', 'Lower emissions'], body: 'Scraps become compost and food travels metres, not continents.' },
];
