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
    intro: 'Four weighted parts, checked against each crop’s own needs. Here is every formula we use.',
  },
  data: {
    n: '03',
    label: 'Data sources',
    title: 'Where the data comes from',
    intro: 'What your results are built on today, and the other variables we researched for later.',
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

// TODO(redesign v3): add "When should you plant it?" once the planting calendar ships.
export const QUESTIONS = [
  'Which crop suits it best?',
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
  // TODO: confirm the Climate Café year with the team (assumed 2026 in the design handoff).
  { year: '2026', title: 'Climate Café, Global Shapers Munich and TUM Think Tank', body: 'Presented Home Grown in Munich' },
  { year: '2025', title: 'Where it started: NASA International Space Apps Challenge', body: 'Built in a weekend for the 2025 hackathon' },
];

export const CONTACT = [
  { title: 'Contact the team', body: 'Message Vishnu Sunil Kumar on LinkedIn', href: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { title: 'Report a bug', body: 'or suggest a feature on GitHub', href: 'https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues' },
];

// Scoring ---------------------------------------------------------------------

export const SCORE_PARTS = [
  { weight: 35, title: 'Heat', body: 'Growing degree days against what the crop needs.' },
  { weight: 25, title: 'Sunlight', body: 'Sun hours after shade against the optimum.' },
  { weight: 25, title: 'Temperature', body: 'Full marks when the year’s average is within 3°C of the crop’s ideal.' },
  { weight: 15, title: 'Water', body: 'Rainfall against seasonal need.' },
];

export const FORMULAS = [
  {
    title: 'Growing season',
    body: 'A crop only grows on days averaging above its base temperature. Lettuce 4°C, tomatoes 8.5°C, peppers 10°C.',
    code: 'growing_day  =  T_avg > T_base',
  },
  {
    title: 'Sunshine hours',
    body: '0.278 converts MJ to kWh. 0.35 kW/m² is the average intensity in sunny periods. Capped at 16 hours. Without shade data, multiplied by 0.7 for buildings.',
    code: 'sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35',
  },
  {
    title: 'Growing degree days',
    body: 'Highs above the crop’s upper limit count as the limit, lows below the base count as the base. Based on FAO56.',
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
  { variable: 'Surface temperature', source: 'Landsat, via Microsoft Planetary Computer', why: 'Sharper local readings on the days a clear scene exists.', refs: '' },
  { variable: 'Precipitation', source: 'NASA POWER (MERRA-2)', why: 'Sets soil moisture. In mild climates it matters more than temperature.', refs: '[5][9][14]' },
  { variable: 'Shade', source: 'Assumed: 30% of sunlight lost to buildings', why: 'Constant shade can cut growth by about 94%.', refs: '[6][16][18]' },
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
];

// Architecture ----------------------------------------------------------------

export const PIPELINE = [
  { title: 'Measure the plot', body: 'Centre point and area in square metres.' },
  { title: 'Fetch data in parallel', body: 'NASA POWER for a year of daily climate, Landsat for surface temperature.' },
  { title: 'Combine the two', body: 'Where clear Landsat scenes exist, their sharper readings fill in the 50 km NASA grid.' },
  { title: 'Score every crop', body: 'Heat, sun, temperature and water for each crop.' },
  { title: 'Rank and reply', body: 'Sorted by score, with yield, irrigation and a short summary from Mistral AI.' },
];

export const STACK = [
  { title: 'Front end', body: 'Svelte 5, TypeScript, Mapbox GL JS, Turf.js' },
  { title: 'Back end', body: 'FastAPI in Python, crop database, Mistral AI summaries' },
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
