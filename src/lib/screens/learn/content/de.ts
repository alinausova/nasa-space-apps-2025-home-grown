import type { LearnTab } from '../../../router/paths';
import { TEAM as TEAM_EN } from './en';

// German Learn pages. Bibliography entries stay in their original language.
export { TAB_ORDER, BIBLIOGRAPHY } from './en';

const ROLES = ['Klimawissenschaft', 'Full-Stack-Entwicklung', 'Back-End-Entwicklung', 'Geodaten-Entwicklung', 'Recherche und Analyse', 'Kommunikation'];

export const TAB_INFO: Record<LearnTab, { n: string; label: string; title: string; intro: string }> = {
  about: {
    n: '01',
    label: 'Über uns',
    title: 'Wer wir sind und warum wir es gebaut haben',
    intro: 'Ein Projekt der NASA Space Apps 2025 von sechs Menschen aus Klimawissenschaft, Entwicklung und Kommunikation.',
  },
  scoring: {
    n: '02',
    label: 'So funktioniert die Bewertung',
    title: 'Wie eine Pflanze ihre Bewertung bekommt',
    intro: 'Vier gewichtete Teile, gemessen an den Ansprüchen jeder Pflanze aus veröffentlichter Pflanzenforschung. Hier steht jede Formel, die wir verwenden.',
  },
  data: {
    n: '03',
    label: 'Datenquellen',
    title: 'Woher die Daten kommen',
    intro: 'Worauf deine Ergebnisse beruhen: NASA-Klimadaten und die veröffentlichten Pflanzenstudien hinter jeder Zahl, die wir verwenden.',
  },
  architecture: {
    n: '04',
    label: 'Architektur',
    title: 'Wie das System läuft',
    intro: 'Von der Form, die du zeichnest, zur Rangliste der Pflanzen, in fünf Schritten.',
  },
  impact: {
    n: '05',
    label: 'Wirkung',
    title: 'Warum Lebensmittelanbau in Städten wichtig ist',
    intro: 'Home Grown unterstützt fünf der UN-Ziele für nachhaltige Entwicklung.',
  },
};

// About -----------------------------------------------------------------------

export const QUESTIONS = [
  'Welche Pflanze passt am besten?',
  'Wann solltest du sie pflanzen?',
  'Wie viel Ertrag ist zu erwarten?',
  'Braucht sie Bewässerung?',
  'Wie sollte die Bepflanzung aufgeteilt sein?',
  'Wie lang ist die Anbausaison?',
  'Wie ist das Klima übers Jahr?',
];

export const TEAM = TEAM_EN.map((person, i) => ({ ...person, role: ROLES[i] }));

export const RECOGNITION_FEATURED = {
  eyebrow: 'Gewinner · 19. Nov. 2025',
  title: 'Pitch Perfect, Capacity-building Hub auf der COP30',
  where: 'UN-Klimakonferenz · Belém, Brasilien · veranstaltet von der UN University (UNU-VIE) und Youth4Capacity',
  body: 'Vishnu Sunil Kumar hat Home Grown als „Food Secure Cities of Tomorrow“ gepitcht und die Abstimmung von Publikum und Mentoren gewonnen.',
};

export const RECOGNITION = [
  { year: '2026', title: 'Climate Pitch, Munich Climate Week', body: 'Home Grown in München gepitcht' },
  { year: '2026', title: 'Climate Café, Global Shapers Munich und TUM Think Tank', body: 'Home Grown in München vorgestellt' },
  { year: '2025', title: 'Hier fing es an: NASA International Space Apps Challenge', body: 'Die erste Version von Home Grown entstand hier, an einem Wochenende' },
];

