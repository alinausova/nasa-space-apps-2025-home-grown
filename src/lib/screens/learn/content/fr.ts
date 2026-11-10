import type { LearnTab } from '../../../router/paths';
import { TEAM as TEAM_EN } from './en';

// French Learn pages. Bibliography entries stay in their original language.
export { TAB_ORDER, BIBLIOGRAPHY } from './en';

const ROLES = ['Sciences du climat', 'Ingénierie full-stack', 'Ingénierie back-end', 'Ingénierie géospatiale', 'Recherche et analyse', 'Communication'];

export const TAB_INFO: Record<LearnTab, { n: string; label: string; title: string; intro: string }> = {
  about: {
    n: '01',
    label: 'À propos',
    title: 'Qui nous sommes et pourquoi nous l’avons créé',
    intro: 'Un projet NASA Space Apps 2025 mené par six personnes issues des sciences du climat, de l’ingénierie et de la communication.',
  },
  scoring: {
    n: '02',
    label: 'Comment fonctionne le score',
    title: 'Comment une culture obtient son score',
    intro: 'Quatre composantes pondérées, comparées aux besoins propres de chaque culture d’après la recherche agronomique publiée. Voici chaque formule que nous utilisons.',
  },
  data: {
    n: '03',
    label: 'Sources de données',
    title: 'D’où viennent les données',
    intro: 'Ce sur quoi reposent vos résultats : les données climatiques de la NASA et les études agronomiques publiées derrière chaque chiffre que nous utilisons.',
  },
  architecture: {
    n: '04',
    label: 'Architecture',
    title: 'Comment fonctionne le système',
    intro: 'De la forme que vous dessinez à une liste classée de cultures, en cinq étapes.',
  },
  impact: {
    n: '05',
    label: 'Impact',
    title: 'Pourquoi cultiver en ville est important',
    intro: 'Home Grown contribue à cinq des objectifs de développement durable de l’ONU.',
  },
};

// About -----------------------------------------------------------------------

export const QUESTIONS = [
  'Quelle culture lui convient le mieux ?',
  'Quand faut-il la planter ?',
  'Quel rendement attendre ?',
  'A-t-elle besoin d’irrigation ?',
  'Comment organiser les plantations ?',
  'Combien de temps dure la saison de culture ?',
  'À quoi ressemble le climat au fil de l’année ?',
];

export const TEAM = TEAM_EN.map((person, i) => ({ ...person, role: ROLES[i] }));

export const RECOGNITION_FEATURED = {
  eyebrow: 'Lauréat · 19 nov. 2025',
  title: 'Pitch Perfect, Capacity-building Hub à la COP30',
  where: 'Conférence des Nations unies sur les changements climatiques · Belém, Brésil · organisé par l’Université des Nations unies (UNU-VIE) et Youth4Capacity',
  body: 'Vishnu Sunil Kumar a présenté Home Grown sous le titre « Food Secure Cities of Tomorrow » et a remporté le vote du public et des mentors.',
};

export const RECOGNITION = [
  { year: '2026', title: 'Climate Pitch, Munich Climate Week', body: 'Pitch de Home Grown à Munich' },
  { year: '2026', title: 'Climate Café, Global Shapers Munich et TUM Think Tank', body: 'Présentation de Home Grown à Munich' },
  { year: '2025', title: 'Là où tout a commencé : NASA International Space Apps Challenge', body: 'La première version de Home Grown a été créée ici, en un week-end' },
];

