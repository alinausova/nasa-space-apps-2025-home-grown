import type { LearnTab } from '../../../router/paths';
import { TEAM as TEAM_EN } from './en';

// Turkish Learn pages. Bibliography entries stay in their original language.
export { TAB_ORDER, BIBLIOGRAPHY } from './en';

const ROLES = ['İklim bilimi', 'Full-stack geliştirme', 'Back-end geliştirme', 'Coğrafi veri geliştirme', 'Araştırma ve analiz', 'İletişim'];

export const TAB_INFO: Record<LearnTab, { n: string; label: string; title: string; intro: string }> = {
  about: {
    n: '01',
    label: 'Hakkımızda',
    title: 'Biz kimiz ve bunu neden yaptık',
    intro: 'İklim bilimi, mühendislik ve iletişim alanlarından altı kişinin hazırladığı bir NASA Space Apps 2025 projesi.',
  },
  scoring: {
    n: '02',
    label: 'Puanlama nasıl çalışır',
    title: 'Bir bitki puanını nasıl alır',
    intro: 'Dört ağırlıklı bölüm, her bitkinin yayımlanmış bitki araştırmalarındaki kendi ihtiyaçlarıyla karşılaştırılır. Kullandığımız her formül burada.',
  },
  data: {
    n: '03',
    label: 'Veri kaynakları',
    title: 'Veriler nereden geliyor',
    intro: 'Sonuçlarının dayandığı veriler: NASA iklim verileri ve kullandığımız her sayının arkasındaki yayımlanmış bitki çalışmaları.',
  },
  architecture: {
    n: '04',
    label: 'Mimari',
    title: 'Sistem nasıl çalışır',
    intro: 'Çizdiğin şekilden sıralı bir bitki listesine, beş adımda.',
  },
  impact: {
    n: '05',
    label: 'Etki',
    title: 'Şehirlerde gıda yetiştirmek neden önemli',
    intro: 'Home Grown, BM Sürdürülebilir Kalkınma Amaçlarından beşini destekler.',
  },
};

// About -----------------------------------------------------------------------

export const QUESTIONS = [
  'Hangi bitki en uygun?',
  'Ne zaman ekmelisin?',
  'Ne kadar ürün vermeli?',
  'Sulama gerekiyor mu?',
  'Bitkiler nasıl yerleştirilmeli?',
  'Yetiştirme mevsimi ne kadar uzun?',
  'Yıl boyunca iklim nasıl?',
];

export const TEAM = TEAM_EN.map((person, i) => ({ ...person, role: ROLES[i] }));

export const RECOGNITION_FEATURED = {
  eyebrow: 'Kazanan · 19 Kasım 2025',
  title: 'Pitch Perfect, COP30 Capacity-building Hub',
  where: 'BM İklim Değişikliği Konferansı · Belém, Brezilya · düzenleyenler: BM Üniversitesi (UNU-VIE) ve Youth4Capacity',
  body: 'Vishnu Sunil Kumar, Home Grown’u “Food Secure Cities of Tomorrow” adıyla sundu ve izleyici ile mentor oylamasını kazandı.',
};

export const RECOGNITION = [
  { year: '2026', title: 'Climate Pitch, Munich Climate Week', body: 'Home Grown Münih’te sunuldu' },
  { year: '2026', title: 'Climate Café, Global Shapers Munich ve TUM Think Tank', body: 'Home Grown Münih’te tanıtıldı' },
  { year: '2025', title: 'Her şeyin başladığı yer: NASA International Space Apps Challenge', body: 'Home Grown’un ilk sürümü burada, bir hafta sonunda yapıldı' },
];

export const CONTACT = [
  { title: 'Ekiple iletişime geç', body: 'LinkedIn’de Vishnu Sunil Kumar', href: 'https://www.linkedin.com/in/vishnu-sunil/' },
  { title: 'Sorun bildir', body: 'GitHub’da hatalar ve özellik istekleri', href: 'https://github.com/alinausova/nasa-space-apps-2025-home-grown/issues' },
];

// Scoring ---------------------------------------------------------------------