export const CONTACT = [
  { title: 'Das Team kontaktieren', body: 'Vishnu Sunil Kumar auf LinkedIn', href: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { title: 'Ein Problem melden', body: 'Fehler und Wünsche auf GitHub', href: 'https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues' },
];

// Scoring ---------------------------------------------------------------------

export const SCORE_PARTS = [
  { weight: 35, title: 'Wärme', body: 'Wachstumsgradtage im Vergleich zum Bedarf der Pflanze. Gerade genug ergibt 80, volle Punktzahl braucht ein Viertel Reserve.' },
  { weight: 25, title: 'Sonnenlicht', body: 'Sonnenstunden nach Abzug des Schattens im Vergleich zum Optimum.' },
  { weight: 25, title: 'Temperatur', body: 'Jeder Wachstumstag wird am Idealbereich der Pflanze gemessen und fällt bis zu ihrer Basis- und Obergrenze auf null.' },
  { weight: 15, title: 'Wasser', body: 'Regen während des Wachstums im Vergleich zum Bedarf der Saison. Zu wenig kostet mehr als zu viel.' },
];

export const FORMULAS = [
  {
    title: 'Anbausaison',
    body: 'Eine Pflanze wächst nur an Tagen, deren Mittel über ihrer Basistemperatur liegt, und nur in den Monaten ihres Anbaukalenders. Salat 4°C, Tomaten 7°C, Paprika 10°C.',
    code: 'growing_day  =  T_avg > T_base',
  },
  {
    title: 'Sonnenstunden',
    body: '0,278 rechnet MJ in kWh um. 0,35 kW/m² ist die mittlere Intensität in sonnigen Phasen. Höchstens 16 Stunden. Ohne Schattendaten wird für Gebäude mit 0,7 multipliziert.',
    code: 'sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35',
  },
  {
    title: 'Temperaturkurve',
    body: 'Volle Punktzahl im Idealbereich der Pflanze, dann linear bis null an ihrer Basis- und Obergrenze, gemittelt über ihre Wachstumstage. Dieselbe Kurve verwendet das EcoCrop-Modell der FAO.',
    code: 'r(T) = 1                        ideal_min ≤ T ≤ ideal_max\nr(T) = (T − T_base) / (ideal_min − T_base)   below\nr(T) = (T_upper − T) / (T_upper − ideal_max)  above',
  },
  {
    title: 'Schwächster Faktor',
    body: 'Viel Regen gleicht nicht aus, dass es einer Pflanze zu kalt ist. Die Bewertung bleibt höchstens 12 Punkte über dem schwächsten Wert aus Wärme, Sonne und Temperatur. Wasser zählt hier nicht, denn Gießen behebt es. Die 12 haben wir festgelegt.',
    code: 'score = min(weighted_average,\n            min(heat, sun, temperature) + 12)',
  },
  {
    title: 'Wachstumsgradtage',
    body: 'Höchstwerte über der Obergrenze der Pflanze zählen als die Grenze, Tiefstwerte unter der Basis zählen als die Basis. Methode aus der Überarbeitung von FAO56.',
    code: 'GDD = T_avg − T_base    when T_avg > T_base',
  },
  {
    title: 'Flächengröße',
    body: 'Gaußsche Trapezformel auf einer abstandstreuen Zylinderprojektion. Unter 5 % Fehler für Flächen mit weniger als 10 km Seitenlänge.',
    code: 'x = R × lon × cos(lat₀)\ny = R × lat\nR = 6,371,000 m',
  },
  {
    title: 'Ertrag',
    body: '70 % der Fläche werden bepflanzt, der Rest sind Wege. Ab 90 Punkten gilt der obere Ertragswert, von 50 bis 89 wird skaliert, unter 50 ist er minimal.',
    code: 'yield = area × 0.7 × kg_per_m²(score)',
  },
];

// Data ------------------------------------------------------------------------

export const DATA_USED = [
  { variable: 'Einstrahlung', source: 'NASA POWER (CERES)', why: 'Sonnenlicht treibt Photosynthese und Verdunstung an.', refs: '[2]' },
  { variable: 'Lufttemperatur', source: 'NASA POWER (MERRA-2)', why: 'Das Wachstum beschleunigt sich bis zum Optimum der Pflanze, danach setzt Hitzestress ein.', refs: '[1][11]' },
  { variable: 'Oberflächentemperatur', source: 'Landsat 8/9, über Microsoft Planetary Computer', why: 'Zeigt, wie viel wärmer die Oberfläche der Fläche ist als die Luft, mit 30 m Auflösung. Wird neben den Bewertungen angezeigt, fließt aber nicht ein.', refs: '' },
  { variable: 'Niederschlag', source: 'NASA POWER (MERRA-2)', why: 'Bestimmt die Bodenfeuchte. In mildem Klima zählt er mehr als die Temperatur.', refs: '[5][9][14]' },
  { variable: 'Schatten', source: 'Angenommen: 30 % des Sonnenlichts gehen an Gebäude verloren', why: 'Dauerhafter Schatten kann das Wachstum um etwa 94 % verringern.', refs: '[6][16][18]' },
];

export const CROP_DATA = [
  { variable: 'Basis- und Obergrenze der Temperatur', source: 'Zusammengeführte Schwellenwerte von Paredes et al. für 43 Pflanzen. Grünkohl und Rucola verwenden Werte der Kohlfamilie.', why: 'Welche Tage zum Wachstum zählen, in der Wärmebewertung und im Kalender.', refs: '[20][28]' },
  { variable: 'Wärmeeinheiten bis zur ersten Ernte', source: 'Im Feld gemessene Summen von Paredes et al. für 16 Pflanzen und Croptime der Oregon State University für Tomaten, Paprika, Gurken und grüne Bohnen. Die übrigen 25 sind Schätzungen, für die neuesten Pflanzen aus den Anbauzyklen von FAO ECOCROP.', why: 'Wärmebewertung, die Obergrenze jeder Bewertung und wann eine Aussaat reif ist.', refs: '[27][28]' },
  { variable: 'Idealer Temperaturbereich', source: 'FAO ECOCROP für die neuesten Pflanzen; Schätzungen des Teams für die ursprünglichen 31, die gerade mit ECOCROP abgeglichen werden', why: 'Temperaturbewertung über die Anbausaison.', refs: '[26]' },
  { variable: 'Frosttoleranz', source: 'Schätzungen des Teams', why: 'Welche Fröste eine Aussaat im Kalender beenden.', refs: '' },
  { variable: 'Wasserbedarf pro Saison', source: 'FAO Irrigation and Drainage Paper 56 und FAO Irrigation Water Management Training Manual 3', why: 'Wasserbewertung: Regen in der Anbausaison im Vergleich zu diesem Bedarf.', refs: '[19][29]' },
  { variable: 'Keimtemperaturen', source: 'J. F. Harrington, UC Davis', why: 'Die Woche nach der Aussaat muss warm genug sein, damit die Samen aufgehen.', refs: '[21]' },
  { variable: 'Sonnenstunden', source: 'Landwirtschaftliche Beratungsdienste von Universitäten (Rutgers, Penn State, Maryland, Michigan State)', why: 'Sonnenbewertung. Pflanzen unter ihrem Minimum fallen heraus.', refs: '[24]' },
  { variable: 'Ertrag pro m²', source: 'Michigan State University Extension, La Ferme de Sainte Marthe, Knott’s Handbook, University of Vermont Extension; FAOSTAT-Weltmittel für Ackerkulturen', why: 'Erwartete Ernte auf den bepflanzten 70 % der Fläche.', refs: '[22][23][30][31][32]' },
  { variable: 'Trockenheitstoleranz', source: 'Geschätzt nach Pflanzentyp; Nemeskéri & Helyes für Erbsen, Bohnen, Tomaten und Zuckermais', why: 'Wird als Etikett angezeigt. Fließt nicht in die Bewertung ein.', refs: '[25]' },
];

export const DATA_RESEARCHED = [
  { variable: 'Schatten, gemessen', source: 'ShadeMap', why: 'Echte Schattenstunden pro Fläche statt der Annahme von 30 %.', refs: '[6][16][18]' },
  { variable: 'Luftfeuchtigkeit', source: 'GMAO MERRA-2', why: 'Steuert den Wasserverlust. Das Wachstum ist um 85 % am stärksten.', refs: '[4][15]' },
  { variable: 'Bodenfeuchte', source: 'ESA CCI, FAO HWSD v2.0', why: 'Lässt Wurzeln Wasser und Nährstoffe aufnehmen.', refs: '[3][8]' },
  { variable: 'Luftschadstoffe', source: 'Copernicus Sentinel-3', why: 'SO₂, O₃ und NOₓ verringern Photosynthese und Ertrag.', refs: '[10][17]' },
];

// Architecture ----------------------------------------------------------------

export const PIPELINE = [
  { title: 'Fläche vermessen', body: 'Mittelpunkt und Größe in Quadratmetern.' },
  { title: 'Klima abrufen', body: 'NASA POWER: ein Jahr tägliche Wärme, Sonne und Regen. Wird angezeigt, sobald es da ist.' },
  { title: 'Landsat auslesen', body: 'Oberflächenmessungen von Landsat 8/9 mit 30 m Auflösung zeigen, wie viel wärmer die Fläche ist als die Luft. Die Bewertungen verwenden die Lufttemperaturen der NASA.' },
  { title: 'Jede Pflanze bewerten', body: 'Wärme, Sonne, Temperatur und Wasser für jede Pflanze.' },
  { title: 'Sortieren und antworten', body: 'Nach Bewertung sortiert, mit Ertrag und Bewässerung. Danach folgt eine kurze Zusammenfassung von Mistral AI.' },
];

export const STACK = [
  { title: 'Front-End', body: 'Svelte 5, TypeScript, Mapbox GL JS, Turf.js' },
  { title: 'Back-End', body: 'FastAPI in Python, Pflanzendatenbank, Zusammenfassungen und Pflanzentipps von Mistral AI' },
  { title: 'Daten', body: 'NASA POWER, Microsoft Planetary Computer (Landsat)' },
  { title: 'Hosting', body: 'GitHub Pages und Render' },
];

export const ASSUMPTIONS =
  'Das Klima stammt aus einem Jahr täglicher Daten. Der Boden wird nicht berücksichtigt, weil Stadtgärten meist eigene Erde mitbringen. Bewässerung zählt wenig, weil kleine Flächen leicht zu gießen sind. Ohne Schattendaten nehmen wir an, dass 30 % des Sonnenlichts an Gebäude verloren gehen.';

// Impact ----------------------------------------------------------------------

export const SDGS = [
  { n: 2, title: 'Kein Hunger', points: ['Ernährungssicherheit', 'Bessere Ernährung'], body: 'Frische Lebensmittel nah am Zuhause, weniger abhängig von langen Lieferketten.' },
  { n: 3, title: 'Gesundheit und Wohlergehen', points: ['Gesündere Ernährung', 'Psychische Gesundheit', 'Sauberere Luft'], body: 'Frisches Gemüse, Zeit im Freien und Grün, das die Straße kühlt.' },
  { n: 10, title: 'Weniger Ungleichheiten', points: ['Fairer Zugang', 'Niedrigere Einkaufskosten'], body: 'Bezahlbare Lebensmittel in Vierteln, in denen sie fehlen.' },
  { n: 11, title: 'Nachhaltige Städte', points: ['Ungenutzte Flächen', 'Klimaresilienz', 'Gemeinschaft'], body: 'Dächer und Balkone werden produktiv und halten Regenwasser zurück.' },
  { n: 12, title: 'Verantwortungsvoller Konsum', points: ['Weniger Abfall', 'Weniger Emissionen'], body: 'Reste werden zu Kompost, und Lebensmittel reisen Meter statt Kontinente.' },
];

// Text inside the Learn components ---------------------------------------------

export const UI = {
  layout: {
    openMap: 'Karte öffnen',
    nav: 'Mehr erfahren',
    eyebrow: (n: string) => `Mehr erfahren / ${n}`,
    next: (label: string) => `Weiter: ${label}`,
    drawPlot: 'Fläche einzeichnen',
  },
  about: {
    whyTitle: 'Warum wir es gebaut haben',
    whyBody:
      'Städte wachsen weiter, und das Klima verschiebt sich. Lebensmittel vor Ort anzubauen macht eine Stadt widerstandsfähiger. Home Grown zeigt, was ein Stück Stadt anbauen könnte, vom Hinterhof bis zum leeren Parkplatz, überall auf der Welt.',
    questionsLabel: 'Fragen, die es für deine Fläche beantwortet',
    team: 'Das Team',
    recognition: 'Auszeichnungen',
    recognitionBody: 'Wo Home Grown gezeigt wurde und was es gewonnen hat.',
    contact: 'Kontakt',
    contactBody: 'Für Fragen zu Home Grown, Zusammenarbeit oder den Einsatz in deiner Stadt wende dich an das Team.',
    linkedin: 'LinkedIn',
    opensNewTab: (name: string) => `: ${name} (öffnet in einem neuen Tab)`,
  },
  scoring: {
    overview: 'Überblick',
    title: 'Woraus die Bewertung besteht',
    body: 'Pflanzen ohne genug Sonne fallen zuerst heraus. Jede andere Pflanze bekommt eine Bewertung von 0 bis 100 aus vier gewichteten Teilen. Der schwächste Wert aus Wärme, Sonne und Temperatur setzt eine Obergrenze: Eine Pflanze, der es zu kalt ist oder an Wärme fehlt, kann das mit gutem Regen nicht ausgleichen.',
    weights: 'Gewichte: Wärme 35 %, Sonnenlicht 25 %, Temperatur 25 %, Wasser 15 %',
    formula: (title: string) => `Formel: ${title}`,
  },
  data: {
    variable: 'Größe',
    source: 'Quelle',
    whyItMatters: 'Warum es wichtig ist',
    howWeUse: 'Wie wir es verwenden',
    usedTitle: 'In deinen Ergebnissen verwendet',
    usedBody: 'Ein Jahr tägliche Daten von NASA POWER für den Mittelpunkt deiner Fläche, dazu die Oberflächentemperatur von Landsat 8/9 aus jeder wolkenfreien Aufnahme darüber.',
    usedCaption: 'In deinen Ergebnissen verwendete Größen',
    cropTitle: 'Pflanzendaten',
    cropBody: (n: number) =>
      `Jede der ${n} Pflanzen hat etwa 17 Werte. Hier steht, woher sie kommen und wofür sie verwendet werden. Die meisten Temperaturgrenzen und Wärmeeinheiten stammen inzwischen aus Feldstudien. Ideale Temperaturen, Frostklassen und einige Wärmeeinheiten sind noch Schätzungen des Teams; wir nennen für jeden Wert die Quelle, sobald er ersetzt ist.`,
    cropCaption: 'Woher die Pflanzenwerte kommen',
    researchedTitle: 'Recherchiert, noch nicht verwendet',
    researchedBody: 'Größen, die laut unserer Recherche wichtig sind und die Home Grown noch nicht ausliest. Gemessener Schatten würde die Annahme von 30 % ersetzen.',
    researchedCaption: 'Recherchierte, noch nicht verwendete Größen',
    sources: 'Quellen',
    hideBibliography: 'Literaturliste ausblenden',
    showBibliography: (n: number) => `Literaturliste anzeigen · ${n} Quellen`,
  },
  architecture: {
    title: 'Was passiert, wenn du auf Analysieren drückst',
    body: 'Ein statisches Front-End auf GitHub Pages schickt deine Fläche in vier Aufrufen an eine Python-API auf Render: Klima, Pflanzen, Zusammenfassung und Tipps, wenn du danach fragst.',
    stack: 'Technik',
    assumptions: 'Annahmen, die du kennen solltest',
    assumptionsBody: 'Was sollte ich bei den Ergebnissen beachten?',
  },
  impact: {
    label: 'Ziele für nachhaltige Entwicklung',
    sdg: 'SDG',
    footnote: 'Die UN-Ziele für nachhaltige Entwicklung sind 17 Ziele, die alle UN-Mitgliedstaaten bis 2030 erreichen wollen.',
    readMore: 'Mehr dazu bei den',
    un: 'Vereinten Nationen',
  },
};
