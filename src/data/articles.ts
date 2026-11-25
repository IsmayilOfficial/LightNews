import { ArticleRecord, AuthorProfile } from '../types/news';

const NOW = Date.now();
const minsAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

export const AUTHORS: Record<string, AuthorProfile> = {
  'auth-1': {
    id: 'auth-1',
    name: 'Kamran Aliyev',
    location: 'Baku',
    email: 'k.aliyev@lightnews.az',
    role: {
      en: 'Chief Diplomatic Correspondent',
      az: 'Baş Diplomatik Müxbir',
      ru: 'Шеф-корреспондент отдела политики',
    },
    beat: {
      en: 'Regional Diplomacy & Infrastructure',
      az: 'Regional Diplomatiya və İnfrastruktur',
      ru: 'Региональная дипломатия и инфраструктура',
    },
    bio: {
      en: 'Covers Eurasian diplomacy, cross-border energy corridors, and legislative policy from Baku and Brussels.',
      az: 'Bakı və Brüsseldən Avrasiya diplomatiyası, transsərhəd enerji dəhlizləri və qanunvericilik siyasətini işıqlandırır.',
      ru: 'Освещает евразийскую дипломатию, трансграничные энергетические коридоры и законодательную повестку из Баку и Брюсселя.',
    },
  },
  'auth-2': {
    id: 'auth-2',
    name: 'Nigar Mammadova',
    location: 'Baku / Munich',
    email: 'n.mammadova@lightnews.az',
    role: {
      en: 'Senior Technology Editor',
      az: 'Baş Texnologiya Redaktoru',
      ru: 'Старший редактор отдела технологий',
    },
    beat: {
      en: 'Semiconductors & AI Systems',
      az: 'Yarımkeçiricilər və Süni İntellekt',
      ru: 'Полупроводники и ИИ-системы',
    },
    bio: {
      en: 'Reports on semiconductor manufacturing, photonic interconnects, and sovereign compute infrastructure.',
      az: 'Yarımkeçirici istehsalı, fotonik bağlantılar və hesablama infrastrukturu üzrə ixtisaslaşıb.',
      ru: 'Пишет о производстве полупроводников, кремниевой фотонике и вычислительной инфраструктуре.',
    },
  },
  'auth-3': {
    id: 'auth-3',
    name: 'David Ross',
    location: 'London',
    email: 'd.ross@lightnews.az',
    role: {
      en: 'Markets & Macroeconomics Desk',
      az: 'Bazarlar və Makroiqtisadiyyat Şöbəsi',
      ru: 'Отдел рынков и макроэкономики',
    },
    beat: {
      en: 'Central Banking & Capital Markets',
      az: 'Mərkəzi Banklar və Kapital Bazarları',
      ru: 'Центробанки и рынки капитала',
    },
    bio: {
      en: 'Analyzes sovereign liquidity bridges, trade settlement infrastructure, and emerging-market fiscal policy.',
      az: 'Suveren likvidlik körpüləri, ticarət hesablaşmaları və maliyyə siyasətini təhlil edir.',
      ru: 'Анализирует расчетные системы центробанков, ликвидность и фискальную политику развивающихся рынков.',
    },
  },
  'auth-4': {
    id: 'auth-4',
    name: 'Elena Lindqvist',
    location: 'Stockholm',
    email: 'e.lindqvist@lightnews.az',
    role: {
      en: 'Energy & Climate Desk',
      az: 'Enerji və İqlim Şöbəsi',
      ru: 'Отдел энергетики и климата',
    },
    beat: {
      en: 'Clean Grids & Climate Policy',
      az: 'Yaşıl Şəbəkələr və İqlim Siyasəti',
      ru: 'Зеленая энергетика и климат',
    },
    bio: {
      en: 'Covers offshore wind engineering, grid storage, and international climate finance treaties.',
      az: 'Dəniz külək energetikası, şəbəkə saxlama texnologiyaları və beynəlxalq iqlim maliyyəsini işıqlandırır.',
      ru: 'Специализируется на морской ветроэнергетике, системах хранения энергии и климатических соглашениях.',
    },
  },
  'auth-5': {
    id: 'auth-5',
    name: 'Rashad Hasanov',
    location: 'Baku',
    email: 'r.hasanov@lightnews.az',
    role: {
      en: 'Lead Sports Correspondent',
      az: 'Baş İdman Müxbiri',
      ru: 'Ведущий спортивный обозреватель',
    },
    beat: {
      en: 'European Football & Stadium Tech',
      az: 'Avropa Futbolu və Stadion Texnologiyaları',
      ru: 'Европейский футбол и инфраструктура',
    },
    bio: {
      en: 'Follows continental club competitions, tactical analytics, and modern stadium engineering.',
      az: 'Qitə klub turnirləri, taktiki analitika və müasir stadion infrastrukturunu izləyir.',
      ru: 'Освещает континентальные клубные турниры, тактическую аналитику и современные стадионы.',
    },
  },
  'auth-6': {
    id: 'auth-6',
    name: 'Leyla Gasimova',
    location: 'Baku',
    email: 'l.gasimova@lightnews.az',
    role: {
      en: 'Urban Affairs & Society',
      az: 'Şəhər İnfrastrukturu və Cəmiyyət',
      ru: 'Городская среда и общество',
    },
    beat: {
      en: 'Public Transit, Education & Civic Tech',
      az: 'İctimai Nəqliyyat və Təhsil',
      ru: 'Городской транспорт и образование',
    },
    bio: {
      en: 'Reports on zero-emission urban mobility, civic digitalization, and higher-education fellowships.',
      az: 'Sıfır emissiyalı şəhər mobilliyi, rəqəmsal dövlət xidmətləri və təhsil proqramlarından yazır.',
      ru: 'Пишет о городском электротранспорте, цифровых сервисах и образовательных инициативах.',
    },
  },
  'auth-7': {
    id: 'auth-7',
    name: 'Marcus Vance',
    location: 'Frankfurt',
    email: 'm.vance@lightnews.az',
    role: {
      en: 'Cybersecurity & Cloud Architecture',
      az: 'Kibertəhlükəsizlik və Bulud Memarlığı',
      ru: 'Кибербезопасность и облачные системы',
    },
    beat: {
      en: 'Zero-Trust & Quantum Networking',
      az: 'Zero-Trust və Kvant Şəbəkələri',
      ru: 'Zero-Trust и квантовые сети',
    },
    bio: {
      en: 'Covers post-quantum cryptography, optical backbone security, and resilient cloud architecture.',
      az: 'Post-kvant kriptoqrafiya, optik şəbəkə təhlükəsizliyi və dayanıqlı bulud sistemlərini araşdırır.',
      ru: 'Исследует постквантовую криптографию, защиту оптических магистралей и облачную безопасность.',
    },
  },
};

