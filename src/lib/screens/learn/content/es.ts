import type { LearnTab } from '../../../router/paths';
import { TEAM as TEAM_EN } from './en';

// Spanish Learn pages, neutral for Latin America and Spain. Bibliography entries stay in their original language.
export { TAB_ORDER, BIBLIOGRAPHY } from './en';

const ROLES = ['Ciencias del clima', 'Ingeniería full-stack', 'Ingeniería back-end', 'Ingeniería geoespacial', 'Investigación y análisis', 'Comunicación'];

export const TAB_INFO: Record<LearnTab, { n: string; label: string; title: string; intro: string }> = {
  about: {
    n: '01',
    label: 'Acerca de',
    title: 'Quiénes somos y por qué lo creamos',
    intro: 'Un proyecto de NASA Space Apps 2025 hecho por seis personas de ciencias del clima, ingeniería y comunicación.',
  },
  scoring: {
    n: '02',
    label: 'Cómo funciona la puntuación',
    title: 'Cómo obtiene un cultivo su puntuación',
    intro: 'Cuatro partes ponderadas, comparadas con las necesidades de cada cultivo según la investigación agrícola publicada. Aquí está cada fórmula que usamos.',
  },
  data: {
    n: '03',
    label: 'Fuentes de datos',
    title: 'De dónde vienen los datos',
    intro: 'En qué se basan tus resultados: datos climáticos de la NASA y los estudios de cultivos publicados detrás de cada número que usamos.',
  },
  architecture: {
    n: '04',
    label: 'Arquitectura',
    title: 'Cómo funciona el sistema',
    intro: 'De la forma que dibujas a una lista de cultivos ordenada, en cinco pasos.',
  },
  impact: {
    n: '05',
    label: 'Impacto',
    title: 'Por qué importa cultivar alimentos en las ciudades',
    intro: 'Home Grown contribuye a cinco de los Objetivos de Desarrollo Sostenible de la ONU.',
  },
};

// About -----------------------------------------------------------------------

export const QUESTIONS = [
  '¿Qué cultivo le va mejor?',
  '¿Cuándo deberías plantarlo?',
  '¿Cuánto debería rendir?',
  '¿Necesita riego?',
  '¿Cómo debería distribuirse la siembra?',
  '¿Cuánto dura la temporada de cultivo?',
  '¿Cómo es el clima a lo largo del año?',
];

export const TEAM = TEAM_EN.map((person, i) => ({ ...person, role: ROLES[i] }));

export const RECOGNITION_FEATURED = {
  eyebrow: 'Ganador · 19 nov. 2025',
  title: 'Pitch Perfect, Capacity-building Hub en la COP30',
  where: 'Conferencia de las Naciones Unidas sobre el Cambio Climático · Belém, Brasil · organizado por la Universidad de las Naciones Unidas (UNU-VIE) y Youth4Capacity',
  body: 'Vishnu Sunil Kumar presentó Home Grown como “Food Secure Cities of Tomorrow” y ganó la votación del público y de los mentores.',
};

export const RECOGNITION = [
  { year: '2026', title: 'Climate Pitch, Munich Climate Week', body: 'Presentamos Home Grown en Múnich' },
  { year: '2026', title: 'Climate Café, Global Shapers Munich y TUM Think Tank', body: 'Presentamos Home Grown en Múnich' },
  { year: '2025', title: 'Donde empezó: NASA International Space Apps Challenge', body: 'La primera versión de Home Grown se creó aquí, en un fin de semana' },
];