export const SCORE_PARTS = [
  { weight: 35, title: 'Isı', body: 'Büyüme derece günleri, bitkinin ihtiyacıyla karşılaştırılır. Tam yetecek kadarı 80 puan alır, tam puan için dörtte bir fazlası gerekir.' },
  { weight: 25, title: 'Güneş ışığı', body: 'Gölge düşüldükten sonraki güneşlenme saatleri, en uygun değerle karşılaştırılır.' },
  { weight: 25, title: 'Sıcaklık', body: 'Her büyüme günü bitkinin ideal aralığına göre puanlanır, taban ve üst sınırında sıfıra düşer.' },
  { weight: 15, title: 'Su', body: 'Büyüme sırasındaki yağmur, mevsimlik ihtiyaçla karşılaştırılır. Eksiklik, fazlalıktan daha çok puan kaybettirir.' },
];

export const FORMULAS = [
  {
    title: 'Yetiştirme mevsimi',
    body: 'Bir bitki yalnızca ortalaması taban sıcaklığının üstünde olan günlerde ve takviminde büyüdüğü aylar içinde büyür. Marul 4°C, domates 7°C, biber 10°C.',
    code: 'growing_day  =  T_avg > T_base',
  },
  {
    title: 'Güneşlenme saatleri',
    body: '0,278 ile MJ, kWh birimine çevrilir. 0,35 kW/m² güneşli dönemlerdeki ortalama yoğunluktur. En fazla 16 saat. Gölge verisi yoksa binalar için 0,7 ile çarpılır.',
    code: 'sunshine_hours = (solar_radiation_MJ × 0.278) / 0.35',
  },
  {
    title: 'Sıcaklık tepkisi',
    body: 'Bitkinin ideal aralığında tam puan, taban ve üst sıcaklığında sıfıra inen düz bir çizgi, büyüme günleri üzerinden ortalaması alınır. FAO EcoCrop modelinin kullandığı tepkinin aynısı.',
    code: 'r(T) = 1                        ideal_min ≤ T ≤ ideal_max\nr(T) = (T − T_base) / (ideal_min − T_base)   below\nr(T) = (T_upper − T) / (T_upper − ideal_max)  above',
  },
  {
    title: 'En zayıf etken',
    body: 'Bol yağmur, bitkinin üşümesini telafi edemez. Puan, ısı, güneş ve sıcaklık arasında en zayıf olanın en fazla 12 puan üstünde kalır. Su hesaba katılmaz, çünkü sulama bunu çözer. 12 bizim seçimimiz.',
    code: 'score = min(weighted_average,\n            min(heat, sun, temperature) + 12)',
  },
  {
    title: 'Büyüme derece günleri',
    body: 'Bitkinin üst sınırını aşan en yüksek sıcaklıklar sınır değer, tabanın altındaki en düşük sıcaklıklar taban değer olarak sayılır. Yöntem FAO56 revizyonundan.',
    code: 'GDD = T_avg − T_base    when T_avg > T_base',
  },
  {
    title: 'Arazi alanı',
    body: 'Eşdikdörtgen projeksiyon üzerinde ayakkabı bağı formülü. Kenarı 10 km’den kısa araziler için hata %5’in altında.',
    code: 'x = R × lon × cos(lat₀)\ny = R × lat\nR = 6,371,000 m',
  },
  {
    title: 'Verim',
    body: 'Arazinin %70’i ekilir, kalanı yoldur. 90 ve üstü üst sınır verimi alır, 50 ile 89 arası ölçeklenir, 50’nin altı en düşük verimdir.',
    code: 'yield = area × 0.7 × kg_per_m²(score)',
  },
];

// Data ------------------------------------------------------------------------