export const INITIAL_ARTICLES: ArticleRecord[] = [
  {
    id: 'art-101',
    slug: 'caspian-digital-energy-corridor-accord-baku',
    category: 'politics',
    tags: ['Caspian Summit', 'Energy Diplomacy', 'Baku', 'EU Corridor'],
    title: {
      en: 'Baku Summit Finalizes Cross-Caspian Digital and Green Energy Corridor Accord',
      az: 'Bakı Sammitində Xəzəryanı Rəqəmsal və Yaşıl Enerji Dəhlizi Sazişi imzalandı',
      ru: 'На саммите в Баку подписано соглашение о Транскаспийском цифровом и зеленом энергокоридоре',
    },
    excerpt: {
      en: 'Delegations from twelve Eurasian and European ministries ratified an integrated fiber-optic and subsea power transmission framework linking Baku to Central European grids.',
      az: 'On iki Avrasiya və Avropa nazirliyinin nümayəndə heyətləri Bakını Mərkəzi Avropa şəbəkələri ilə birləşdirən fiber-optik və sualtı enerji ötürücü çərçivəni təsdiqlədi.',
      ru: 'Делегации двенадцати министерств Евразии и Европы утвердили интегрированную рамочную программу прокладки оптоволокна и подводной передачи электроэнергии.',
    },
    pullQuote: {
      en: '“Subsea optical capacity and renewable megawatts now travel along the exact same strategic infrastructure corridor.”',
      az: '“Sualtı optik tutum və bərpa olunan meqavatlar artıq eyni strateji infrastruktur dəhlizi boyunca hərəkət edir.”',
      ru: '«Подводная оптическая магистраль и возобновляемая энергетика теперь разделяют единый стратегический инфраструктурный коридор».',
    },
    imageCaption: {
      en: 'International delegations arriving at the Caspian Convention Center along Baku Boulevard ahead of the ministerial plenary.',
      az: 'Nazirlər plenar iclası ərəfəsində Bakı Bulvarı boyunca Xəzər Konqres Mərkəzinə gələn beynəlxalq nümayəndə heyətləri.',
      ru: 'Международные делегации прибывают в Конгресс-центр на Бакинском бульваре перед началом пленарного заседания.',
    },
    bodyHtml: {
      en: `<p>Ministers of energy, digital development, and foreign affairs concluded two days of intensive negotiations in Baku on Wednesday, signing a binding joint implementation protocol for the Cross-Caspian Digital and Green Energy Corridor.</p>
<p>The dual-purpose infrastructure blueprint pairs a 4-gigawatt high-voltage direct-current (HVDC) subsea cable beneath the Black Sea with redundant terabit-scale optical fiber trunks running from the Caspian basin toward Frankfurt and Vienna.</p>
<p>Officials emphasized that technical feasibility studies conducted over the past fourteen months confirmed significant transmission cost reductions when subsea trenching and repeater stations are co-engineered across both power and telecommunications operators.</p>
<p>Under the ratified timetable, sovereign wealth funds and multilateral development banks will allocate the initial $2.4 billion tranche for converter substations in the first quarter of next year, followed by environmental marine surveying along the eastern basin.</p>
<p>Regional grid operators will also deploy shared real-time telemetry standards to balance wind and solar generation spikes across borders, minimizing curtailment during peak seasonal generation windows.</p>`,
      az: `<p>Energetika, rəqəmsal inkişaf və xarici işlər nazirləri çərşənbə günü Bakıda iki gün davam edən intensiv danışıqları yekunlaşdıraraq Xəzəryanı Rəqəmsal və Yaşıl Enerji Dəhlizi üzrə birgə icra protokolunu imzaladılar.</p>
<p>İkiməqsədli infrastruktur layihəsi Qara dəniz altından keçən 4 giqavatlıq yüksək gərginlikli sabit cərəyan (HVDC) kabelini Xəzər hövzəsindən Frankfurt və Vyanaya uzanan terabit miqyaslı fiber-optik xətlərlə birləşdirir.</p>
<p>Rəsmi şəxslər qeyd ediblər ki, son on dörd ay ərzində aparılan texniki-iqtisadi əsaslandırmalar həm enerji, həm də telekommunikasiya operatorlarının birgə mühəndislik işləri sayəsində xərclərin əhəmiyyətli dərəcədə azaldığını təsdiqləyib.</p>
<p>Təsdiq edilmiş cədvələ əsasən, suveren fondlar və beynəlxalq inkişaf bankları gələn ilin birinci rübündə çevirici yarımstansiyalar üçün ilk 2,4 milyard dollarlıq tranşı ayıracaqlar.</p>
<p>Regional şəbəkə operatorları külək və günəş enerjisi istehsalındakı pik yüklənmələri sərhədlərarası balanslaşdırmaq üçün vahid real vaxt telemetriya standartları tətbiq edəcəklər.</p>`,
      ru: `<p>Министры энергетики, цифрового развития и иностранных дел завершили двухдневные переговоры в Баку, подписав обязывающий протокол о реализации Транскаспийского цифрового и зеленого энергетического коридора.</p>
<p>Двойная инфраструктурная схема объединяет подводный высоковольтный кабель постоянного тока мощностью 4 гигаватта с резервированными терабитными волоконно-оптическими магистралями в направлении Франкфурта и Вены.</p>
<p>Технико-экономические исследования, проведенные за последние четырнадцать месяцев, подтвердили существенное снижение капитальных затрат за счет совместного проектирования подводных траншей и усилительных станций.</p>
<p>Согласно утвержденному графику, суверенные фонды и международные банки развития выделят первый транш в размере 2,4 миллиарда долларов на строительство преобразовательных подстанций в первом квартале следующего года.</p>
<p>Региональные системные операторы также внедрят единые стандарты телеметрии в реальном времени для балансировки ветровой и солнечной генерации между энергосистемами.</p>`,
    },
    mediaAsset: {
      id: 'med-101',
      storageProvider: 'Cloudflare R2',
      objectKey: 'media/2026/11/baku-summit-16x9.webp',
      cdnUrl: '/src/assets/images/news_baku_summit_1795615683603.jpg',
      mimeType: 'image/jpeg',
      width: 1600,
      height: 900,
    },
    author: AUTHORS['auth-1'],
    publishedAt: minsAgo(14),
    readTimeMinutes: 4,
    viewsToday: 4820,
    viewsWeek: 18450,
    likes: 342,
    dislikes: 18,
    isBreaking: true,
    isFeatured: true,
    editorialPriority: 1.45,
  },
  {
    id: 'art-102',
    slug: 'ai-accelerator-2nm-lithography-yield-breakthrough',
    category: 'tech',
    tags: ['Semiconductors', 'AI Compute', '2nm Process', 'Hardware'],
    title: {
      en: 'Next-Generation 2nm Photonic Packaging Cuts AI Cluster Power Draw by 38%',
      az: 'Yeni nəsil 2nm fotonik paketləmə süni intellekt klasterlərinin enerji sərfini 38% azaldır',
      ru: 'Фотонная упаковка 2-нм чипов снижает энергопотребление ИИ-кластеров на 38%',
    },
    excerpt: {
      en: 'Foundry engineers demonstrated co-packaged silicon photonics on sub-2nm logic wafers, eliminating copper interconnect bottlenecks across hyperscale racks.',
      az: 'Yarımkeçirici mühəndisləri 2nm məntiq lövhələrində birgə paketlənmiş silikon fotonikanı nümayiş etdirərək mis əlaqə məhdudiyyətlərini aradan qaldırdılar.',
      ru: 'Инженеры продемонстрировали интегрированную кремниевую фотонику на пластинах 2 нм, устранив потери на медных межсоединениях.',
    },
    pullQuote: {
      en: '“Moving photons directly to the compute die turns thermal limits from a hard wall into manageable headroom.”',
      az: '“Fotonları birbaşa hesablama kristalına gətirmək istilik məhdudiyyətini idarəolunan ehtiyata çevirir.”',
      ru: '«Подведение фотонов непосредственно к вычислительному кристаллу превращает тепловой барьер в управляемый запас мощности».',
    },
    imageCaption: {
      en: 'Optical wafer inspection inside the Class-10 cleanroom verification line prior to thermal stress testing.',
      az: 'Termal sınaqlardan əvvəl Class-10 təmiz otaq xəttində optik lövhənin yoxlanılması.',
      ru: 'Оптический контроль пластины в чистой комнате класса 10 перед началом тепловых испытаний.',
    },
    bodyHtml: {
      en: `<p>Semiconductor packaging researchers unveiled production-ready silicon photonics interposers this morning, reporting a 38% drop in total rack power consumption during sustained transformer training workloads.</p>
<p>For the past decade, data center architects have confronted an escalating interconnect wall: while transistor gates shrank steadily, copper traces linking adjacent accelerators consumed an ever-larger share of electricity and generated concentrated heat.</p>
<p>By etching optical waveguides directly into the glass substrate beneath each 2-nanometer compute tile, signals travel between chips at 1.6 terabits per second per fiber lane with less than half the latency of electrical SERDES links.</p>
<p>Cloud infrastructure providers testing early engineering samples reported that liquid-cooling loop temperatures fell by 9 degrees Celsius under identical model throughput benchmarks.</p>
<p>Volume ramp-up is scheduled for late Q3 next year, targeting sovereign AI research clusters and low-latency financial risk engines.</p>`,
      az: `<p>Yarımkeçirici tədqiqatçıları bu gün sənaye tətbiqinə hazır silikon fotonika interpozerlərini təqdim edərək davamlı neyroşəbəkə təlimi zamanı enerji sərfinin 38% azaldığını açıqladılar.</p>
<p>Son onillikdə data mərkəzi memarları artan əlaqə problemi ilə üzləşirdilər: tranzistorlar kiçildikcə qonşu sürətləndiriciləri birləşdirən mis xətlər daha çox enerji sərf edir və istilik yaradırdı.</p>
<p>Optik dalğaötürücüləri birbaşa 2 nanometrlik hesablama lövhəsinin altındakı şüşə substrata həkk etməklə siqnallar çiplər arasında saniyədə 1,6 terabit sürətlə ötürülür.</p>
<p>İlkin sınaqları keçirən bulud operatorları eyni hesablama məhsuldarlığında maye soyutma temperaturunun 9 dərəcə Selsi aşağı düşdüyünü bildiriblər.</p>
<p>Kütləvi istehsalın gələn ilin üçüncü rübündə başlaması gözlənilir.</p>`,
      ru: `<p>Исследователи в области полупроводниковой упаковки представили готовые к серийному выпуску кремниевые фотонные интерпозеры, зафиксировав снижение энергопотребления стоек на 38%.</p>
<p>В течение последнего десятилетия архитекторы дата-центров сталкивались с проблемой межсоединений: медные дорожки между ускорителями потребляли все большую долю энергии и создавали локальный перегрев.</p>
<p>Формирование оптических волноводов непосредственно в стеклянной подложке под 2-нанометровым кристаллом позволяет передавать данные на скорости 1,6 терабит в секунду с минимальной задержкой.</p>
<p>Тестовые кластеры показали снижение температуры контура жидкостного охлаждения на 9 градусов Цельсия при сохранении прежней производительности обучения моделей.</p>
<p>Массовое производство планируется развернуть в третьем квартале следующего года.</p>`,
    },
    mediaAsset: {
      id: 'med-102',
      storageProvider: 'Cloudflare R2',
      objectKey: 'media/2026/11/semiconductor-2nm.webp',
      cdnUrl: '/src/assets/images/news_semiconductor_ai_1795615686385.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-2'],
    publishedAt: minsAgo(38),
    readTimeMinutes: 5,
    viewsToday: 3690,
    viewsWeek: 14210,
    likes: 289,
    dislikes: 11,
    isBreaking: true,
    isFeatured: true,
    editorialPriority: 1.32,
  },
  {
    id: 'art-103',
    slug: 'central-banks-coordinate-instant-cross-border-settlement',
    category: 'economy',
    tags: ['Central Banks', 'FinTech', 'Liquidity', 'Markets'],
    title: {
      en: 'Central Banks Launch Real-Time Multi-Currency Settlement Bridge for Regional Trade',
      az: 'Mərkəzi Banklar regional ticarət üçün real vaxtlı çoxvalyutalı hesablaşma körpüsünü işə saldı',
      ru: 'Центробанки запустили платформу мгновенных мультивалютных расчетов для региональной торговли',
    },
    excerpt: {
      en: 'Automated liquidity corridors cut corporate cross-border settlement times from three business days to under four seconds with zero correspondent banking fees.',
      az: 'Avtomatlaşdırılmış likvidlik dəhlizləri korporativ sərhədlərarası hesablaşma müddətini üç iş günündən dörd saniyəyə endirib.',
      ru: 'Автоматизированные коридоры ликвидности сократили время международных корпоративных расчетов с трех дней до четырех секунд.',
    },
    pullQuote: {
      en: '“Instant finality removes trapped working capital from supply chains across manufacturing and logistics.”',
      az: '“Ani hesablaşma istehsal və logistika tədarük zəncirlərində dondurulmuş dövriyyə kapitalını sərbəst buraxır.”',
      ru: '«Мгновенная завершенность платежей высвобождает оборотный капитал в производственных и логистических цепочках».',
    },
    imageCaption: {
      en: 'Trading floor and treasury clearing terminals during the morning liquidity opening bell.',
      az: 'Səhər likvidlik açılışı zamanı ticarət zalı və xəzinədarlıq klirinq terminalları.',
      ru: 'Торговый зал и расчетные терминалы казначейства в момент открытия утренней сессии ликвидности.',
    },
    bodyHtml: {
      en: `<p>Financial regulators across six regional clearing houses activated a unified real-time gross settlement (RTGS) bridge today, allowing commercial banks to clear invoices directly in local currencies without intermediary dollar hops.</p>
<p>According to initial clearing data released at noon, over $410 million in manufacturing and agricultural trade invoices settled during the first four hours of live operation, with median confirmation latency measured at 3.2 seconds.</p>
<p>Treasury analysts note that small and mid-sized exporters historically paid between 1.8% and 3.4% in foreign exchange spreads and correspondent bank fees when invoicing neighboring markets.</p>
<p>The new protocol enforces ISO 20022 rich messaging schemas alongside zero-knowledge compliance proofs for anti-money-laundering screening without exposing sensitive commercial invoice metadata.</p>`,
      az: `<p>Altı regional klirinq mərkəzinin maliyyə tənzimləyiciləri bu gün vahid real vaxtlı hesablaşma (RTGS) körpüsünü aktivləşdirərək kommersiya banklarına vasitəçisiz birbaşa hesablaşma imkanı yaratdılar.</p>
<p>Günorta açıqlanan ilkin məlumatlara görə, əməliyyatın ilk dörd saatında 410 milyon dollardan çox sənaye və kənd təsərrüfatı ticarət fakturası orta hesabla 3,2 saniyə ərzində təsdiqlənib.</p>
<p>Analitiklər qeyd edirlər ki, kiçik və orta ixracatçılar əvvəllər qonşu bazarlarla hesablaşmalarda 1,8%-dən 3,4%-ə qədər komissiya və məzənnə fərqi ödəyirdilər.</p>
<p>Yeni protokol həssas kommersiya məlumatlarını açıqlamadan uyğunluq yoxlamalarını təmin edən ISO 20022 standartlarına əsaslanır.</p>`,
      ru: `<p>Финансовые регуляторы шести региональных расчетных палат активировали единый мост валовых расчетов в реальном времени (RTGS), позволяющий банкам проводить прямые платежи в национальных валютах.</p>
<p>По данным полуденного клиринга, за первые четыре часа работы системы были проведены торговые контракты на сумму свыше 410 миллионов долларов со средней задержкой подтверждения 3,2 секунды.</p>
<p>Эксперты отмечают, что ранее экспортеры теряли до 3,4% на конверсионных спредах и комиссиях банков-корреспондентов.</p>
<p>Новый протокол использует стандарт ISO 20022 и криптографические доказательства комплаенс-проверок без раскрытия коммерческой тайны.</p>`,
    },
    mediaAsset: {
      id: 'med-103',
      storageProvider: 'AWS S3',
      objectKey: 'media/2026/11/central-bank-bridge.webp',
      cdnUrl: '/src/assets/images/news_central_bank_1795615686800.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-3'],
    publishedAt: minsAgo(55),
    readTimeMinutes: 4,
    viewsToday: 2980,
    viewsWeek: 11900,
    likes: 198,
    dislikes: 14,
    isBreaking: false,
    isFeatured: true,
    editorialPriority: 1.25,
  },
  {
    id: 'art-104',
    slug: 'offshore-wind-grid-telemetry-record-output',
    category: 'economy',
    tags: ['Renewables', 'Energy Grid', 'Offshore Wind', 'Investment'],
    title: {
      en: 'Offshore Wind Telemetry Upgrades Push Coastal Grid Reliability to 99.94%',
      az: 'Dəniz külək stansiyalarında telemetriya yenilənməsi şəbəkə etibarlılığını 99,94%-ə yüksəltdi',
      ru: 'Модернизация телеметрии морских ВЭС довела надежность прибрежных сетей до 99,94%',
    },
    excerpt: {
      en: 'Predictive turbine pitch control and battery storage dispatch helped offshore operators absorb winter storm gusts without shedding industrial load.',
      az: 'Proqnozlaşdırıcı turbin idarəetməsi və batareya saxlama sistemləri qış fırtınaları zamanı sənaye yükünü kəsmədən sabitliyi qorudu.',
      ru: 'Предиктивное управление лопастями и буферные накопители позволили ветропаркам пройти зимние штормы без ограничений нагрузки.',
    },
    pullQuote: {
      en: '“Sub-second wind shear telemetry gives grid dispatchers ten minutes of predictive foresight instead of reactive scrambling.”',
      az: '“Saniyəaltı külək telemetriyası dispetçerlərə reaksiya əvəzinə on dəqiqəlik proqnoz üstünlüyü verir.”',
      ru: '«Субсекундная телеметрия сдвига ветра дает диспетчерам десять минут упреждающего горизонта планирования».',
    },
    imageCaption: {
      en: 'Control room engineers monitoring real-time 345 MW offshore turbine array dispatch.',
      az: '345 MVt gücündə dəniz turbin massivinin real vaxt rejimində dispetçer nəzarəti.',
      ru: 'Инженеры диспетчерского центра контролируют выработку морского ветропарка мощностью 345 МВт.',
    },
    bodyHtml: {
      en: `<p>Grid engineers overseeing the North Sea and Caspian coastal wind corridors reported record operational stability this week after deploying LiDAR-assisted turbine forecasting across 140 offshore platforms.</p>
<p>By measuring approaching wind gusts 800 meters upstream of turbine blades, automated pitch controllers preemptively smooth mechanical torque spikes and trigger synchronized grid-scale lithium-iron-phosphate battery buffers.</p>
<p>Energy economists calculate that improved predictability reduced wholesale balancing reserve costs by €18 million during the autumn quarter alone.</p>`,
      az: `<p>Şimal dənizi və Xəzər sahili külək dəhlizlərinə nəzarət edən şəbəkə mühəndisləri 140 dəniz platformasında LiDAR əsaslı proqnozlaşdırma tətbiq etdikdən sonra rekord sabitlik əldə etdilər.</p>
<p>Turbin pərlərindən 800 metr əvvəl yaxınlaşan külək dalğalarını ölçməklə avtomatlaşdırılmış sistemlər mexaniki yüklənməni qabaqlayıcı şəkildə tənzimləyir.</p>
<p>Enerji iqtisadçıları yalnız payız rübündə balanslaşdırma ehtiyat xərclərinin 18 milyon avro azaldığını hesablayıblar.</p>`,
      ru: `<p>Инженеры энергосистем прибрежных ветрокоридоров зафиксировали рекордную стабильность после развертывания LiDAR-прогнозирования на 140 морских платформах.</p>
<p>Измеряя порывы ветра за 800 метров до лопастей, автоматика заранее корректирует угол атаки и синхронизирует работу промышленных накопителей.</p>
<p>Экономисты оценивают снижение затрат на балансирующие резервы в 18 миллионов евро только за осенний квартал.</p>`,
    },
    mediaAsset: {
      id: 'med-104',
      storageProvider: 'Cloudflare R2',
      objectKey: 'media/2026/11/offshore-wind-telemetry.webp',
      cdnUrl: '/src/assets/images/news_energy_corridor_1795615685474.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-4'],
    publishedAt: hoursAgo(2),
    readTimeMinutes: 3,
    viewsToday: 2140,
    viewsWeek: 9840,
    likes: 164,
    dislikes: 7,
    isBreaking: false,
    isFeatured: true,
    editorialPriority: 1.18,
  },
  {
    id: 'art-105',
    slug: 'champions-night-dramatic-stoppage-time-equalizer',
    category: 'sports',
    tags: ['Football', 'Champions League', 'Match Report', 'Europe'],
    title: {
      en: 'Stoppage-Time Volley Seals Thrilling 2–2 Draw Under Floodlights in European Tie',
      az: 'Avropa Kuboku matçında əlavə vaxtda vurulan qol gərgin 2–2 hesablı heç-heçə gətirdi',
      ru: 'Гол в компенсированное время принес боевую ничью 2:2 в напряженном еврокубковом матче',
    },
    excerpt: {
      en: 'A relentless second-half press overturned a two-goal deficit in front of 42,000 supporters, keeping quarterfinal qualification wide open ahead of the return leg.',
      az: '42 min azarkeş önündə ikinci hissədəki təzyiq iki qolluq fərqi aradan qaldırdı və cavab oyunu öncəsi şansları bərabərləşdirdi.',
      ru: 'Неудержимый прессинг во втором тайме на глазах у 42 000 зрителей позволил отыграть отставание в два мяча перед ответной игрой.',
    },
    pullQuote: {
      en: '“We never dropped the defensive line even at 2–0 down; the crowd carried every sprint in the final ten minutes.”',
      az: '“Hətta 0:2 geridə olanda belə müdafiə xəttini aşağı salmadıq; son on dəqiqədə azarkeşlər hər hücumumuza güc verdi.”',
      ru: '«Мы не опускали линию обороны даже при счете 0:2 — трибуны гнали нас вперед в последние десять минут».',
    },
    imageCaption: {
      en: 'Midfield duel near the touchline during the decisive 89th-minute buildup.',
      az: 'Həlledici 89-cu dəqiqə hücumu zamanı meydanın kənarındakı gərgin mübarizə.',
      ru: 'Борьба за мяч у бровки поля на 89-й минуте перед решающей атакой.',
    },
    bodyHtml: {
      en: `<p>Under crisp autumn floodlights and deafening stadium acoustics, Tuesday night's continental clash delivered one of the season's sharpest tactical turnarounds.</p>
<p>After conceding twice on rapid counterattacks before halftime, the home side shifted to an aggressive 3-4-2-1 diamond press, pinning the visitors inside their own penalty box for twenty-five straight minutes.</p>
<p>A curling 74th-minute free kick halved the deficit before a sweeping wing switch set up the dramatic 93rd-minute volley into the top corner.</p>
<p>Both managers praised the match tempo afterward, setting the stage for a decisive second leg in two weeks' time.</p>`,
      az: `<p>Payız axşamının stadion işıqları altında keçirilən qitə miqyaslı qarşılaşma mövsümün ən kəskin taktiki dönüşlərindən biri ilə yadda qaldı.</p>
<p>Fasilədən əvvəl iki sürətli əks-hücum qolu buraxan ev sahibləri ikinci hissədə aqressiv 3-4-2-1 sxeminə keçərək rəqibi iyirmi beş dəqiqə cərimə meydançasında saxladılar.</p>
<p>74-cü dəqiqədə cərimə zərbəsindən vurulan qol fərqi azaltdı, 93-cü dəqiqədə isə baxımlı zərbə hesabı bərabərləşdirdi.</p>
<p>Hər iki baş məşqçi oyunun yüksək tempini yüksək qiymətləndirdi.</p>`,
      ru: `<p>Под светом вечерних прожекторов и при оглушительной поддержке трибун континентальное дерби подарило один из самых ярких камбэков сезона.</p>
<p>Пропустив дважды в контратаках до перерыва, хозяева перестроились на агрессивный высокий прессинг 3-4-2-1 и заперли соперника в его штрафной.</p>
<p>Точный удар со штрафного на 74-й минуте сократил отставание, а эффектный удар с лета на 93-й принес ничью 2:2.</p>`,
    },
    mediaAsset: {
      id: 'med-105',
      storageProvider: 'Cloudflare R2',
      objectKey: 'media/2026/11/european-football-tie.webp',
      cdnUrl: '/src/assets/images/news_football_stadium_1795615686115.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-5'],
    publishedAt: hoursAgo(3),
    readTimeMinutes: 3,
    viewsToday: 5410,
    viewsWeek: 21300,
    likes: 412,
    dislikes: 29,
    isBreaking: false,
    isFeatured: true,
    editorialPriority: 1.22,
  },
  {
    id: 'art-106',
    slug: 'municipal-electric-tram-network-cuts-commute-times',
    category: 'society',
    tags: ['Urban Transit', 'Smart City', 'Public Mobility', 'Sustainability'],
    title: {
      en: 'Zero-Emission Boulevard Tram Lines Trim Inner-City Commutes by 27 Minutes',
      az: 'Sıfır emissiyalı bulvar tramvay xətləri şəhərdaxili gediş-gəlişi 27 dəqiqə qısaldıb',
      ru: 'Электрические трамвайные линии сократили время поездок по центру города на 27 минут',
    },
    excerpt: {
      en: 'Signal-priority intersections and battery-hybrid rolling stock boosted daily public transit ridership by 44% in the first six months of operation.',
      az: 'Ağıllı işıqfor prioriteti və batareya-hibrid vaqonlar ilk altı ayda ictimai nəqliyyat sərnişin axınını 44% artırıb.',
      ru: 'Приоритет на перекрестках и гибридные составы увеличили ежедневный пассажиропоток на 44% за первые полгода работы.',
    },
    pullQuote: {
      en: '“When surface rail is predictable down to the minute, commuters leave private cars in the garage voluntarily.”',
      az: '“Yerüstü relsli nəqliyyat dəqiqəyə qədər proqnozlaşdırılan olduqda, sərnişinlər şəxsi avtomobildən könüllü imtina edir.”',
      ru: '«Когда наземный рельсовый транспорт предсказуем с точностью до минуты, водители добровольно пересаживаются на него».',
    },
    imageCaption: {
      en: 'Low-floor electric tram crossing the tree-lined central boulevard during morning rush hour.',
      az: 'Səhər pik saatında mərkəzi bulvar boyunca hərəkət edən alçaqdöşəməli elektrik tramvayı.',
      ru: 'Низкопольный электрический трамвай на центральном бульваре в утренний час пик.',
    },
    bodyHtml: {
      en: `<p>Urban mobility planners released six-month ridership telemetry showing that newly opened catenary-free boulevard tram corridors carried 118,000 daily passengers while cutting peak-hour vehicular congestion by nearly one-fifth.</p>
<p>Unlike legacy streetcars, the new fleet uses roof-mounted supercapacitors that recharge automatically during 25-second station stops, preserving historic streetscapes without overhead wires.</p>
<p>Pedestrian safety sensors along crosswalks also reduced intersection incidents by 61% compared with the prior bus-only lane configuration.</p>`,
      az: `<p>Şəhər mobilliyi mütəxəssisləri yeni açılan kontaktsız bulvar tramvay xətlərinin gündəlik 118 min sərnişin daşıdığını və pik saat sıxlığını beşdə bir azaltdığını açıqlayıblar.</p>
<p>Yeni nəsil vaqonlar dayanacaqlarda cəmi 25 saniyə ərzində enerji toplayan superkondensatorlardan istifadə etdiyi üçün tarixi küçələrdə hava naqillərinə ehtiyac qalmır.</p>
<p>Piyada keçidlərində quraşdırılan təhlükəsizlik sensorları kəsişmələrdə insidentləri 61% azaldıb.</p>`,
      ru: `<p>Градостроительные ведомства опубликовали полугодовую статистику: новые трамвайные коридоры без контактной сети перевозят 118 000 пассажиров ежедневно и снизили пробки почти на 20%.</p>
<p>Составы оснащены суперконденсаторами, которые подзаряжаются за 25 секунд на остановках, что позволило сохранить исторический облик проспектов без проводов.</p>`,
    },
    mediaAsset: {
      id: 'med-106',
      storageProvider: 'AWS S3',
      objectKey: 'media/2026/11/electric-tram-boulevard.webp',
      cdnUrl: '/src/assets/images/news_urban_transit_1795615686731.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-6'],
    publishedAt: hoursAgo(4),
    readTimeMinutes: 4,
    viewsToday: 1890,
    viewsWeek: 7620,
    likes: 245,
    dislikes: 9,
    isBreaking: false,
    isFeatured: false,
    editorialPriority: 1.05,
  },
  {
    id: 'art-107',
    slug: 'post-quantum-encryption-mandate-nordic-data-centers',
    category: 'tech',
    tags: ['Cybersecurity', 'Quantum Crypto', 'Data Centers', 'Zero Trust'],
    title: {
      en: 'Nordic Sovereign Cloud Providers Roll Out Post-Quantum TLS Across Backbone Fiber',
      az: 'Skandinaviya bulud operatorları magistral fiber xətlərdə post-kvant TLS şifrələməsinə keçir',
      ru: 'Североевропейские облачные провайдеры внедряют постквантовое шифрование TLS на магистралях',
    },
    excerpt: {
      en: 'Hybrid ML-KEM key encapsulation protects terabits of healthcare and financial traffic against harvest-now-decrypt-later threats with under 0.4ms handshake overhead.',
      az: 'Hibrid ML-KEM açar mübadiləsi səhiyyə və maliyyə trafikini gələcək kvant deşifrələmə risklərindən 0,4 ms-dən az gecikmə ilə qoruyur.',
      ru: 'Гибридный обмен ключами ML-KEM защищает медицинский и банковский трафик от будущих квантовых атак при задержке менее 0,4 мс.',
    },
    pullQuote: {
      en: '“Zero-trust encryption can no longer wait for fault-tolerant quantum computers to arrive—adversaries archive ciphertext today.”',
      az: '“Zero-Trust şifrələməsi kvant kompüterlərinin çıxmasını gözləyə bilməz — rəqiblər şifrələnmiş məlumatları bu gün toplayır.”',
      ru: '«Криптография нулевого доверия не может ждать появления квантовых компьютеров — перехват трафика идет уже сегодня».',
    },
    imageCaption: {
      en: 'Core optical routing aisle inside a hydroelectric-powered Nordic Tier-IV data facility.',
      az: 'Hidroenerji ilə işləyən Tier-IV data mərkəzinin əsas optik marşrutlaşdırma dəhlizi.',
      ru: 'Магистральный оптический узел в дата-центре уровня Tier-IV на гидроэнергетике.',
    },
    bodyHtml: {
      en: `<p>Infrastructure security teams across Stockholm, Helsinki, and Oslo completed a twelve-month migration to NIST-standardized post-quantum hybrid key exchange across core inter-datacenter optical rings.</p>
<p>Using hardware-accelerated lattice cryptography cards paired with classical X25519 curves, the deployment neutralizes "harvest now, decrypt later" interception risks without requiring application-level code rewrites.</p>
<p>Independent latency benchmarks verified that TLS 1.3 handshake overhead increased by just 0.38 milliseconds across 400Gbps backbone trunks.</p>`,
      az: `<p>Stokholm, Helsinki və Oslodakı infrastruktur təhlükəsizliyi komandaları data mərkəzləri arasında NIST standartlı post-kvant hibrid açar mübadiləsinə keçidi tamamladılar.</p>
<p>Klassik X25519 əyriləri ilə birləşdirilmiş aparat sürətləndiricili şəbəkə kartları tətbiq kodunu dəyişmədən gələcək kvant hücumlarına qarşı müdafiə yaradır.</p>`,
      ru: `<p>Команды безопасности в Стокгольме, Хельсинки и Осло завершили переход на постквантовый гибридный обмен ключами по стандартам NIST на магистральных оптических кольцах.</p>
<p>Аппаратные криптоускорители в паре с классическим X25519 устраняют угрозу отложенной расшифровки без переписывания прикладного ПО.</p>`,
    },
    mediaAsset: {
      id: 'med-107',
      storageProvider: 'Cloudflare R2',
      objectKey: 'media/2026/11/nordic-quantum-fiber.webp',
      cdnUrl: '/src/assets/images/news_quantum_fiber_1795615686953.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-7'],
    publishedAt: hoursAgo(5),
    readTimeMinutes: 5,
    viewsToday: 2670,
    viewsWeek: 12450,
    likes: 218,
    dislikes: 6,
    isBreaking: false,
    isFeatured: false,
    editorialPriority: 1.12,
  },
  {
    id: 'art-108',
    slug: 'geneva-plenary-adopts-binding-ai-provenance-standard',
    category: 'world',
    tags: ['UN Plenary', 'Digital Governance', 'Media Integrity', 'Policy'],
    title: {
      en: 'Geneva Plenary Adopts Cross-Border Media Provenance & Cryptographic Attribution Pact',
      az: 'Cenevrə plenar iclasında Media Mənşəyi və Kriptoqrafik Təsdiq Paktı qəbul edildi',
      ru: 'На пленарной сессии в Женеве принят пакт о криптографической верификации медиаконтента',
    },
    excerpt: {
      en: 'Forty-eight nations endorsed open C2PA hardware-signing standards for newsrooms and public broadcasters to safeguard photographic authenticity.',
      az: 'Qırx səkkiz ölkə fotojurnalistikanın orijinallığını qorumaq üçün xəbər agentliklərində açıq C2PA imza standartını təsdiqlədi.',
      ru: 'Сорок восемь стран поддержали открытый стандарт аппаратной подписи C2PA для защиты подлинности фотожурналистики.',
    },
    pullQuote: {
      en: '“Verified provenance lets readers distinguish authentic field reporting from synthetic fabrication in milliseconds.”',
      az: '“Təsdiqlənmiş mənşə oxuculara real reportajı sintetik saxtakarlıqdan millisaniyələr ərzində ayırmağa imkan verir.”',
      ru: '«Криптографическая верификация позволяет читателям за миллисекунды отличать подлинный репортаж от синтетической фальсификации».',
    },
    imageCaption: {
      en: 'Delegates voting on the final Digital Information Integrity resolution in Geneva.',
      az: 'Cenevrədə Rəqəmsal İnformasiya Bütövlüyü qətnaməsinə səs verən nümayəndələr.',
      ru: 'Делегаты голосуют по итоговой резолюции о достоверности цифровой информации в Женеве.',
    },
    bodyHtml: {
      en: `<p>Delegates gathered in Geneva overwhelmingly approved a multilateral media authenticity framework designed to preserve public trust in photojournalism and broadcast archives.</p>
<p>Under the pact, participating camera manufacturers and news agencies will embed tamper-evident cryptographic signatures directly at the image sensor stage, allowing readers and verification engines to inspect edit histories transparently.</p>
<p>Press freedom advocates welcomed the privacy safeguards written into the charter, ensuring metadata signatures verify sensor integrity without exposing anonymous field sources.</p>`,
      az: `<p>Cenevrədə toplanan nümayəndələr fotojurnalistikaya və yayım arxivlərinə ictimai etimadı qorumaq məqsədilə çoxtərəfli media orijinallığı çərçivəsini təsdiqlədilər.</p>
<p>Pakta əsasən, kamera istehsalçıları və xəbər agentlikləri kadrın çəkiliş anında sensor səviyyəsində kriptoqrafik imza əlavə edəcəklər.</p>`,
      ru: `<p>Делегаты в Женеве утвердили многостороннюю рамочную программу подлинности медиаданных для защиты доверия к фотожурналистике.</p>
<p>Согласно пакту, производители камер и информагентства будут внедрять криптографические подписи на уровне сенсора без раскрытия конфиденциальных источников.</p>`,
    },
    mediaAsset: {
      id: 'med-108',
      storageProvider: 'AWS S3',
      objectKey: 'media/2026/11/geneva-provenance-pact.webp',
      cdnUrl: '/src/assets/images/news_climate_summit_1795615688677.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-1'],
    publishedAt: hoursAgo(6),
    readTimeMinutes: 4,
    viewsToday: 1740,
    viewsWeek: 8910,
    likes: 151,
    dislikes: 12,
    isBreaking: true,
    isFeatured: false,
    editorialPriority: 1.15,
  },
  {
    id: 'art-109',
    slug: 'parliament-approves-venture-capital-tax-holiday-bill',
    category: 'politics',
    tags: ['Parliament', 'Tax Reform', 'Startups', 'Legislation'],
    title: {
      en: 'Parliament Passes Five-Year R&D Tax Exemption for Deep-Tech and Robotics Ventures',
      az: 'Parlament texnologiya və robototexnika startapları üçün beşillik vergi güzəşti qanununu qəbul etdi',
      ru: 'Парламент одобрил пятилетние налоговые льготы для стартапов в сфере робототехники и R&D',
    },
    excerpt: {
      en: 'New statutory incentives waive corporate profit and social payroll taxes for qualified engineering teams registering intellectual property domestically.',
      az: 'Yeni qanunvericilik ölkə daxilində əqli mülkiyyət qeydiyyatdan keçirən mühəndis komandalarını korporativ mənfəət vergisindən azad edir.',
      ru: 'Новые стимулы освобождают от налога на прибыль инженерные команды, регистрирующие интеллектуальную собственность внутри страны.',
    },
    pullQuote: {
      en: '“Predictable five-year fiscal certainty is the single strongest catalyst for hardware and AI engineering labs.”',
      az: '“Beşillik proqnozlaşdırılan vergi sabitliyi aparat və süni intellekt laboratoriyaları üçün ən güclü katalizatordur.”',
      ru: '«Предсказуемые пятилетние налоговые условия — лучший катализатор для инженерных лабораторий».',
    },
    imageCaption: {
      en: 'Plenary chamber overview following the third-reading legislative vote.',
      az: 'Qanun layihəsinin üçüncü oxunuşda qəbulundan sonra plenar zaldan görüntü.',
      ru: 'Зал пленарных заседаний после принятия законопроекта в третьем чтении.',
    },
    bodyHtml: {
      en: `<p>Lawmakers voted 104–12 on Tuesday to enact the Deep-Tech Innovation Charter, introducing a five-year corporate tax holiday for domestic research labs developing semiconductors, industrial automation, and clean-energy storage.</p>
<p>The Ministry of Economy estimates the measure will attract over $600 million in private venture co-investment over the next thirty-six months.</p>`,
      az: `<p>Deputatlar səs çoxluğu ilə yarımkeçiricilər, sənaye avtomatlaşdırılması və enerji saxlama texnologiyaları hazırlayan yerli laboratoriyalar üçün beşillik vergi azadolması tətbiq edən qanunu qəbul etdilər.</p>
<p>İqtisadiyyat Nazirliyi bu addımın növbəti üç ildə 600 milyon dollardan çox özəl vençur sərmayəsi cəlb edəcəyini proqnozlaşdırır.</p>`,
      ru: `<p>Депутаты большинством голосов утвердили хартию инноваций, вводящую пятилетние налоговые каникулы для лабораторий в сфере полупроводников и робототехники.</p>`,
    },
    mediaAsset: {
      id: 'med-109',
      storageProvider: 'Cloudflare R2',
      objectKey: 'media/2026/11/parliament-rd-bill.webp',
      cdnUrl: '/src/assets/images/news_climate_summit_1795615688677.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-3'],
    publishedAt: hoursAgo(8),
    readTimeMinutes: 3,
    viewsToday: 1420,
    viewsWeek: 6530,
    likes: 134,
    dislikes: 19,
    isBreaking: false,
    isFeatured: false,
    editorialPriority: 1.0,
  },
  {
    id: 'art-110',
    slug: 'caspian-maritime-logistics-digital-customs-portal',
    category: 'world',
    tags: ['Trade Corridor', 'Logistics', 'Customs', 'Baku'],
    title: {
      en: 'Middle Corridor Rail-Port Integration Slashes East–West Freight Transit to 11 Days',
      az: 'Orta Dəhlizdə dəmiryolu-liman inteqrasiyası Şərq–Qərb yük daşımalarını 11 günə endirdi',
      ru: 'Интеграция железных дорог и портов Среднего коридора сократила транзит грузов до 11 дней',
    },
    excerpt: {
      en: 'Single-window electronic bills of lading and automated gantry scheduling doubled container throughput across Caspian ferry terminals.',
      az: 'Vahid elektron konosament və avtomatlaşdırılmış kran planlaşdırması Xəzər bərə terminallarında konteyner dövriyyəsini ikiqat artırıb.',
      ru: 'Единые электронные накладные и автоматизация терминалов удвоили контейнерооборот на каспийских паромных переправах.',
    },
    pullQuote: {
      en: '“Eliminating paper customs handoffs at port gates saved more transit time than laying new track.”',
      az: '“Liman qapılarında kağız gömrük prosedurlarının ləğvi yeni rels çəkməkdən daha çox vaxt qazandırdı.”',
      ru: '«Отказ от бумажного таможенного оформления в портах сэкономил больше времени, чем прокладка новых путей».',
    },
    imageCaption: {
      en: 'Baku waterfront logistics and diplomatic hub supporting trans-regional trade corridors.',
      az: 'Transregional ticarət dəhlizlərini dəstəkləyən Bakı sahilyanı logistika və diplomatiya mərkəzi.',
      ru: 'Прибрежный логистический и дипломатический узел Баку на маршруте трансконтинентального коридора.',
    },
    bodyHtml: {
      en: `<p>Port authorities along the Middle Corridor confirmed record monthly container volume after unifying customs pre-clearance APIs across rail operators and Caspian roll-on/roll-off vessels.</p>
<p>Freight forwarders now track seal integrity and customs clearance status in real time from departure yards to Black Sea transshipment berths.</p>`,
      az: `<p>Orta Dəhliz boyunca liman rəhbərlikləri dəmiryolu operatorları və Xəzər bərələri arasında gömrük API-lərini birləşdirdikdən sonra rekord aylıq konteyner həcmini təsdiqlədilər.</p>`,
      ru: `<p>Портовые администрации Среднего коридора зафиксировали рекордный объем контейнерных перевозок после объединения таможенных API железных дорог и паромных линий.</p>`,
    },
    mediaAsset: {
      id: 'med-110',
      storageProvider: 'AWS S3',
      objectKey: 'media/2026/11/middle-corridor-logistics.webp',
      cdnUrl: '/src/assets/images/news_baku_summit_1795615683603.jpg',
      mimeType: 'image/jpeg',
      width: 1600,
      height: 900,
    },
    author: AUTHORS['auth-4'],
    publishedAt: hoursAgo(11),
    readTimeMinutes: 3,
    viewsToday: 1310,
    viewsWeek: 5890,
    likes: 112,
    dislikes: 5,
    isBreaking: false,
    isFeatured: false,
    editorialPriority: 1.0,
  },
  {
    id: 'art-111',
    slug: 'university-coding-fellowship-expands-regional-campuses',
    category: 'society',
    tags: ['Education', 'Engineering', 'Youth', 'Smart City'],
    title: {
      en: 'National Engineering Fellowship Opens 1,800 Tuition-Free Places Across Four Campuses',
      az: 'Milli Mühəndislik Proqramı dörd kampusda 1 800 ödənişsiz təqaüd yeri açır',
      ru: 'Национальная инженерная стипендия открывает 1 800 бесплатных мест в четырех кампусах',
    },
    excerpt: {
      en: 'Industry-backed curriculum pairs systems programming, distributed databases, and semiconductor verification with paid summer lab residencies.',
      az: 'Sənaye tərəfdaşlığı ilə hazırlanan proqram sistem proqramlaşdırması və paylanmış verilənlər bazalarını ödənişli laboratoriya təcrübəsi ilə birləşdirir.',
      ru: 'Программа объединяет системное программирование и распределенные базы данных с оплачиваемой практикой в лабораториях.',
    },
    pullQuote: {
      en: '“Direct mentorship from working systems architects closes the gap between university theory and production uptime.”',
      az: '“Fəaliyyətdə olan sistem memarlarından birbaşa mentorluq nəzəriyyə ilə real istehsalat arasındakı boşluğu aradan qaldırır.”',
      ru: '«Наставничество практикующих системных архитекторов стирает границу между теорией и реальным продакшеном».',
    },
    imageCaption: {
      en: 'Students commuting via the newly extended university boulevard transit corridor.',
      az: 'Yeni uzadılmış universitet bulvarı nəqliyyat dəhlizi ilə dərsə gedən tələbələr.',
      ru: 'Студенты пользуются новой трамвайной линией, соединяющей университетские кампусы.',
    },
    bodyHtml: {
      en: `<p>Higher education officials announced a major expansion of the tuition-free Systems Engineering Fellowship, adding 1,800 seats across regional technical campuses ahead of the spring admissions cycle.</p>
<p>Graduates from last year's inaugural cohort achieved a 96% placement rate within sixty days across telecom, banking, and cloud infrastructure teams.</p>`,
      az: `<p>Ali təhsil qurumları yaz qəbul dövrü ərəfəsində regional texniki kampuslarda Sistem Mühəndisliyi Təqaüd Proqramının 1 800 yerlik genişləndirilməsini elan etdilər.</p>`,
      ru: `<p>Министерство образования объявило о расширении бесплатной стипендиальной программы системной инженерии на 1 800 мест перед весенним набором.</p>`,
    },
    mediaAsset: {
      id: 'med-111',
      storageProvider: 'Cloudflare R2',
      objectKey: 'media/2026/11/engineering-fellowship.webp',
      cdnUrl: '/src/assets/images/news_urban_transit_1795615686731.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-6'],
    publishedAt: hoursAgo(14),
    readTimeMinutes: 3,
    viewsToday: 980,
    viewsWeek: 4920,
    likes: 176,
    dislikes: 3,
    isBreaking: false,
    isFeatured: false,
    editorialPriority: 0.98,
  },
  {
    id: 'art-112',
    slug: 'national-stadium-automated-pitch-heating-winter-cup',
    category: 'sports',
    tags: ['Football', 'Stadium Tech', 'Winter Cup', 'Matchday'],
    title: {
      en: 'Sub-Turf Geothermal Heating Guarantees Pristine Pitch Conditions for Winter Cup',
      az: 'Qazonaltı geotermal isitmə Qış Kuboku üçün ideal meydança şəraitini təmin edir',
      ru: 'Подземный геотермальный обогрев гарантирует идеальный газон для Зимнего кубка',
    },
    excerpt: {
      en: 'Closed-loop soil sensors regulate turf root temperatures within 0.5°C, cutting winter stadium electricity usage by half.',
      az: 'Qapalı dövrəli torpaq sensorları qazon kök temperaturunu 0,5°C dəqiqliklə tənzimləyərək enerji sərfinə yarıbayarı qənaət edir.',
      ru: 'Замкнутые датчики грунта поддерживают температуру корней с точностью 0,5°C, снижая затраты электроэнергии вдвое.',
    },
    pullQuote: {
      en: '“Consistent ball bounce in January frost requires precision agronomy backed by real-time telemetry.”',
      az: '“Yanvar şaxtasında topun sabit sıçrayışı real vaxt telemetriyası ilə dəstəklənən dəqiq aqronomiya tələb edir.”',
      ru: '«Стабильный отскок мяча в январские морозы требует точной агрономии и телеметрии в реальном времени».',
    },
    imageCaption: {
      en: 'Evening matchday pitch inspection under high-efficiency LED stadium floodlights.',
      az: 'Yüksək səmərəli LED stadion işıqları altında axşam oyunu öncəsi qazon baxışı.',
      ru: 'Вечерняя инспекция газона под энергоэффективными светодиодными прожекторами.',
    },
    bodyHtml: {
      en: `<p>Stadium operations engineers unveiled upgraded geothermal root-zone heating loops this week ahead of the Winter Cup knockout rounds, ensuring zero frost patches even during sub-zero kickoffs.</p>
<p>Wireless moisture probes embedded across 180 grid zones feed directly into the groundskeeping dashboard to optimize irrigation and aeration schedules.</p>`,
      az: `<p>Stadion mühəndisləri Qış Kubokunun pley-off mərhələsi öncəsi təkmilləşdirilmiş geotermal qazon isitmə sistemini təqdim ediblər.</p>`,
      ru: `<p>Инженеры стадиона представили обновленную систему геотермального подогрева поля перед матчами плей-офф Зимнего кубка.</p>`,
    },
    mediaAsset: {
      id: 'med-112',
      storageProvider: 'AWS S3',
      objectKey: 'media/2026/11/stadium-geothermal-turf.webp',
      cdnUrl: '/src/assets/images/news_football_stadium_1795615686115.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
    },
    author: AUTHORS['auth-5'],
    publishedAt: hoursAgo(26),
    readTimeMinutes: 3,
    viewsToday: 840,
    viewsWeek: 5340,
    likes: 94,
    dislikes: 4,
    isBreaking: false,
    isFeatured: false,
    editorialPriority: 0.95,
  },
];
