import type { LearnTab } from '../../../router/paths';
import { TEAM as TEAM_EN } from './en';

// Brazilian Portuguese Learn pages. Bibliography entries stay in their original language.
export { TAB_ORDER, BIBLIOGRAPHY } from './en';

const ROLES = ['Ciência do clima', 'Engenharia full-stack', 'Engenharia back-end', 'Engenharia geoespacial', 'Pesquisa e análise', 'Comunicação'];

export const TAB_INFO: Record<LearnTab, { n: string; label: string; title: string; intro: string }> = {
  about: {
    n: '01',
    label: 'Sobre',
    title: 'Quem somos e por que criamos isto',
    intro: 'Um projeto do NASA Space Apps 2025 feito por seis pessoas das áreas de ciência do clima, engenharia e comunicação.',
  },
  scoring: {
    n: '02',
    label: 'Como funciona a pontuação',
    title: 'Como um cultivo recebe sua pontuação',
    intro: 'Quatro partes ponderadas, comparadas com as necessidades de cada cultivo segundo pesquisas publicadas. Aqui estão todas as fórmulas que usamos.',
  },
  data: {
    n: '03',
    label: 'Fontes de dados',
    title: 'De onde vêm os dados',
    intro: 'A base dos seus resultados: dados climáticos da NASA e os estudos publicados sobre cultivos por trás de cada número que usamos.',
  },
  architecture: {
    n: '04',
    label: 'Arquitetura',
    title: 'Como o sistema funciona',
    intro: 'Da forma que você desenha a uma lista ordenada de cultivos, em cinco etapas.',
  },
  impact: {
    n: '05',
    label: 'Impacto',
    title: 'Por que cultivar alimentos nas cidades importa',
    intro: 'O Home Grown apoia cinco dos Objetivos de Desenvolvimento Sustentável da ONU.',
  },
};

// About -----------------------------------------------------------------------

export const QUESTIONS = [
  'Qual cultivo é mais adequado?',
  'Quando você deve plantar?',
  'Quanto deve render?',
  'Precisa de irrigação?',
  'Como organizar o plantio?',
  'Quanto dura a estação de cultivo?',
  'Como é o clima ao longo do ano?',
];

export const TEAM = TEAM_EN.map((person, i) => ({ ...person, role: ROLES[i] }));

export const RECOGNITION_FEATURED = {
  eyebrow: 'Vencedor · 19 nov. 2025',
  title: 'Pitch Perfect, Capacity-building Hub na COP30',
  where: 'Conferência da ONU sobre Mudanças Climáticas · Belém, Brasil · organizado pela UN University (UNU-VIE) e Youth4Capacity',
  body: 'Vishnu Sunil Kumar apresentou o Home Grown como “Food Secure Cities of Tomorrow” e venceu a votação do público e dos mentores.',
};

export const RECOGNITION = [
  { year: '2026', title: 'Climate Pitch, Munich Climate Week', body: 'Pitch do Home Grown em Munique' },
  { year: '2026', title: 'Climate Café, Global Shapers Munich e TUM Think Tank', body: 'Apresentação do Home Grown em Munique' },
  { year: '2025', title: 'Onde tudo começou: NASA International Space Apps Challenge', body: 'A primeira versão do Home Grown foi criada aqui, em um fim de semana' },
];