export const DATA_USED = [
  { variable: 'Işınım', source: 'NASA POWER (CERES)', why: 'Güneş ışığı fotosentezi ve terlemeyi besler.', refs: '[2]' },
  { variable: 'Hava sıcaklığı', source: 'NASA POWER (MERRA-2)', why: 'Büyüme bitkinin en uygun sıcaklığına kadar hızlanır, sonra sıcaklık stresi başlar.', refs: '[1][11]' },
  { variable: 'Yüzey sıcaklığı', source: 'Landsat 8/9, Microsoft Planetary Computer üzerinden', why: 'Arazinin yüzeyinin havadan ne kadar sıcak olduğunu 30 m çözünürlükte gösterir. Puanların yanında gösterilir, puanlarda kullanılmaz.', refs: '' },
  { variable: 'Yağış', source: 'NASA POWER (MERRA-2)', why: 'Toprak nemini belirler. Ilıman iklimlerde sıcaklıktan daha önemlidir.', refs: '[5][9][14]' },
  { variable: 'Gölge', source: 'Varsayım: güneş ışığının %30’u binalar yüzünden kaybolur', why: 'Sürekli gölge büyümeyi yaklaşık %94 azaltabilir.', refs: '[6][16][18]' },
];

export const CROP_DATA = [
  { variable: 'Taban ve üst sıcaklık', source: 'Paredes ve ark.’nın 43 bitki için derlediği eşik değerler. Kara lahana ve roka, lahanagillerin değerlerini kullanır.', why: 'Isı puanında ve takvimde hangi günlerin büyümeye sayıldığı.', refs: '[20][28]' },
  { variable: 'İlk hasada kadar ısı birimi', source: 'Paredes ve ark.’nın 16 bitki için tarlada ölçtüğü toplamlar ve domates, biber, salatalık ve taze fasulye için Oregon State’in Croptime modeli. Diğer 25’i tahmin, en yeni bitkiler için FAO ECOCROP yetiştirme döngülerinden.', why: 'Isı puanı, her puanın üst sınırı ve bir ekimin ne zaman hazır olduğu.', refs: '[27][28]' },
  { variable: 'İdeal sıcaklık aralığı', source: 'En yeni bitkiler için FAO ECOCROP; ilk 31 bitki için ekip tahminleri, ECOCROP ile karşılaştırılıyor', why: 'Yetiştirme mevsimi boyunca sıcaklık puanı.', refs: '[26]' },
  { variable: 'Don dayanımı', source: 'Ekip tahminleri', why: 'Takvimde hangi donların bir ekimi sonlandırdığı.', refs: '' },
  { variable: 'Mevsimlik su ihtiyacı', source: 'FAO Irrigation and Drainage Paper 56 ve FAO Irrigation Water Management Training Manual 3', why: 'Su puanı: yetiştirme mevsimindeki yağmurun bu ihtiyaçla karşılaştırılması.', refs: '[19][29]' },
  { variable: 'Çimlenme sıcaklıkları', source: 'J. F. Harrington, UC Davis', why: 'Ekimden sonraki hafta, tohumların çıkması için yeterince sıcak olmalı.', refs: '[21]' },
  { variable: 'Güneşlenme saatleri', source: 'Üniversitelerin tarımsal yayım hizmetleri (Rutgers, Penn State, Maryland, Michigan State)', why: 'Güneş ışığı puanı. Minimumun altındaki bitkiler listeden çıkarılır.', refs: '[24]' },
  { variable: 'm² başına verim', source: 'Michigan State University Extension, La Ferme de Sainte Marthe, Knott’s Handbook, University of Vermont Extension; tarla bitkileri için FAOSTAT dünya ortalamaları', why: 'Arazinin ekili %70’lik kısmında beklenen hasat.', refs: '[22][23][30][31][32]' },
  { variable: 'Kuraklık dayanımı', source: 'Bitki türüne göre tahmin; bezelye, fasulye, domates ve tatlı mısır için Nemeskéri ve Helyes', why: 'Etiket olarak gösterilir. Puanda kullanılmaz.', refs: '[25]' },
];