export const CONTACT = [
  { title: 'Contacta al equipo', body: 'Vishnu Sunil Kumar en LinkedIn', href: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { title: 'Reporta un problema', body: 'Errores y sugerencias en GitHub', href: 'https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues' },
];

// Scoring ---------------------------------------------------------------------

export const SCORE_PARTS = [
  { weight: 35, title: 'Calor', body: 'Grados-día de crecimiento frente a lo que necesita el cultivo. Lo justo da 80; la puntuación máxima requiere un cuarto de margen.' },
  { weight: 25, title: 'Luz solar', body: 'Horas de sol descontando la sombra, frente al óptimo.' },
  { weight: 25, title: 'Temperatura', body: 'Cada día de crecimiento se puntúa frente al rango ideal del cultivo y baja a cero en sus límites base y superior.' },
  { weight: 15, title: 'Agua', body: 'Lluvia mientras crece frente a su necesidad de la temporada. La falta cuesta más que el exceso.' },
];

export const FORMULAS = [
  {
    title: 'Temporada de cultivo',
    body: 'Un cultivo solo crece los días cuya media supera su temperatura base, dentro de los meses de su calendario de crecimiento. Lechuga 4°C, tomates 7°C, pimientos 10°C.',
    code: 'growing_day  =  T_avg > T_base',
  },
  {
    title: 'Horas de sol',
    body: '0,278 convierte MJ en kWh. 0,35 kW/m² es la intensidad media en periodos soleados. Máximo de 16 horas. Sin datos de sombra, se multiplica por 0,7 por los edificios.',
    code: 'sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35',
  },
  {
    title: 'Respuesta a la temperatura',
    body: 'Puntuación máxima dentro del rango ideal del cultivo, una línea recta hasta cero en su temperatura base y superior, promediada sobre sus días de crecimiento. Es la misma respuesta que usa el modelo EcoCrop de la FAO.',
    code: 'r(T) = 1                        ideal_min ≤ T ≤ ideal_max\nr(T) = (T − T_base) / (ideal_min − T_base)   below\nr(T) = (T_upper − T) / (T_upper − ideal_max)  above',
  },
  {
    title: 'Factor más débil',
    body: 'Mucha lluvia no compensa que un cultivo pase frío. La puntuación se queda a 12 puntos como máximo del valor más débil entre calor, sol y temperatura. El agua no cuenta aquí, porque el riego la resuelve. El 12 lo elegimos nosotros.',
    code: 'score = min(weighted_average,\n            min(heat, sun, temperature) + 12)',
  },
  {
    title: 'Grados-día de crecimiento',
    body: 'Las máximas por encima del límite superior del cultivo cuentan como ese límite, y las mínimas por debajo de la base cuentan como la base. Método de la revisión de FAO56.',
    code: 'GDD = T_avg − T_base    when T_avg > T_base',
  },
  {
    title: 'Área de la parcela',
    body: 'Fórmula del área de Gauss sobre una proyección equirrectangular. Menos del 5 % de error para parcelas de menos de 10 km de lado.',
    code: 'x = R × lon × cos(lat₀)\ny = R × lat\nR = 6,371,000 m',
  },
  {
    title: 'Rendimiento',
    body: 'Se siembra el 70 % de la parcela y el resto son caminos. Con 90 o más se usa el rendimiento máximo, de 50 a 89 se escala y por debajo de 50 es mínimo.',
    code: 'yield = area × 0.7 × kg_per_m²(score)',
  },
];

// Data ------------------------------------------------------------------------

export const DATA_USED = [
  { variable: 'Irradiancia', source: 'NASA POWER (CERES)', why: 'La luz solar impulsa la fotosíntesis y la transpiración.', refs: '[2]' },
  { variable: 'Temperatura del aire', source: 'NASA POWER (MERRA-2)', why: 'El crecimiento se acelera hasta el óptimo del cultivo y luego aparece el estrés por calor.', refs: '[1][11]' },
  {
    variable: 'Temperatura de superficie',
    source: 'Landsat 8/9, a través de Microsoft Planetary Computer',
    why: 'Muestra cuánto más caliente está la superficie de la parcela que el aire, con detalle de 30 m. Se muestra junto a las puntuaciones, pero no se usa en ellas.',
    refs: '',
  },
  { variable: 'Precipitación', source: 'NASA POWER (MERRA-2)', why: 'Determina la humedad del suelo. En climas templados importa más que la temperatura.', refs: '[5][9][14]' },
  { variable: 'Sombra', source: 'Supuesto: los edificios bloquean el 30 % de la luz solar', why: 'La sombra constante puede reducir el crecimiento en un 94 % aproximadamente.', refs: '[6][16][18]' },
];

export const CROP_DATA = [
  {
    variable: 'Temperatura base y superior',
    source: 'Umbrales consolidados de Paredes et al. para 43 cultivos. La col rizada (kale) y la rúcula usan valores de la familia del repollo.',
    why: 'Qué días cuentan para el crecimiento, en la puntuación de calor y en el calendario.',
    refs: '[20][28]',
  },
  {
    variable: 'Unidades de calor hasta la primera cosecha',
    source:
      'Totales medidos en campo de Paredes et al. para 16 cultivos y Croptime de Oregon State para tomates, pimientos, pepinos y frijoles verdes. Los otros 25 son estimaciones, a partir de los ciclos de cultivo de FAO ECOCROP para los cultivos más recientes.',
    why: 'Puntuación de calor, el tope de cada puntuación y cuándo está lista una siembra.',
    refs: '[27][28]',
  },
  {
    variable: 'Rango ideal de temperatura',
    source: 'FAO ECOCROP para los cultivos más recientes; estimaciones del equipo para los 31 originales, que se están contrastando con ECOCROP',
    why: 'Puntuación de temperatura a lo largo de la temporada de cultivo.',
    refs: '[26]',
  },
  { variable: 'Tolerancia a las heladas', source: 'Estimaciones del equipo', why: 'Qué heladas terminan una siembra en el calendario.', refs: '' },
  {
    variable: 'Necesidad de agua por temporada',
    source: 'FAO Irrigation and Drainage Paper 56 y FAO Irrigation Water Management Training Manual 3',
    why: 'Puntuación de agua: lluvia de la temporada de cultivo frente a esta necesidad.',
    refs: '[19][29]',
  },
  { variable: 'Temperaturas de germinación', source: 'J. F. Harrington, UC Davis', why: 'La semana después de la siembra tiene que ser lo bastante cálida para que las semillas broten.', refs: '[21]' },
  {
    variable: 'Horas de sol',
    source: 'Servicios de extensión universitaria (Rutgers, Penn State, Maryland, Michigan State)',
    why: 'Puntuación de luz solar; los cultivos por debajo de su mínimo quedan fuera.',
    refs: '[24]',
  },
  {
    variable: 'Rendimiento por m²',
    source: 'Michigan State University Extension, La Ferme de Sainte Marthe, Knott’s Handbook, University of Vermont Extension; promedios mundiales de FAOSTAT para cultivos extensivos',
    why: 'Cosecha esperada en el 70 % sembrado de la parcela.',
    refs: '[22][23][30][31][32]',
  },
  {
    variable: 'Tolerancia a la sequía',
    source: 'Estimada según el tipo de cultivo; Nemeskéri & Helyes para arvejas, frijoles, tomates y maíz dulce',
    why: 'Se muestra como etiqueta. No se usa en la puntuación.',
    refs: '[25]',
  },
];

export const DATA_RESEARCHED = [
  { variable: 'Sombra medida', source: 'ShadeMap', why: 'Horas reales de sombra por parcela en lugar del supuesto del 30 %.', refs: '[6][16][18]' },
  { variable: 'Humedad', source: 'GMAO MERRA-2', why: 'Controla la pérdida de agua. El crecimiento es máximo en torno al 85 %.', refs: '[4][15]' },
  { variable: 'Humedad del suelo', source: 'ESA CCI, FAO HWSD v2.0', why: 'Permite que las raíces absorban agua y nutrientes.', refs: '[3][8]' },
  { variable: 'Contaminantes del aire', source: 'Copernicus Sentinel-3', why: 'El SO₂, el O₃ y los NOₓ reducen la fotosíntesis y el rendimiento.', refs: '[10][17]' },
];

// Architecture ----------------------------------------------------------------

export const PIPELINE = [
  { title: 'Medir la parcela', body: 'Punto central y área en metros cuadrados.' },
  { title: 'Obtener el clima', body: 'NASA POWER: un año de calor, sol y lluvia diarios. Se muestra en cuanto llega.' },
  {
    title: 'Leer Landsat',
    body: 'Las lecturas de superficie de Landsat 8/9 a 30 m muestran cuánto más caliente está la parcela que el aire. Las puntuaciones usan las temperaturas del aire de la NASA.',
  },
  { title: 'Puntuar cada cultivo', body: 'Calor, sol, temperatura y agua para cada cultivo.' },
  { title: 'Ordenar y responder', body: 'Ordenados por puntuación, con rendimiento y riego. Después llega un breve resumen de Mistral AI.' },
];

export const STACK = [
  { title: 'Front-end', body: 'Svelte 5, TypeScript, Mapbox GL JS, Turf.js' },
  { title: 'Back-end', body: 'FastAPI en Python, base de datos de cultivos, resúmenes y consejos de cultivo de Mistral AI' },
  { title: 'Datos', body: 'NASA POWER, Microsoft Planetary Computer (Landsat)' },
  { title: 'Alojamiento', body: 'GitHub Pages y Render' },
];

export const ASSUMPTIONS =
  'El clima sale de un año de datos diarios. No se tiene en cuenta el suelo, porque los huertos urbanos suelen traer su propia tierra. El riego cuenta poco, porque las parcelas pequeñas son fáciles de regar. Sin datos de sombra, se supone que los edificios bloquean el 30 % de la luz solar.';

// Impact ----------------------------------------------------------------------

export const SDGS = [
  { n: 2, title: 'Hambre cero', points: ['Seguridad alimentaria', 'Mejor nutrición'], body: 'Alimentos frescos cerca de casa, con menos dependencia de cadenas de suministro largas.' },
  { n: 3, title: 'Salud y bienestar', points: ['Dietas más sanas', 'Salud mental', 'Aire más limpio'], body: 'Productos frescos, tiempo al aire libre y vegetación que refresca la calle.' },
  { n: 10, title: 'Reducción de las desigualdades', points: ['Acceso justo', 'Compras más baratas'], body: 'Alimentos asequibles en barrios donde faltan.' },
  { n: 11, title: 'Ciudades sostenibles', points: ['Espacio sin usar', 'Resiliencia climática', 'Comunidad'], body: 'Las azoteas y los balcones se vuelven productivos y absorben el agua de lluvia.' },
  { n: 12, title: 'Consumo responsable', points: ['Menos residuos', 'Menos emisiones'], body: 'Los restos se convierten en compost y los alimentos viajan metros, no continentes.' },
];

// Text inside the Learn components ---------------------------------------------

export const UI = {
  layout: {
    openMap: 'Abrir el mapa',
    nav: 'Más información',
    eyebrow: (n: string) => `Más información / ${n}`,
    next: (label: string) => `Siguiente: ${label}`,
    drawPlot: 'Dibuja tu parcela',
  },
  about: {
    whyTitle: 'Por qué lo creamos',
    whyBody:
      'Las ciudades siguen creciendo y el clima sigue cambiando. Cultivar alimentos en el lugar hace que una ciudad sea más resiliente. Home Grown muestra lo que podría cultivarse en un trozo de ciudad, desde un patio trasero hasta un estacionamiento vacío, en cualquier parte del mundo.',
    questionsLabel: 'Preguntas que responde sobre tu parcela',
    team: 'El equipo',
    recognition: 'Reconocimientos',
    recognitionBody: 'Dónde se ha presentado Home Grown y qué ha ganado.',
    contact: 'Contacto',
    contactBody: 'Si tienes preguntas sobre Home Grown, propuestas de colaboración o quieres usarlo en tu ciudad, contacta al equipo.',
    linkedin: 'LinkedIn',
    opensNewTab: (name: string) => `: ${name} (se abre en una pestaña nueva)`,
  },
  scoring: {
    overview: 'Resumen',
    title: 'De qué se compone la puntuación',
    body: 'Primero se descartan los cultivos sin sol suficiente. Cada uno de los demás recibe una puntuación de 0 a 100, formada por cuatro partes ponderadas. El valor más débil entre calor, sol y temperatura pone un tope: un cultivo que pasa frío o al que le falta calor no puede compensarlo con buena lluvia.',
    weights: 'Pesos: calor 35 %, luz solar 25 %, temperatura 25 %, agua 15 %',
    formula: (title: string) => `Fórmula: ${title}`,
  },
  data: {
    variable: 'Variable',
    source: 'Fuente',
    whyItMatters: 'Por qué importa',
    howWeUse: 'Cómo la usamos',
    usedTitle: 'Usado en tus resultados',
    usedBody: 'Un año de datos diarios de NASA POWER para el centro de tu parcela, más la temperatura de superficie de Landsat 8/9 de cada imagen despejada sobre ella.',
    usedCaption: 'Variables usadas en tus resultados',
    cropTitle: 'Datos de cultivos',
    cropBody: (n: number) =>
      `Cada uno de los ${n} cultivos tiene unos 17 valores. Aquí se indica de dónde vienen y para qué se usan. La mayoría de los límites de temperatura y de las unidades de calor ya provienen de estudios de campo. Las temperaturas ideales, las clases de helada y algunas unidades de calor siguen siendo estimaciones del equipo; citaremos la fuente de cada una a medida que la reemplacemos.`,
    cropCaption: 'De dónde vienen los valores de los cultivos',
    researchedTitle: 'Investigado, aún sin usar',
    researchedBody: 'Variables que, según nuestra investigación, importan y que Home Grown todavía no lee. La sombra medida reemplazaría el supuesto del 30 %.',
    researchedCaption: 'Variables investigadas pero aún sin usar',
    sources: 'Fuentes',
    hideBibliography: 'Ocultar bibliografía',
    showBibliography: (n: number) => `Mostrar bibliografía · ${n} fuentes`,
  },
  architecture: {
    title: 'Qué pasa cuando presionas Analizar',
    body: 'Un front-end estático en GitHub Pages envía tu parcela a una API de Python en Render en cuatro llamadas: clima, cultivos, resumen y consejos cuando los pides.',
    stack: 'Tecnologías',
    assumptions: 'Supuestos que conviene conocer',
    assumptionsBody: '¿Qué debo tener en cuenta sobre los resultados?',
  },
  impact: {
    label: 'Objetivos de Desarrollo Sostenible',
    sdg: 'ODS',
    footnote: 'Los Objetivos de Desarrollo Sostenible de la ONU son 17 metas que todos los Estados miembros de la ONU acordaron alcanzar para 2030.',
    readMore: 'Más información en la',
    un: 'ONU',
  },
};