export const CONTACT = [
  { title: 'Fale com a equipe', body: 'Vishnu Sunil Kumar no LinkedIn', href: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { title: 'Relatar um problema', body: 'Bugs e pedidos de funcionalidades no GitHub', href: 'https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues' },
];

// Scoring ---------------------------------------------------------------------

export const SCORE_PARTS = [
  { weight: 35, title: 'Calor', body: 'Graus-dia de crescimento comparados com a necessidade do cultivo. O suficiente vale 80; a pontuação máxima exige um quarto de folga.' },
  { weight: 25, title: 'Luz solar', body: 'Horas de sol, descontada a sombra, comparadas com o ideal.' },
  { weight: 25, title: 'Temperatura', body: 'Cada dia de crescimento é comparado com a faixa ideal do cultivo e cai a zero nos seus limites base e superior.' },
  { weight: 15, title: 'Água', body: 'Chuva durante o cultivo comparada com a necessidade da estação. A falta custa mais do que o excesso.' },
];

export const FORMULAS = [
  {
    title: 'Estação de cultivo',
    body: 'Um cultivo só cresce em dias com média acima da sua temperatura base, dentro dos meses do seu calendário. Alface 4°C, tomates 7°C, pimentões 10°C.',
    code: 'growing_day  =  T_avg > T_base',
  },
  {
    title: 'Horas de sol',
    body: '0,278 converte MJ em kWh. 0,35 kW/m² é a intensidade média em períodos ensolarados. Limite de 16 horas. Sem dados de sombra, multiplica-se por 0,7 por causa dos prédios.',
    code: 'sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35',
  },
  {
    title: 'Resposta à temperatura',
    body: 'Pontuação máxima dentro da faixa ideal do cultivo, uma linha reta até zero nas temperaturas base e superior, com média sobre os dias de crescimento. É a mesma resposta usada pelo modelo EcoCrop da FAO.',
    code: 'r(T) = 1                        ideal_min ≤ T ≤ ideal_max\nr(T) = (T − T_base) / (ideal_min − T_base)   below\nr(T) = (T_upper − T) / (T_upper − ideal_max)  above',
  },
  {
    title: 'Fator mais fraco',
    body: 'Muita chuva não compensa um cultivo com frio demais. A pontuação fica no máximo 12 pontos acima do valor mais fraco entre calor, sol e temperatura. A água fica de fora, porque a irrigação resolve isso. O 12 foi escolha nossa.',
    code: 'score = min(weighted_average,\n            min(heat, sun, temperature) + 12)',
  },
  {
    title: 'Graus-dia de crescimento',
    body: 'Máximas acima do limite superior do cultivo contam como o limite, mínimas abaixo da base contam como a base. Método da revisão do FAO56.',
    code: 'GDD = T_avg − T_base    when T_avg > T_base',
  },
  {
    title: 'Área do terreno',
    body: 'Fórmula de Gauss (shoelace) sobre uma projeção equirretangular. Erro abaixo de 5% para terrenos com menos de 10 km de lado.',
    code: 'x = R × lon × cos(lat₀)\ny = R × lat\nR = 6,371,000 m',
  },
  {
    title: 'Rendimento',
    body: '70% do terreno é plantado, o resto são caminhos. A partir de 90 pontos vale o rendimento máximo, de 50 a 89 ele é proporcional, abaixo de 50 é mínimo.',
    code: 'yield = area × 0.7 × kg_per_m²(score)',
  },
];

// Data ------------------------------------------------------------------------

export const DATA_USED = [
  { variable: 'Irradiância', source: 'NASA POWER (CERES)', why: 'A luz do sol alimenta a fotossíntese e a transpiração.', refs: '[2]' },
  { variable: 'Temperatura do ar', source: 'NASA POWER (MERRA-2)', why: 'O crescimento acelera até o ótimo do cultivo, depois vem o estresse térmico.', refs: '[1][11]' },
  { variable: 'Temperatura da superfície', source: 'Landsat 8/9, via Microsoft Planetary Computer', why: 'Mostra quanto a superfície do terreno fica mais quente que o ar, com resolução de 30 m. Exibida junto com as pontuações, mas não usada nelas.', refs: '' },
  { variable: 'Precipitação', source: 'NASA POWER (MERRA-2)', why: 'Define a umidade do solo. Em climas amenos, importa mais do que a temperatura.', refs: '[5][9][14]' },
  { variable: 'Sombra', source: 'Suposição: 30% da luz do sol perdida por causa dos prédios', why: 'Sombra constante pode reduzir o crescimento em cerca de 94%.', refs: '[6][16][18]' },
];

export const CROP_DATA = [
  { variable: 'Temperatura base e superior', source: 'Limiares consolidados de Paredes et al. para 43 cultivos. Couve e rúcula usam valores da família do repolho.', why: 'Quais dias contam para o crescimento, na pontuação de calor e no calendário.', refs: '[20][28]' },
  { variable: 'Unidades de calor até a primeira colheita', source: 'Totais medidos em campo de Paredes et al. para 16 cultivos e o Croptime da Oregon State para tomates, pimentões, pepinos e feijão-vagem. Os outros 25 são estimativas, a partir dos ciclos de cultivo do FAO ECOCROP para os cultivos mais recentes.', why: 'Pontuação de calor, o teto de cada pontuação e quando uma semeadura está pronta.', refs: '[27][28]' },
  { variable: 'Faixa ideal de temperatura', source: 'FAO ECOCROP para os cultivos mais recentes; estimativas da equipe para os 31 originais, em verificação com o ECOCROP', why: 'Pontuação de temperatura ao longo da estação de cultivo.', refs: '[26]' },
  { variable: 'Tolerância à geada', source: 'Estimativas da equipe', why: 'Quais geadas encerram uma semeadura no calendário.', refs: '' },
  { variable: 'Necessidade de água por estação', source: 'FAO Irrigation and Drainage Paper 56 e FAO Irrigation Water Management Training Manual 3', why: 'Pontuação de água: chuva na estação de cultivo comparada com essa necessidade.', refs: '[19][29]' },
  { variable: 'Temperaturas de germinação', source: 'J. F. Harrington, UC Davis', why: 'A semana após a semeadura precisa ser quente o suficiente para as sementes brotarem.', refs: '[21]' },
  { variable: 'Horas de sol', source: 'Serviços de extensão universitária (Rutgers, Penn State, Maryland, Michigan State)', why: 'Pontuação de luz solar; cultivos abaixo do mínimo ficam de fora.', refs: '[24]' },
  { variable: 'Rendimento por m²', source: 'Michigan State University Extension, La Ferme de Sainte Marthe, Knott’s Handbook, University of Vermont Extension; médias mundiais do FAOSTAT para culturas de campo', why: 'Colheita esperada nos 70% plantados do terreno.', refs: '[22][23][30][31][32]' },
  { variable: 'Tolerância à seca', source: 'Estimada pelo tipo de cultivo; Nemeskéri & Helyes para ervilhas, feijões, tomates e milho-doce', why: 'Exibida como etiqueta. Não é usada na pontuação.', refs: '[25]' },
];

export const DATA_RESEARCHED = [
  { variable: 'Sombra, medida', source: 'ShadeMap', why: 'Horas reais de sombra por terreno em vez da suposição de 30%.', refs: '[6][16][18]' },
  { variable: 'Umidade do ar', source: 'GMAO MERRA-2', why: 'Controla a perda de água. O crescimento atinge o pico por volta de 85%.', refs: '[4][15]' },
  { variable: 'Umidade do solo', source: 'ESA CCI, FAO HWSD v2.0', why: 'Permite que as raízes absorvam água e nutrientes.', refs: '[3][8]' },
  { variable: 'Poluentes do ar', source: 'Copernicus Sentinel-3', why: 'SO₂, O₃ e NOₓ reduzem a fotossíntese e o rendimento.', refs: '[10][17]' },
];

// Architecture ----------------------------------------------------------------

export const PIPELINE = [
  { title: 'Medir o terreno', body: 'Ponto central e área em metros quadrados.' },
  { title: 'Obter o clima', body: 'NASA POWER: um ano de calor, sol e chuva diários. Exibido assim que chega.' },
  { title: 'Ler o Landsat', body: 'Leituras de superfície do Landsat 8/9 com resolução de 30 m mostram quanto o terreno fica mais quente que o ar. As pontuações usam as temperaturas do ar da NASA.' },
  { title: 'Avaliar cada cultivo', body: 'Calor, sol, temperatura e água para cada cultivo.' },
  { title: 'Ordenar e responder', body: 'Ordenados por pontuação, com rendimento e irrigação. Em seguida vem um breve resumo da Mistral AI.' },
];

export const STACK = [
  { title: 'Front-end', body: 'Svelte 5, TypeScript, Mapbox GL JS, Turf.js' },
  { title: 'Back-end', body: 'FastAPI em Python, banco de dados de cultivos, resumos e dicas de cultivo da Mistral AI' },
  { title: 'Dados', body: 'NASA POWER, Microsoft Planetary Computer (Landsat)' },
  { title: 'Hospedagem', body: 'GitHub Pages e Render' },
];

export const ASSUMPTIONS =
  'O clima vem de um ano de dados diários. O solo é ignorado, porque hortas urbanas geralmente trazem a própria terra. A irrigação conta pouco, porque terrenos pequenos são fáceis de regar. Sem dados de sombra, supomos que 30% da luz do sol se perde por causa dos prédios.';

// Impact ----------------------------------------------------------------------

export const SDGS = [
  { n: 2, title: 'Fome zero', points: ['Segurança alimentar', 'Melhor nutrição'], body: 'Alimentos frescos perto de casa, com menos dependência de longas cadeias de abastecimento.' },
  { n: 3, title: 'Saúde e bem-estar', points: ['Alimentação mais saudável', 'Saúde mental', 'Ar mais limpo'], body: 'Alimentos frescos, tempo ao ar livre e áreas verdes que refrescam a rua.' },
  { n: 10, title: 'Redução das desigualdades', points: ['Acesso justo', 'Contas de mercado menores'], body: 'Alimentos acessíveis em bairros onde eles faltam.' },
  { n: 11, title: 'Cidades sustentáveis', points: ['Espaços sem uso', 'Resiliência climática', 'Comunidade'], body: 'Telhados e varandas se tornam produtivos e absorvem a água da chuva.' },
  { n: 12, title: 'Consumo responsável', points: ['Menos desperdício', 'Menos emissões'], body: 'Restos viram composto e os alimentos viajam metros, não continentes.' },
];

// Text inside the Learn components ---------------------------------------------

export const UI = {
  layout: {
    openMap: 'Abrir o mapa',
    nav: 'Saiba mais',
    eyebrow: (n: string) => `Saiba mais / ${n}`,
    next: (label: string) => `Próximo: ${label}`,
    drawPlot: 'Desenhe seu terreno',
  },
  about: {
    whyTitle: 'Por que criamos isto',
    whyBody:
      'As cidades continuam crescendo e o clima continua mudando. Cultivar alimentos localmente torna uma cidade mais resiliente. O Home Grown mostra o que um pedaço da cidade poderia cultivar, de um quintal a um estacionamento vazio, em qualquer lugar do mundo.',
    questionsLabel: 'Perguntas que ele responde para o seu terreno',
    team: 'A equipe',
    recognition: 'Reconhecimento',
    recognitionBody: 'Onde o Home Grown foi apresentado e o que ele ganhou.',
    contact: 'Fale conosco',
    contactBody: 'Para dúvidas sobre o Home Grown, colaborações ou uso na sua cidade, entre em contato com a equipe.',
    linkedin: 'LinkedIn',
    opensNewTab: (name: string) => `: ${name} (abre em uma nova aba)`,
  },
  scoring: {
    overview: 'Visão geral',
    title: 'Do que é feita a pontuação',
    body: 'Cultivos sem sol suficiente são removidos primeiro. Todos os outros recebem uma pontuação de 0 a 100, formada por quatro partes ponderadas. O valor mais fraco entre calor, sol e temperatura define um teto: um cultivo com frio demais ou com falta de calor não compensa isso com chuva boa.',
    weights: 'Pesos: calor 35%, luz solar 25%, temperatura 25%, água 15%',
    formula: (title: string) => `Fórmula: ${title}`,
  },
  data: {
    variable: 'Variável',
    source: 'Fonte',
    whyItMatters: 'Por que importa',
    howWeUse: 'Como usamos',
    usedTitle: 'Usados nos seus resultados',
    usedBody: 'Um ano de dados diários do NASA POWER para o centro do seu terreno, mais a temperatura da superfície do Landsat 8/9 de cada imagem sem nuvens sobre ele.',
    usedCaption: 'Variáveis usadas nos seus resultados',
    cropTitle: 'Dados dos cultivos',
    cropBody: (n: number) =>
      `Cada um dos ${n} cultivos tem cerca de 17 números. Veja de onde eles vêm e para que servem. A maioria dos limites de temperatura e das unidades de calor agora vem de estudos de campo. Temperaturas ideais, classes de geada e algumas unidades de calor ainda são estimativas da equipe; vamos citar a fonte de cada uma à medida que forem substituídas.`,
    cropCaption: 'De onde vêm os números dos cultivos',
    researchedTitle: 'Pesquisados, ainda não usados',
    researchedBody: 'Variáveis que, segundo nossa pesquisa, são importantes e que o Home Grown ainda não lê. A sombra medida substituiria a suposição de 30%.',
    researchedCaption: 'Variáveis pesquisadas, mas ainda não usadas',
    sources: 'Fontes',
    hideBibliography: 'Ocultar bibliografia',
    showBibliography: (n: number) => `Mostrar bibliografia · ${n} fontes`,
  },
  architecture: {
    title: 'O que acontece quando você clica em Analisar',
    body: 'Um front-end estático no GitHub Pages envia seu terreno para uma API em Python no Render em quatro chamadas: clima, cultivos, resumo e dicas, quando você pedir.',
    stack: 'Tecnologias',
    assumptions: 'Suposições importantes',
    assumptionsBody: 'O que devo ter em mente sobre os resultados?',
  },
  impact: {
    label: 'Objetivos de Desenvolvimento Sustentável',
    sdg: 'ODS',
    footnote: 'Os Objetivos de Desenvolvimento Sustentável da ONU são 17 metas que todos os países-membros da ONU se comprometeram a alcançar até 2030.',
    readMore: 'Saiba mais no site da',
    un: 'ONU',
  },
};