export const DATA_RESEARCHED = [
  { variable: 'Gölge, ölçülmüş', source: 'ShadeMap', why: '%30 varsayımı yerine arazi başına gerçek gölge saatleri.', refs: '[6][16][18]' },
  { variable: 'Nem', source: 'GMAO MERRA-2', why: 'Su kaybını kontrol eder. Büyüme %85 civarında en yüksek düzeye ulaşır.', refs: '[4][15]' },
  { variable: 'Toprak nemi', source: 'ESA CCI, FAO HWSD v2.0', why: 'Köklerin su ve besin almasını sağlar.', refs: '[3][8]' },
  { variable: 'Hava kirleticileri', source: 'Copernicus Sentinel-3', why: 'SO₂, O₃ ve NOₓ fotosentezi ve verimi azaltır.', refs: '[10][17]' },
];

// Architecture ----------------------------------------------------------------

export const PIPELINE = [
  { title: 'Araziyi ölç', body: 'Merkez noktası ve metrekare cinsinden alan.' },
  { title: 'İklimi getir', body: 'NASA POWER: bir yıllık günlük ısı, güneş ve yağmur. Gelir gelmez gösterilir.' },
  { title: 'Landsat’ı oku', body: '30 m çözünürlükteki Landsat 8/9 yüzey ölçümleri, arazinin havadan ne kadar sıcak olduğunu gösterir. Puanlar NASA’nın hava sıcaklıklarını kullanır.' },
  { title: 'Her bitkiyi puanla', body: 'Her bitki için ısı, güneş, sıcaklık ve su.' },
  { title: 'Sırala ve yanıtla', body: 'Puana göre sıralanır, verim ve sulama bilgisiyle. Ardından Mistral AI’dan kısa bir özet gelir.' },
];

export const STACK = [
  { title: 'Front-end', body: 'Svelte 5, TypeScript, Mapbox GL JS, Turf.js' },
  { title: 'Back-end', body: 'Python ile FastAPI, bitki veritabanı, Mistral AI özetleri ve bitki ipuçları' },
  { title: 'Veri', body: 'NASA POWER, Microsoft Planetary Computer (Landsat)' },
  { title: 'Barındırma', body: 'GitHub Pages ve Render' },
];

export const ASSUMPTIONS =
  'İklim, bir yıllık günlük veriden gelir. Toprak dikkate alınmaz, çünkü şehir bahçeleri genelde kendi toprağını getirir. Sulama az önemlidir, çünkü küçük araziler kolay sulanır. Gölge verisi yoksa güneş ışığının %30’unun binalar yüzünden kaybolduğu varsayılır.';

// Impact ----------------------------------------------------------------------

export const SDGS = [
  { n: 2, title: 'Açlığa son', points: ['Gıda güvenliği', 'Daha iyi beslenme'], body: 'Eve yakın taze gıda, uzun tedarik zincirlerine daha az bağımlılık.' },
  { n: 3, title: 'Sağlıklı ve kaliteli yaşam', points: ['Daha sağlıklı beslenme', 'Ruh sağlığı', 'Daha temiz hava'], body: 'Taze ürün, açık havada geçen zaman ve sokağı serinleten yeşillik.' },
  { n: 10, title: 'Eşitsizliklerin azaltılması', points: ['Adil erişim', 'Daha düşük market harcaması'], body: 'Gıdaya ulaşmanın zor olduğu mahallelerde uygun fiyatlı gıda.' },
  { n: 11, title: 'Sürdürülebilir şehirler', points: ['Kullanılmayan alanlar', 'İklim dayanıklılığı', 'Topluluk'], body: 'Çatılar ve balkonlar üretken hale gelir ve yağmur suyunu emer.' },
  { n: 12, title: 'Sorumlu tüketim', points: ['Daha az atık', 'Daha az emisyon'], body: 'Artıklar komposta dönüşür, gıda kıtalar değil metreler yol alır.' },
];

// Text inside the Learn components ---------------------------------------------