export const CONTACT = [
  { title: 'Contacter l’équipe', body: 'Vishnu Sunil Kumar sur LinkedIn', href: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { title: 'Signaler un problème', body: 'Bugs et demandes de fonctionnalités sur GitHub', href: 'https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues' },
];

// Scoring ---------------------------------------------------------------------

export const SCORE_PARTS = [
  { weight: 35, title: 'Chaleur', body: 'Degrés-jours de croissance comparés aux besoins de la culture. Tout juste assez donne 80 ; le score maximal demande un quart de marge.' },
  { weight: 25, title: 'Ensoleillement', body: 'Heures de soleil, ombre déduite, comparées à l’optimum.' },
  { weight: 25, title: 'Température', body: 'Chaque jour de croissance est évalué par rapport à la plage idéale de la culture, jusqu’à zéro à ses limites basse et haute.' },
  { weight: 15, title: 'Eau', body: 'La pluie pendant la croissance comparée au besoin de la saison. Un manque coûte plus qu’un excédent.' },
];

export const FORMULAS = [
  {
    title: 'Saison de culture',
    body: 'Une culture ne pousse que les jours dont la moyenne dépasse sa température de base, pendant les mois de son calendrier de culture. Laitue 4°C, tomates 7°C, poivrons 10°C.',
    code: 'growing_day  =  T_avg > T_base',
  },
  {
    title: 'Heures d’ensoleillement',
    body: '0,278 convertit les MJ en kWh. 0,35 kW/m² est l’intensité moyenne pendant les périodes ensoleillées. Plafonné à 16 heures. Sans données d’ombre, multiplié par 0,7 pour tenir compte des bâtiments.',
    code: 'sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35',
  },
  {
    title: 'Réponse à la température',
    body: 'Score maximal dans la plage idéale de la culture, puis une droite jusqu’à zéro à ses températures de base et haute, en moyenne sur ses jours de croissance. C’est la même réponse que celle du modèle EcoCrop de la FAO.',
    code: 'r(T) = 1                        ideal_min ≤ T ≤ ideal_max\nr(T) = (T − T_base) / (ideal_min − T_base)   below\nr(T) = (T_upper − T) / (T_upper − ideal_max)  above',
  },
  {
    title: 'Facteur le plus faible',
    body: 'Beaucoup de pluie ne compense pas une culture qui a trop froid. Le score reste à 12 points au plus au-dessus du plus faible des scores de chaleur, de soleil et de température. L’eau n’est pas prise en compte, car l’arrosage y remédie. La valeur de 12 est notre choix.',
    code: 'score = min(weighted_average,\n            min(heat, sun, temperature) + 12)',
  },
  {
    title: 'Degrés-jours de croissance',
    body: 'Les maximales au-dessus de la limite haute de la culture comptent comme cette limite, les minimales sous la base comptent comme la base. Méthode issue de la révision de FAO56.',
    code: 'GDD = T_avg − T_base    when T_avg > T_base',
  },
  {
    title: 'Surface de la parcelle',
    body: 'Formule du lacet sur une projection équirectangulaire. Moins de 5 % d’erreur pour les parcelles de moins de 10 km de côté.',
    code: 'x = R × lon × cos(lat₀)\ny = R × lat\nR = 6,371,000 m',
  },
  {
    title: 'Rendement',
    body: '70 % de la parcelle est planté, le reste sert d’allées. À partir de 90, le rendement maximal s’applique, de 50 à 89 il est proportionnel, sous 50 il est minimal.',
    code: 'yield = area × 0.7 × kg_per_m²(score)',
  },
];

// Data ------------------------------------------------------------------------

export const DATA_USED = [
  { variable: 'Rayonnement', source: 'NASA POWER (CERES)', why: 'La lumière du soleil alimente la photosynthèse et la transpiration.', refs: '[2]' },
  { variable: 'Température de l’air', source: 'NASA POWER (MERRA-2)', why: 'La croissance accélère jusqu’à l’optimum de la culture, puis le stress thermique s’installe.', refs: '[1][11]' },
  { variable: 'Température de surface', source: 'Landsat 8/9, via Microsoft Planetary Computer', why: 'Montre de combien la surface de la parcelle est plus chaude que l’air, avec une résolution de 30 m. Affichée à côté des scores, sans entrer dans leur calcul.', refs: '' },
  { variable: 'Précipitations', source: 'NASA POWER (MERRA-2)', why: 'Déterminent l’humidité du sol. Dans les climats doux, elles comptent plus que la température.', refs: '[5][9][14]' },
  { variable: 'Ombre', source: 'Hypothèse : 30 % de la lumière perdue à cause des bâtiments', why: 'Une ombre constante peut réduire la croissance d’environ 94 %.', refs: '[6][16][18]' },
];

export const CROP_DATA = [
  { variable: 'Température de base et température haute', source: 'Seuils consolidés de Paredes et al. pour 43 cultures. Le chou kale et la roquette utilisent les valeurs de la famille du chou.', why: 'Quels jours comptent pour la croissance, dans le score de chaleur et le calendrier.', refs: '[20][28]' },
  { variable: 'Unités de chaleur jusqu’à la première récolte', source: 'Totaux mesurés au champ par Paredes et al. pour 16 cultures et Croptime de l’Oregon State University pour les tomates, poivrons, concombres et haricots verts. Les 25 autres sont des estimations, issues des cycles de culture FAO ECOCROP pour les cultures les plus récentes.', why: 'Score de chaleur, plafond de chaque score et moment où un semis est prêt.', refs: '[27][28]' },
  { variable: 'Plage de température idéale', source: 'FAO ECOCROP pour les cultures les plus récentes ; estimations de l’équipe pour les 31 d’origine, en cours de vérification avec ECOCROP', why: 'Score de température sur la saison de culture.', refs: '[26]' },
  { variable: 'Résistance au gel', source: 'Estimations de l’équipe', why: 'Quelles gelées mettent fin à un semis dans le calendrier.', refs: '' },
  { variable: 'Besoin en eau par saison', source: 'FAO Irrigation and Drainage Paper 56 et FAO Irrigation Water Management Training Manual 3', why: 'Score d’eau : la pluie de la saison de culture comparée à ce besoin.', refs: '[19][29]' },
  { variable: 'Températures de germination', source: 'J. F. Harrington, UC Davis', why: 'La semaine qui suit le semis doit être assez chaude pour que les graines lèvent.', refs: '[21]' },
  { variable: 'Heures de soleil', source: 'Services de vulgarisation universitaires (Rutgers, Penn State, Maryland, Michigan State)', why: 'Score d’ensoleillement. Les cultures sous leur minimum sont écartées.', refs: '[24]' },
  { variable: 'Rendement par m²', source: 'Michigan State University Extension, La Ferme de Sainte Marthe, Knott’s Handbook, University of Vermont Extension ; moyennes mondiales FAOSTAT pour les grandes cultures', why: 'Récolte attendue sur les 70 % plantés de la parcelle.', refs: '[22][23][30][31][32]' },
  { variable: 'Tolérance à la sécheresse', source: 'Estimée selon le type de culture ; Nemeskéri & Helyes pour les pois, haricots, tomates et maïs doux', why: 'Affichée sous forme d’étiquette. Non utilisée dans le score.', refs: '[25]' },
];

export const DATA_RESEARCHED = [
  { variable: 'Ombre mesurée', source: 'ShadeMap', why: 'Des heures d’ombre réelles par parcelle au lieu de l’hypothèse de 30 %.', refs: '[6][16][18]' },
  { variable: 'Humidité de l’air', source: 'GMAO MERRA-2', why: 'Contrôle la perte d’eau. La croissance culmine autour de 85 %.', refs: '[4][15]' },
  { variable: 'Humidité du sol', source: 'ESA CCI, FAO HWSD v2.0', why: 'Permet aux racines d’absorber l’eau et les nutriments.', refs: '[3][8]' },
  { variable: 'Polluants atmosphériques', source: 'Copernicus Sentinel-3', why: 'Le SO₂, l’O₃ et les NOₓ réduisent la photosynthèse et le rendement.', refs: '[10][17]' },
];

// Architecture ----------------------------------------------------------------

export const PIPELINE = [
  { title: 'Mesurer la parcelle', body: 'Point central et surface en mètres carrés.' },
  { title: 'Récupérer le climat', body: 'NASA POWER : un an de chaleur, de soleil et de pluie au quotidien. Affiché dès son arrivée.' },
  { title: 'Lire Landsat', body: 'Les mesures de surface Landsat 8/9 à 30 m montrent de combien la parcelle est plus chaude que l’air. Les scores utilisent les températures de l’air de la NASA.' },
  { title: 'Évaluer chaque culture', body: 'Chaleur, soleil, température et eau pour chaque culture.' },
  { title: 'Classer et répondre', body: 'Tri par score, avec rendement et irrigation. Un court résumé de Mistral AI suit.' },
];

export const STACK = [
  { title: 'Front-end', body: 'Svelte 5, TypeScript, Mapbox GL JS, Turf.js' },
  { title: 'Back-end', body: 'FastAPI en Python, base de données des cultures, résumés et conseils de culture par Mistral AI' },
  { title: 'Données', body: 'NASA POWER, Microsoft Planetary Computer (Landsat)' },
  { title: 'Hébergement', body: 'GitHub Pages et Render' },
];

export const ASSUMPTIONS =
  'Le climat provient d’une année de données quotidiennes. Le sol n’est pas pris en compte, car les jardins urbains apportent généralement leur propre terre. L’arrosage pèse peu, car les petites parcelles sont faciles à arroser. Sans données d’ombre, on suppose que 30 % de la lumière du soleil est perdue à cause des bâtiments.';

// Impact ----------------------------------------------------------------------

export const SDGS = [
  { n: 2, title: 'Faim zéro', points: ['Sécurité alimentaire', 'Meilleure nutrition'], body: 'Des aliments frais près de chez soi, avec moins de dépendance aux longues chaînes d’approvisionnement.' },
  { n: 3, title: 'Bonne santé et bien-être', points: ['Alimentation plus saine', 'Santé mentale', 'Air plus pur'], body: 'Des produits frais, du temps dehors et de la verdure qui rafraîchit la rue.' },
  { n: 10, title: 'Inégalités réduites', points: ['Accès équitable', 'Courses moins chères'], body: 'Une alimentation abordable dans les quartiers qui en manquent.' },
  { n: 11, title: 'Villes durables', points: ['Espaces inutilisés', 'Résilience climatique', 'Communauté'], body: 'Les toits et les balcons deviennent productifs et absorbent les eaux de pluie.' },
  { n: 12, title: 'Consommation responsable', points: ['Moins de déchets', 'Moins d’émissions'], body: 'Les restes deviennent du compost et la nourriture parcourt des mètres, pas des continents.' },
];

// Text inside the Learn components ---------------------------------------------

export const UI = {
  layout: {
    openMap: 'Ouvrir la carte',
    nav: 'En savoir plus',
    eyebrow: (n: string) => `En savoir plus / ${n}`,
    next: (label: string) => `Suivant : ${label}`,
    drawPlot: 'Dessiner votre parcelle',
  },
  about: {
    whyTitle: 'Pourquoi nous l’avons créé',
    whyBody:
      'Les villes continuent de grandir et le climat continue de changer. Produire de la nourriture localement rend une ville plus résiliente. Home Grown montre ce qu’un coin de ville pourrait produire, d’une arrière-cour à un parking vide, partout dans le monde.',
    questionsLabel: 'Les questions auxquelles il répond pour votre parcelle',
    team: 'L’équipe',
    recognition: 'Distinctions',
    recognitionBody: 'Où Home Grown a été présenté, et ce qu’il a remporté.',
    contact: 'Nous contacter',
    contactBody: 'Pour toute question sur Home Grown, une collaboration ou son utilisation dans votre ville, contactez l’équipe.',
    linkedin: 'LinkedIn',
    opensNewTab: (name: string) => ` : ${name} (s’ouvre dans un nouvel onglet)`,
  },
  scoring: {
    overview: 'Vue d’ensemble',
    title: 'Ce qui compose le score',
    body: 'Les cultures sans assez de soleil sont écartées en premier. Chaque autre culture reçoit un score de 0 à 100, composé de quatre parties pondérées. Le plus faible des scores de chaleur, de soleil et de température fixe un plafond : une culture qui a trop froid ou manque de chaleur ne peut pas compenser avec une bonne pluie.',
    weights: 'Pondération : chaleur 35 %, ensoleillement 25 %, température 25 %, eau 15 %',
    formula: (title: string) => `Formule : ${title}`,
  },
  data: {
    variable: 'Variable',
    source: 'Source',
    whyItMatters: 'Pourquoi c’est important',
    howWeUse: 'Comment nous l’utilisons',
    usedTitle: 'Utilisé dans vos résultats',
    usedBody: 'Un an de données quotidiennes NASA POWER pour le centre de votre parcelle, plus la température de surface Landsat 8/9 de chaque image sans nuages qui la couvre.',
    usedCaption: 'Variables utilisées dans vos résultats',
    cropTitle: 'Données des cultures',
    cropBody: (n: number) =>
      `Chacune des ${n} cultures comporte environ 17 valeurs. Voici leur origine et ce qu’elles déterminent. La plupart des limites de température et des unités de chaleur proviennent désormais d’études de terrain. Les températures idéales, les classes de gel et certaines unités de chaleur restent des estimations de l’équipe ; nous citerons la source de chacune dès qu’elle sera remplacée.`,
    cropCaption: 'D’où viennent les valeurs des cultures',
    researchedTitle: 'Étudié, pas encore utilisé',
    researchedBody: 'Des variables qui comptent selon nos recherches, mais que Home Grown ne lit pas encore. L’ombre mesurée remplacerait l’hypothèse de 30 %.',
    researchedCaption: 'Variables étudiées mais pas encore utilisées',
    sources: 'Sources',
    hideBibliography: 'Masquer la bibliographie',
    showBibliography: (n: number) => `Afficher la bibliographie · ${n} sources`,
  },
  architecture: {
    title: 'Ce qui se passe quand vous appuyez sur Analyser',
    body: 'Un front-end statique sur GitHub Pages envoie votre parcelle à une API Python sur Render en quatre appels : climat, cultures, résumé, et conseils quand vous les demandez.',
    stack: 'Stack technique',
    assumptions: 'Hypothèses à connaître',
    assumptionsBody: 'Que faut-il garder en tête à propos des résultats ?',
  },
  impact: {
    label: 'Objectifs de développement durable',
    sdg: 'ODD',
    footnote: 'Les objectifs de développement durable de l’ONU sont 17 objectifs que tous les États membres de l’ONU se sont engagés à atteindre d’ici 2030.',
    readMore: 'En savoir plus sur le site des',
    un: 'Nations unies',
  },
};