export const UI = {
  layout: {
    openMap: 'Haritayı aç',
    nav: 'Daha fazla bilgi',
    eyebrow: (n: string) => `Daha fazla bilgi / ${n}`,
    next: (label: string) => `Sonraki: ${label}`,
    drawPlot: 'Arazini çiz',
  },
  about: {
    whyTitle: 'Neden yaptık',
    whyBody:
      'Şehirler büyümeye, iklim değişmeye devam ediyor. Gıdayı yerelde yetiştirmek bir şehri daha dayanıklı kılar. Home Grown, arka bahçeden boş bir otoparka kadar, dünyanın her yerinde bir şehir parçasının neler yetiştirebileceğini gösterir.',
    questionsLabel: 'Arazin için yanıtladığı sorular',
    team: 'Ekip',
    recognition: 'Ödüller ve sunumlar',
    recognitionBody: 'Home Grown’un nerede sunulduğu ve neler kazandığı.',
    contact: 'İletişim',
    contactBody: 'Home Grown hakkında sorular, iş birlikleri ya da kendi şehrinde kullanmak için ekiple iletişime geç.',
    linkedin: 'LinkedIn',
    opensNewTab: (name: string) => `: ${name} (yeni sekmede açılır)`,
  },
  scoring: {
    overview: 'Genel bakış',
    title: 'Puan nelerden oluşur',
    body: 'Yeterli güneş almayan bitkiler önce çıkarılır. Diğer her bitki, dört ağırlıklı bölümden oluşan 0 ile 100 arasında bir puan alır. Isı, güneş ve sıcaklıktan en zayıf olanı bir tavan belirler: çok soğukta kalan ya da ısısı yetmeyen bir bitki, iyi yağmurla bunu kapatamaz.',
    weights: 'Ağırlıklar: ısı %35, güneş ışığı %25, sıcaklık %25, su %15',
    formula: (title: string) => `Formül: ${title}`,
  },
  data: {
    variable: 'Değişken',
    source: 'Kaynak',
    whyItMatters: 'Neden önemli',
    howWeUse: 'Nasıl kullanıyoruz',
    usedTitle: 'Sonuçlarında kullanılanlar',
    usedBody: 'Arazinin merkezi için bir yıllık günlük NASA POWER verisi ve üzerindeki her açık görüntüden Landsat 8/9 yüzey sıcaklığı.',
    usedCaption: 'Sonuçlarında kullanılan değişkenler',
    cropTitle: 'Bitki verileri',
    cropBody: (n: number) =>
      `${n} bitkinin her biri yaklaşık 17 sayı taşır. Bu sayıların nereden geldiği ve neyi etkilediği burada. Sıcaklık sınırlarının ve ısı birimlerinin çoğu artık tarla çalışmalarından geliyor. İdeal sıcaklıklar, don sınıfları ve bazı ısı birimleri hâlâ ekip tahmini; her biri değiştirildikçe kaynağını belirteceğiz.`,
    cropCaption: 'Bitki sayılarının kaynakları',
    researchedTitle: 'Araştırıldı, henüz kullanılmıyor',
    researchedBody: 'Araştırmamıza göre önemli olan ama Home Grown’un henüz okumadığı değişkenler. Ölçülmüş gölge, %30 varsayımının yerini alacak.',
    researchedCaption: 'Araştırılan ama henüz kullanılmayan değişkenler',
    sources: 'Kaynaklar',
    hideBibliography: 'Kaynakçayı gizle',
    showBibliography: (n: number) => `Kaynakçayı göster · ${n} kaynak`,
  },
  architecture: {
    title: 'Analiz düğmesine bastığında ne olur',
    body: 'GitHub Pages’teki statik bir front-end, arazini dört çağrıda Render’daki bir Python API’sine gönderir: iklim, bitkiler, özet ve istediğinde ipuçları.',
    stack: 'Teknolojiler',
    assumptions: 'Bilmeye değer varsayımlar',
    assumptionsBody: 'Sonuçlarla ilgili neyi aklımda tutmalıyım?',
  },
  impact: {
    label: 'Sürdürülebilir Kalkınma Amaçları',
    sdg: 'SDG',
    footnote: 'BM Sürdürülebilir Kalkınma Amaçları, tüm BM üyelerinin 2030’a kadar ulaşmayı kabul ettiği 17 hedeftir.',
    readMore: 'Daha fazla bilgi:',
    un: 'BM sitesi',
  },
};
