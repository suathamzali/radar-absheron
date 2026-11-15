// Story steps. Each step sets the map view and layers; text exists in English and Azerbaijani.
// Dates are indices of sme.json dates: 0-4 = 26 Nov 2025 ... 13 Jan 2026 (BETA);
// 5 = 18 Jun, 7 = 12 Jul, 8 = 24 Jul, 12 = 22 Sep, 13 = 4 Oct, 14 = 16 Oct 2026 (PROVISIONAL).
const SRC_NISAR = '<p class="source">Radar: NASA-ISRO NISAR L3 Soil Moisture (SME2) product — calibrated σ⁰ HH/HV at 200 m — PROVISIONAL, doi:10.5067/NIL3SME2-P1, track 56, frame 22, via <a href="https://search.asf.alaska.edu/#/?dataset=NISAR" target="_blank" rel="noopener">ASF DAAC</a>.</p>';
const SRC_SM = '<p class="source">Soil moisture: NISAR SME2 (PROVISIONAL, not yet validated; mission accuracy goal 0.06 m³/m³), doi:10.5067/NIL3SME2-P1.</p>';
const SRC_POWER = '<p class="source">Rain: NASA POWER daily (MERRA-2-based reanalysis, ~50 km grid), <a href="https://power.larc.nasa.gov/" target="_blank" rel="noopener">power.larc.nasa.gov</a>.</p>';
const SRC_MODIS = '<p class="source">Optical: NASA Terra/MODIS Corrected Reflectance (True Colour), 12 Jul 2026, via <a href="https://www.earthdata.nasa.gov/data/tools/gibs" target="_blank" rel="noopener">NASA GIBS</a>.</p>';

export const STEPS = [
  {
    id: 'clouds',
    view: { center: [40.0, 48.9], zoom: 8 },
    left: { kind: 'ctx', id: 'modis_truecolor_2026-07-12' },
    right: { kind: 'radar', date: 7, pol: 'composite' },
    swipe: 45,
    date: 7,
    en: {
      title: 'Radar sees through clouds',
      simple: `Ordinary satellites take photos with sunlight, so clouds hide the ground (left). NISAR sends its own radio waves, like a torch whose light passes through clouds, and saw the ground clearly the same morning (right). Drag the white handle to compare.`,
      body: `<p>On <strong>12 July 2026</strong> NASA's Terra satellite photographed this area in visible light: clouds covered large parts of the Kura-Araz lowland <em>(left)</em>.</p>
<p>The same morning, about five hours earlier (05:47 Baku time), the NASA-ISRO satellite <strong>NISAR</strong> imaged the ground with its own microwave pulses <em>(right)</em>. Its L-band waves are about 24 cm long: they pass through clouds and need no sunlight.</p>
<p>Drag the white handle (or focus it and use the arrow keys) to compare.</p>${SRC_MODIS}${SRC_NISAR}`,
    },
    az: {
      title: 'Radar buludların arxasını görür',
      simple: `Adi peyklər günəş işığı ilə şəkil çəkir, ona görə buludlar yeri gizlədir (solda). NISAR isə özü radio dalğası göndərir, işığı buluddan keçən fənər kimi, və həmin səhər yeri aydın gördü (sağda). Müqayisə üçün ağ tutacağı sürüşdürün.`,
      body: `<p><strong>12 iyul 2026</strong>-da NASA-nın Terra peyki bu ərazini görünən işıqda çəkdi: Kür-Araz ovalığının böyük hissələrini buludlar örtmüşdü <em>(solda)</em>.</p>
<p>Həmin səhər, təxminən beş saat əvvəl (Bakı vaxtı ilə 05:47), NASA-ISRO peyki <strong>NISAR</strong> yer səthini öz mikrodalğa impulsları ilə çəkdi <em>(sağda)</em>. Onun L-diapazon dalğaları təxminən 24 sm uzunluğundadır: buludlardan keçir və günəş işığına ehtiyac duymur.</p>
<p>Müqayisə üçün ağ tutacağı sürüşdürün (və ya ona fokuslanıb ox düymələrindən istifadə edin).</p>${SRC_MODIS}${SRC_NISAR}`,
    },
  },
  {
    id: 'legend',
    view: { center: [40.3, 49.2], zoom: 8 },
    left: { kind: 'radar', date: 7, pol: 'composite' },
    date: 7,
    actions: ['fly_baku', 'fly_forest', 'fly_caspian', 'fly_kura'],
    en: {
      title: 'How to read radar colours',
      simple: `The colours tell you what the radio wave bounced off. <strong>Pink-white</strong>: buildings and rough bare ground. <strong>Green</strong>: plants and trees. <strong>Dark</strong>: calm water or smooth soil. Press a button below to fly to an example.`,
      body: `<p>NISAR sends a horizontally polarized pulse and listens twice:</p>
<ul><li><span class="chip chip-hh">HH</span> the echo that comes back horizontal. Strong from buildings (the wave bounces off the ground and a wall straight back) and from rough bare ground.</li>
<li><span class="chip chip-hv">HV</span> the echo that comes back vertical. Strong where the wave bounces many times inside leaves, stems and branches: it tracks <strong>plant volume</strong>.</li></ul>
<p>In the colour image red and blue show HH, green shows HV. So <strong>magenta</strong> = city or rough bare ground, <strong>green</strong> = vegetation, <strong>dark</strong> = smooth water or smooth soil that reflects the wave away.</p>
<p>Every date uses the same fixed decibel scale, so a colour change between dates is a real change in the echo.</p>
<div class="callout limit"><p>Over dry plains HV is weak: on about two-thirds of the land it lies within 3 dB of NISAR's noise floor. Faint, even green there is mostly noise; only <strong>bright</strong> green means vegetation.</p></div>
<p>Visit four examples:</p>${SRC_NISAR}`,
    },
    az: {
      title: 'Radar rənglərini necə oxumalı',
      simple: `Rənglər radio dalğasının nədən əks olunduğunu göstərir. <strong>Çəhrayı-ağ</strong>: binalar və kobud çılpaq torpaq. <strong>Yaşıl</strong>: bitkilər və ağaclar. <strong>Tünd</strong>: sakit su və ya hamar torpaq. Nümunəyə uçmaq üçün aşağıdakı düymələrdən birini basın.`,
      body: `<p>NISAR üfüqi polyarizasiyalı impuls göndərir və iki dəfə dinləyir:</p>
<ul><li><span class="chip chip-hh">HH</span> üfüqi qayıdan əks-səda. Binalardan (dalğa yerdən və divardan birbaşa geri sıçrayır) və kobud çılpaq torpaqdan güclüdür.</li>
<li><span class="chip chip-hv">HV</span> şaquli qayıdan əks-səda. Dalğanın yarpaq, gövdə və budaqlar arasında dəfələrlə səpələndiyi yerdə güclüdür: <strong>bitki həcmini</strong> izləyir.</li></ul>
<p>Rəngli şəkildə qırmızı və göy HH-ı, yaşıl HV-ni göstərir. Yəni <strong>bənövşəyi</strong> = şəhər və ya kobud çılpaq torpaq, <strong>yaşıl</strong> = bitki örtüyü, <strong>tünd</strong> = dalğanı kənara əks etdirən hamar su və ya hamar torpaq.</p>
<p>Bütün tarixlər eyni sabit desibel şkalasından istifadə edir, ona görə tarixlər arasında rəng dəyişməsi əks-sədanın real dəyişməsidir.</p>
<div class="callout limit"><p>Quru düzənliklərdə HV zəifdir: qurunun təxminən üçdə ikisində NISAR-ın küy səviyyəsindən 3 dB-dən az yuxarıdır. Oradakı solğun, bərabər yaşıl əsasən küydür; yalnız <strong>parlaq</strong> yaşıl bitki örtüyü deməkdir.</p></div>
<p>Dörd nümunəyə baxın:</p>${SRC_NISAR}`,
    },
  },
  {
    id: 'dance',
    view: { center: [40.15, 48.95], zoom: 8 },
    left: { kind: 'radar', date: 5, pol: 'composite' },
    date: 5,
    autoplay: [5, 14],
    actions: ['play_again'],
    en: {
      title: 'Ten passes, one summer: the dance',
      simple: `These are four months of radar pictures, about one every 12 days, played like a short film. Watch three things: the sea flickers, the whole land flashes once in early October, and the city barely changes.`,
      body: `<p>NISAR passed over this area every 12 days (with one 24-day gap in August), at about <strong>05:47 Baku time</strong>. The time-lapse plays the passes from <strong>18 June</strong> to <strong>16 October 2026</strong> once. The October passes came before sunrise.</p>
<p>Watch who moves and who stands still:</p>
<ul><li><strong>The Caspian Sea</strong> flickers from date to date.</li>
<li><strong>The whole land</strong> flashes brighter on <strong>4 October</strong>.</li>
<li><strong>Baku and the mountains</strong> change least.</li></ul>
<p>The next steps explain each dancer.</p>${SRC_NISAR}`,
    },
    az: {
      title: 'On keçid, bir yay: rəqs',
      simple: `Bunlar dörd aylıq radar şəkilləridir, təxminən hər 12 gündən bir, qısa film kimi oynadılır. Üç şeyə baxın: dəniz titrəyir, oktyabrın əvvəlində bütün quru bir dəfə parlayır, şəhər isə demək olar ki, dəyişmir.`,
      body: `<p>NISAR bu ərazinin üzərindən hər 12 gündən bir (avqustda bir 24 günlük fasilə ilə), <strong>Bakı vaxtı ilə təxminən 05:47-də</strong> keçib. Animasiya <strong>18 iyun</strong>dan <strong>16 oktyabr 2026</strong>-yadək keçidləri bir dəfə oynadır. Oktyabr keçidləri gün doğmazdan əvvəl olub.</p>
<p>Kimin hərəkət etdiyinə, kimin yerində durduğuna baxın:</p>
<ul><li><strong>Xəzər dənizi</strong> tarixdən tarixə titrəyir.</li>
<li><strong>Bütün quru</strong> <strong>4 oktyabrda</strong> birdən parlaqlaşır.</li>
<li><strong>Bakı və dağlar</strong> ən az dəyişir.</li></ul>
<p>Növbəti addımlar hər "rəqqası" izah edir.</p>${SRC_NISAR}`,
    },
  },
  {
    id: 'rain',
    view: { center: [40.1, 48.9], zoom: 8 },
    left: { kind: 'sm', date: 12 },
    right: { kind: 'sm', date: 13 },
    swipe: 50,
    date: 13,
    inspect: 'kura_fields',
    en: {
      title: 'The radar felt the rain of 3 October',
      simple: `Wet soil reflects more radio waves than dry soil. On 3 October it rained; the next morning the satellite saw the land brighter, which means wetter. On the map, <strong>blue = wetter soil</strong>: compare the left (before) and right (after) sides.`,
      body: `<p>Water raises the soil's dielectric constant, so wet soil echoes more strongly. NISAR's soil-moisture product turns that into m³ of water per m³ of soil.</p>
<p>Left: <strong>22 September</strong>. Right: <strong>4 October</strong>. In between, NASA POWER shows a heavy rain on <strong>3 October</strong>: about <strong>18 mm</strong> around Baku and <strong>12 mm</strong> in the Kura-Araz lowland.</p>
<p>Across the land in this frame, the median HH echo rose from <strong>−13.5 to −11.3 dB</strong> and the median soil moisture from <strong>0.18 to 0.23 m³/m³</strong>. Twelve days later soil moisture was back at 0.18; HH fell back only partly (−12.7 dB).</p>
<div class="callout hyp"><p><strong>Check against a control.</strong> Part of the jump was scene-wide: central Baku (+1.0 dB), the oil fields (+1.1 dB) and the sea (+1.7 dB) brightened too, perhaps from the storm's wind or a pass-to-pass calibration difference. The land rose <strong>0.6–1.3 dB more than these controls</strong>, which points to wet soil; each control is a single ~1 km spot, so treat this as an estimate. An earlier rain (7–8 Sep, ~12 mm) left only a weak trace at the next pass (land +0.9 dB, city +0.7 dB).</p></div>
<div class="callout limit"><p>Soil-moisture values are PROVISIONAL (not yet validated against ground sensors). Pale, half-transparent pixels are retrievals the product does not recommend (dense vegetation, cities, water).</p></div>${SRC_SM}${SRC_POWER}`,
    },
    az: {
      title: 'Radar 3 oktyabr yağışını hiss etdi',
      simple: `Nəm torpaq quru torpaqdan daha çox radio dalğası əks etdirir. 3 oktyabrda yağış yağdı; ertəsi səhər peyk qurunu daha parlaq, yəni daha nəm gördü. Xəritədə <strong>göy = daha nəm torpaq</strong>: sol (əvvəl) və sağ (sonra) tərəfləri müqayisə edin.`,
      body: `<p>Su torpağın dielektrik sabitini artırır, ona görə nəm torpaq daha güclü əks-səda verir. NISAR-ın torpaq nəmliyi məhsulu bunu torpağın hər m³-də neçə m³ su olduğuna çevirir.</p>
<p>Solda: <strong>22 sentyabr</strong>. Sağda: <strong>4 oktyabr</strong>. Arada NASA POWER <strong>3 oktyabrda</strong> güclü yağış göstərir: Bakı ətrafında təxminən <strong>18 mm</strong>, Kür-Araz ovalığında <strong>12 mm</strong>.</p>
<p>Bu kadrdakı qurunun median HH əks-sədası <strong>−13,5-dən −11,3 dB-yə</strong>, median torpaq nəmliyi isə <strong>0,18-dən 0,23 m³/m³-ə</strong> qalxdı. On iki gün sonra torpaq nəmliyi yenidən 0,18 idi; HH isə yalnız qismən geri düşdü (−12,7 dB).</p>
<div class="callout hyp"><p><strong>Nəzarət ilə yoxlama.</strong> Sıçrayışın bir hissəsi bütün kadr üzrə idi: Bakı mərkəzi (+1,0 dB), neft yataqları (+1,1 dB) və dəniz (+1,7 dB) də parlaqlaşdı; bəlkə fırtına küləyindən, bəlkə də keçidlər arası kalibrləmə fərqindən. Quru bu nəzarətlərdən <strong>0,6–1,3 dB çox</strong> qalxdı, bu da nəm torpağa işarədir; hər nəzarət təxminən 1 km-lik tək nöqtədir, ona görə bunu təxmin kimi qəbul edin. Daha əvvəlki yağış (7–8 sentyabr, ~12 mm) növbəti keçiddə yalnız zəif iz buraxdı (quru +0,9 dB, şəhər +0,7 dB).</p></div>
<div class="callout limit"><p>Torpaq nəmliyi dəyərləri İLKİNDİR (hələ yer sensorları ilə təsdiqlənməyib). Solğun, yarımşəffaf piksellər məhsulun tövsiyə etmədiyi ölçmələrdir (sıx bitki, şəhər, su).</p></div>${SRC_SM}${SRC_POWER}`,
    },
  },
  {
    id: 'kura',
    view: { center: [39.97, 48.45], zoom: 10 },
    left: { kind: 'radar', date: 5, pol: 'hv' },
    right: { kind: 'radar', date: 14, pol: 'hv' },
    swipe: 50,
    date: 5,
    inspect: 'kura_fields',
    actions: ['irrigation_map', 'ndvi_compare'],
    en: {
      title: 'Kura-Araz lowland: a quiet dancer',
      simple: `We expected the farm fields to change a lot as crops grew and were harvested. At this map's level of detail they changed very little, because many small fields are blended into each dot. The irrigated land is always wetter than the dry steppe, but almost as much in winter, so the radar cannot yet tell irrigation water apart from soil and groundwater.`,
      body: `<p>Between the Kura and Araz rivers lies Azerbaijan's largest irrigated farmland, in a semi-arid climate where crops depend on canals. The swipe shows only <span class="chip chip-hv">HV</span>, the plant-volume echo: <strong>18 June</strong> left, <strong>16 October</strong> right.</p>
<p>A surprise: at this scale the farmland barely moved. Across the lowland, HV rose by a median of only <strong>0.6 dB</strong> from June to October, and fewer than 3 % of 1 km cells changed by more than 1.5 dB. The biggest jump between two passes came from the <strong>3 October rain</strong>, not from the crops (see the chart).</p>
<div class="callout hyp"><p><strong>Why, and what next (hypothesis).</strong> Each 200 m pixel averages several fields: one field growing and its neighbour being harvested cancel out. A second reason: over these dry plains HV is often within 3 dB of the noise floor, and the noise floor itself (measured over the sea) rose by about 1.2 dB from June to October, as much as the change we are looking for. Following single fields needs NISAR's 10–20 m GCOV product, plus 2026 field records to check it.</p></div>
<div class="callout"><p><strong>Human driver: irrigation, tested.</strong> MODIS shows about <strong>6,600 km²</strong> of this lowland still green in July–August (NDVI ≥ 0.45): in a semi-arid summer that is irrigated farmland. Its soil was wetter than the dry steppe on <strong>all 15 dates</strong>: by a median of <strong>+0.07 m³/m³</strong> in summer and +0.085 in autumn.</p><p><strong>But</strong> the gap was almost as large in winter (+0.06), when nobody irrigates. So most of it may come from soils and groundwater along the rivers, not from irrigation water itself; the extra summer share (about 0.01–0.03) is below the product's accuracy. NISAR clearly shows the human footprint (greener, wetter farmland), but at this resolution it cannot yet separate the irrigation water.</p></div>
<figure class="step-fig"><img src="assets/img/irrigation.svg?v=20261115l" alt="Line chart: median soil moisture of irrigated land is above dry steppe on every date, in summer and also in winter." width="440" height="220"><figcaption>Median NISAR soil moisture (recommended retrievals only) in irrigated land vs dry steppe, Kura-Araz and Shirvan plains.</figcaption></figure>
<p class="source">Irrigation mask: NASA MODIS Terra NDVI 8-day (12 Jul and 13 Aug 2026, GIBS colormap converted to values); thresholds tested at 0.40/0.30 and 0.50/0.20 with the same pattern. Script: tools/irrigation_test.py.</p>
<p>See the irrigated areas on the map, or compare vegetation seen by MODIS (NDVI), July vs October:</p>${SRC_NISAR}${SRC_POWER}`,
    },
    az: {
      title: 'Kür-Araz ovalığı: sakit rəqqas',
      simple: `Bitkilər böyüdükcə və məhsul yığıldıqca əkin sahələrinin çox dəyişəcəyini gözləyirdik. Bu xəritənin dəqiqliyində onlar çox az dəyişdi, çünki hər nöqtədə bir neçə kiçik sahə qarışır. Suvarılan torpaq həmişə quru çöldən nəmdir, amma qışda da təxminən o qədər, ona görə radar suvarma suyunu torpaq və qrunt suyundan hələ ayıra bilmir.`,
      body: `<p>Kür və Araz çayları arasında Azərbaycanın ən böyük suvarılan əkin sahələri yerləşir; iqlim yarımquraqdır və əkinlər kanallardan asılıdır. Sürüşdürmə yalnız <span class="chip chip-hv">HV</span>, yəni bitki həcmi əks-sədasını göstərir: solda <strong>18 iyun</strong>, sağda <strong>16 oktyabr</strong>.</p>
<p>Gözlənilməz nəticə: bu miqyasda əkin sahələri demək olar ki, dəyişmədi. Ovalıq boyu HV iyundan oktyabradək median cəmi <strong>0,6 dB</strong> artdı və 1 km-lik xanaların 3 %-dən azı 1,5 dB-dən çox dəyişdi. İki keçid arasında ən böyük sıçrayışı əkinlər yox, <strong>3 oktyabr yağışı</strong> yaratdı (qrafikə baxın).</p>
<div class="callout hyp"><p><strong>Niyə və sonra nə (fərziyyə).</strong> Hər 200 m-lik piksel bir neçə sahəni ortalayır: bir sahənin böyüməsi ilə qonşu sahədə məhsul yığımı bir-birini sıfırlayır. İkinci səbəb: bu quru düzənliklərdə HV çox vaxt küy səviyyəsindən 3 dB-dən az yuxarıdır, küy səviyyəsinin özü isə (dənizdə ölçülüb) iyundan oktyabradək təxminən 1,2 dB qalxıb, yəni axtardığımız dəyişiklik qədər. Ayrı sahələri izləmək üçün NISAR-ın 10–20 m-lik GCOV məhsulu və yoxlama üçün 2026-cı il sahə qeydləri lazımdır.</p></div>
<div class="callout"><p><strong>İnsan amili: suvarma, yoxlanıldı.</strong> MODIS bu ovalıqda iyul–avqustda hələ də yaşıl qalan təxminən <strong>6 600 km²</strong> torpaq göstərir (NDVI ≥ 0,45): yarımquraq yayda bu, suvarılan əkin sahəsidir. Onun torpağı <strong>15 tarixin hamısında</strong> quru çöldən nəm idi: yayda median <strong>+0,07 m³/m³</strong>, payızda +0,085.</p><p><strong>Amma</strong> heç kimin suvarmadığı qışda da fərq demək olar ki, eyni idi (+0,06). Deməli, fərqin çoxu suvarma suyundan yox, çay boyu torpaqlardan və qrunt sularından gələ bilər; yayın əlavə payı (təxminən 0,01–0,03) məhsulun dəqiqliyindən aşağıdır. NISAR insan izini aydın göstərir (daha yaşıl, daha nəm əkin sahələri), amma bu dəqiqlikdə suvarma suyunu hələ ayıra bilmir.</p></div>
<figure class="step-fig"><img src="assets/img/irrigation.svg?v=20261115l" alt="Xətti qrafik: suvarılan torpağın median nəmliyi hər tarixdə quru çöldən yüksəkdir, yayda da, qışda da." width="440" height="220"><figcaption>Kür-Araz və Şirvan düzənliklərində suvarılan torpaq və quru çölün median NISAR torpaq nəmliyi (yalnız tövsiyə olunan ölçmələr).</figcaption></figure>
<p class="source">Suvarma maskası: NASA MODIS Terra NDVI 8 günlük (12 iyul və 13 avqust 2026, GIBS rəng cədvəli dəyərə çevrilib); hədlər 0,40/0,30 və 0,50/0,20 ilə də yoxlanıb, nəticə eynidir. Skript: tools/irrigation_test.py.</p>
<p>Suvarılan sahələri xəritədə görün və ya MODIS-in gördüyü bitki örtüyü (NDVI) ilə müqayisə edin, iyul və oktyabr:</p>${SRC_NISAR}${SRC_POWER}`,
    },
  },
  {
    id: 'absheron',
    view: { center: [40.43, 49.9], zoom: 10 },
    left: { kind: 'radar', date: 14, pol: 'composite' },
    date: 14,
    inspect: 'oilfield',
    actions: ['fly_baku', 'fly_oil'],
    en: {
      title: 'Absheron: a city that stands still',
      simple: `Baku looks bright and steady because walls and streets bounce the radio wave straight back. Because the city stays the same, NISAR can be used over years to check whether the ground is slowly sinking, for example around the old oil fields.`,
      body: `<p>Baku glows white-pink on every date. Walls and streets act as corner reflectors that send the wave straight back.</p>
<p>North of the city, the <strong>Balakhani–Sabunchu oil fields</strong> have been worked for more than a century: a patchwork of pads, pipes, roads and oily lakes. Human structures dominate the echo, so it changes far less here than in farmland.</p>
<div class="callout"><p><strong>Why it matters.</strong> A stable echo is exactly what radar interferometry (InSAR) needs to measure ground motion of millimetres to centimetres. NISAR's interferogram products can, over years, watch for ground sinking around oil fields and the city.</p></div>
<div class="callout limit"><p>We did not measure ground motion in this project; that needs a multi-year NISAR interferogram time series.</p></div>${SRC_NISAR}`,
    },
    az: {
      title: 'Abşeron: yerində duran şəhər',
      simple: `Bakı parlaq və sabit görünür, çünki divarlar və küçələr radio dalğasını birbaşa geri qaytarır. Şəhər dəyişmədiyi üçün NISAR ilə illər ərzində yerin yavaş-yavaş çöküb-çökmədiyini, məsələn köhnə neft yataqları ətrafında, yoxlamaq olar.`,
      body: `<p>Bakı hər tarixdə ağ-çəhrayı parlayır. Divarlar və küçələr dalğanı birbaşa geri göndərən künc əks etdiriciləri kimi işləyir.</p>
<p>Şəhərin şimalında <strong>Balaxanı–Sabunçu neft yataqları</strong> yüz ildən artıqdır istismar olunur: meydançalar, borular, yollar və neftli göllərdən ibarət mozaika. Əks-sədanı insan tikililəri müəyyən edir, ona görə o, əkin sahələrindən xeyli az dəyişir.</p>
<div class="callout"><p><strong>Niyə vacibdir.</strong> Sabit əks-səda radar interferometriyasının (InSAR) millimetrdən santimetrədək yer hərəkətini ölçməsi üçün məhz lazım olandır. NISAR-ın interferoqram məhsulları illər ərzində neft yataqları və şəhər ətrafında yerin çökməsini izləyə bilər.</p></div>
<div class="callout limit"><p>Bu layihədə yer hərəkətini ölçməmişik; bunun üçün çoxillik NISAR interferoqram zaman sırası lazımdır.</p></div>${SRC_NISAR}`,
    },
  },
  {
    id: 'caspian',
    view: { center: [40.15, 50.0], zoom: 8.5 },
    left: { kind: 'radar', date: 5, pol: 'composite' },
    date: 5,
    autoplay: [5, 14],
    inspect: 'caspian',
    actions: ['play_again'],
    en: {
      title: 'The Caspian dances with the wind',
      simple: `Calm water is like a mirror: the wave bounces away and the sea looks dark. Wind makes small ripples that send part of the wave back, so the sea looks brighter. So the sea's brightness tells us about the wind, not about the water depth.`,
      body: `<p>Calm water is a mirror: it reflects the radar wave away and looks dark. Wind raises ripples a few centimetres long, which send part of the wave back, so the sea brightens.</p>
<p>That is why the Caspian's HH echo changes from pass to pass (median between <strong>−16.8 and −15.1 dB</strong>): NISAR records the <strong>wind on the sea surface</strong> at 05:47, not the depth or the water level.</p>
<div class="callout"><p><strong>We tested it.</strong> On windier mornings the sea was brighter: across all 15 passes, sea HH and the wind at the pass time (NASA POWER, hourly) go together with r = 0.63 (permutation p ≈ 0.01). The link holds when we remove the noise-floor drift (r = 0.67) and without the stormy 4 October (r = 0.56, p ≈ 0.04). The effect is modest: about +0.12 dB per m/s, roughly 1 dB between calm and 10 m/s.</p></div>
<figure class="step-fig"><img src="assets/img/wind-vs-sea.svg?v=20261115l" alt="Scatter plot of sea radar brightness against wind speed for 15 dates: brighter on windier mornings." width="440" height="230"><figcaption>Each dot is one NISAR pass. Filled: provisional (summer–autumn 2026); hollow: beta (winter). Dashed line: linear fit.</figcaption></figure>
<p class="source">Wind: NASA POWER hourly WS10M (MERRA-2/GEOS-IT model, ~50 km grid) at 40.15° N, 50.30° E, interpolated to 01:47 UTC. A modelled wind at one point is compared with the median of the whole sea area, and wind direction is not used, so this is a first check, not a calibration.</p>
<div class="callout limit"><p>Over the sea, HV (about −20 dB) sits on NISAR's own noise floor (also about −20 dB), so the green stripes there are instrument noise along the swath, not sea features. The slow fall of the Caspian Sea level cannot be seen in one season; a multi-year NISAR shoreline record could show it.</p></div>${SRC_NISAR}`,
    },
    az: {
      title: 'Xəzər küləklə rəqs edir',
      simple: `Sakit su güzgü kimidir: dalğa kənara əks olunur və dəniz tünd görünür. Külək kiçik ləpələr yaradır, onlar dalğanın bir hissəsini geri qaytarır və dəniz parlaq görünür. Yəni dənizin parlaqlığı suyun dərinliyindən yox, küləkdən xəbər verir.`,
      body: `<p>Sakit su güzgü kimidir: radar dalğasını kənara əks etdirir və tünd görünür. Külək bir neçə santimetrlik ləpələr yaradır, onlar dalğanın bir hissəsini geri qaytarır və dəniz parlaqlaşır.</p>
<p>Ona görə Xəzərin HH əks-sədası keçiddən keçidə dəyişir (median <strong>−16,8 ilə −15,1 dB</strong> arası): NISAR dərinliyi və ya su səviyyəsini yox, saat 05:47-də <strong>dəniz səthindəki küləyi</strong> qeydə alır.</p>
<div class="callout"><p><strong>Biz bunu yoxladıq.</strong> Küləkli səhərlərdə dəniz daha parlaq idi: 15 keçidin hamısında dənizin HH əks-sədası ilə keçid anındakı külək (NASA POWER, saatlıq) birlikdə dəyişir, r = 0,63 (permutasiya p ≈ 0,01). Küy səviyyəsinin dəyişməsini çıxanda (r = 0,67) və fırtınalı 4 oktyabr olmadan da (r = 0,56, p ≈ 0,04) əlaqə qalır. Təsir orta güclüdür: hər m/s üçün təxminən +0,12 dB, sakit hava ilə 10 m/s arasında təxminən 1 dB.</p></div>
<figure class="step-fig"><img src="assets/img/wind-vs-sea.svg?v=20261115l" alt="15 tarix üçün dəniz radar parlaqlığının külək sürətinə qarşı nöqtə qrafiki: küləkli səhərlərdə daha parlaq." width="440" height="230"><figcaption>Hər nöqtə bir NISAR keçididir. Dolu: ilkin (yay–payız 2026); boş: beta (qış). Qırıq xətt: xətti uyğunlaşma.</figcaption></figure>
<p class="source">Külək: NASA POWER saatlıq WS10M (MERRA-2/GEOS-IT modeli, ~50 km şəbəkə), 40,15° şm. e., 50,30° ş. u., 01:47 UTC-yə interpolyasiya. Bir nöqtədəki model küləyi bütün dəniz sahəsinin medianı ilə müqayisə olunur və küləyin istiqaməti nəzərə alınmır, ona görə bu, kalibrləmə yox, ilk yoxlamadır.</p>
<div class="callout limit"><p>Dənizdə HV (təxminən −20 dB) NISAR-ın öz küy səviyyəsindədir (o da təxminən −20 dB), ona görə oradakı yaşıl zolaqlar dəniz obyekti yox, cihaz küyüdür. Xəzər səviyyəsinin yavaş enməsini bir mövsümdə görmək olmur; sahil xəttinin çoxillik NISAR qeydi bunu göstərə bilər.</p></div>${SRC_NISAR}`,
    },
  },
  {
    id: 'change',
    view: { center: [40.15, 48.95], zoom: 8 },
    left: { kind: 'change', from: 12, to: 13, pol: 0 },
    date: 13,
    actions: ['change_season', 'go_explore'],
    en: {
      title: 'Find the change yourself',
      simple: `This map shows only what changed between two days. <strong>Teal</strong>: became brighter (here: wetter after the rain). <strong>Brown</strong>: became darker. <strong>Empty</strong>: almost no change. Tap any spot to see its whole history.`,
      body: `<p>This <strong>change map</strong> subtracts HH on <strong>22 September</strong> from HH on <strong>4 October</strong>, in decibels, over land. Teal: the echo grew. Brown: it fell. Clear: less than 1.5 dB of change.</p>
<p>The rain of 3 October painted the land: <strong>69 %</strong> of land cells brightened by more than 1.5 dB (median +1.9 dB), about 1 dB of it scene-wide (see step 4). Twelve days later 35 % had faded back by more than 1.5 dB.</p>
<p>Click any patch (or focus the map and press <kbd>I</kbd>) to read its full history. Then compare a whole season, 18 June → 16 October in HV:</p>
<div class="callout limit"><p>A change map shows <em>where</em> and <em>how much</em> the echo changed, not <em>why</em>. Each pixel is about 1 km; water is hidden because wind, not the land, changes it.</p></div>${SRC_NISAR}`,
    },
    az: {
      title: 'Dəyişikliyi özünüz tapın',
      simple: `Bu xəritə yalnız iki gün arasında nəyin dəyişdiyini göstərir. <strong>Firuzəyi</strong>: parlaqlaşıb (burada: yağışdan sonra nəmlənib). <strong>Qəhvəyi</strong>: tündləşib. <strong>Boş</strong>: demək olar ki, dəyişməyib. Tam tarixçəni görmək üçün istənilən yerə toxunun.`,
      body: `<p>Bu <strong>dəyişiklik xəritəsi</strong> quruda <strong>4 oktyabr</strong> HH-dan <strong>22 sentyabr</strong> HH-ı desibellə çıxır. Firuzəyi: əks-səda artıb. Qəhvəyi: azalıb. Şəffaf: 1,5 dB-dən az dəyişib.</p>
<p>3 oktyabr yağışı qurunu "rəngləyib": quru xanalarının <strong>69 %</strong>-i 1,5 dB-dən çox parlaqlaşıb (median +1,9 dB), bunun təxminən 1 dB-i bütün kadr üzrədir (4-cü addıma baxın). On iki gün sonra 35 %-i yenidən 1,5 dB-dən çox zəifləyib.</p>
<p>Tam tarixçəni oxumaq üçün istənilən sahəyə klikləyin (və ya xəritəyə fokuslanıb <kbd>I</kbd> basın). Sonra bütöv mövsümü müqayisə edin, HV-də 18 iyun → 16 oktyabr:</p>
<div class="callout limit"><p>Dəyişiklik xəritəsi əks-sədanın <em>harada</em> və <em>nə qədər</em> dəyişdiyini göstərir, <em>niyə</em> dəyişdiyini yox. Hər piksel təxminən 1 km-dir; su gizlədilib, çünki onu quru yox, külək dəyişir.</p></div>${SRC_NISAR}`,
    },
  },
  {
    id: 'summary',
    view: { center: [40.15, 48.95], zoom: 8 },
    left: { kind: 'radar', date: 14, pol: 'composite' },
    date: 14,
    actions: ['go_explore', 'go_data'],
    en: {
      title: 'What we saw, and why it matters',
      simple: `A free satellite can watch Azerbaijan's land about every 12 days, day and night, through clouds. It already saw the land get wet after a rain and showed that the sea follows the wind. With a few more years of data it could help farmers, water managers and city planners.`,
      body: `<div class="summary-card"><h3>What you saw</h3><ul>
<li>NISAR imaged Azerbaijan through clouds and before sunrise, about every 12 days.</li>
<li>Its two echoes separate cities (HH) from plants (HV).</li>
<li>At the next pass after the 3 October rain the land rose 0.6–1.3 dB more than stable controls (city, oil fields, sea); the Caspian brightens on windier mornings (tested against NASA POWER wind: r = 0.63); over the summer Baku changed least; at 200 m–1 km the farmland changed far less than we expected.</li></ul></div>
<div class="summary-card"><h3>Why it matters</h3>
<p>Farming and water use in the Kura-Araz lowland matter for food and for the shrinking Kura river and Caspian. Free, calibrated radar every 12 days, in any weather, lets farmers, water managers and students follow their own fields and canals.</p></div>
<div class="summary-card"><h3>What NISAR could do next here</h3><ul>
<li>Crop maps and harvest dates for every field, every season.</li>
<li>Flood maps of the Kura floodplain through clouds.</li>
<li>Millimetre-scale ground motion around Baku's oil fields from years of interferometry.</li></ul></div>
<div class="summary-card"><h3>Who uses it, and how it grows</h3>
<ul><li><strong>Farmers and agronomists:</strong> see after rain or irrigation how wet their area is, for free, even under clouds.</li>
<li><strong>Water and irrigation managers:</strong> check every 12 days where water reached the land.</li>
<li><strong>Insurers and agricultural lenders:</strong> independent evidence of rain, floods and field activity.</li>
<li><strong>Cities and planners:</strong> a stable radar record for future ground-motion checks.</li>
<li><strong>Schools and universities:</strong> radar explained in Azerbaijani, with real local data.</li></ul>
<p><strong>Cost:</strong> the data are free (NASA open data); the site is a static page with free hosting; preparing one radar frame for a season takes about 1 GB of download and one laptop.</p>
<p><strong>Scale (plan):</strong> the same scripts work for any NISAR frame. Next: (1) refresh automatically after each 12-day pass; (2) cover all of Azerbaijan, then irrigated river basins in the South Caucasus and Central Asia; (3) field-level maps from the 10–20 m GCOV product, and a pilot with a farming cooperative or university. The tool stays free and open; tailored reports for agencies and insurers could fund it.</p></div>
<p class="source">Data: NASA-ISRO NISAR (ASF DAAC), NASA Terra/MODIS (GIBS), NASA POWER. Full credits in "Data &amp; method".</p>`,
    },
    az: {
      title: 'Nə gördük və niyə vacibdir',
      simple: `Pulsuz peyk Azərbaycan torpağını təxminən hər 12 gündən bir, gecə-gündüz, buludların arxasından izləyə bilir. O, artıq yağışdan sonra torpağın nəmləndiyini gördü və dənizin küləyə tabe olduğunu göstərdi. Bir neçə il daha məlumatla fermerlərə, su idarəçilərinə və şəhər planlaşdırıcılarına kömək edə bilər.`,
      body: `<div class="summary-card"><h3>Nə gördünüz</h3><ul>
<li>NISAR Azərbaycanı buludların arxasından və gün doğmazdan əvvəl, təxminən hər 12 gündən bir çəkib.</li>
<li>Onun iki əks-sədası şəhərləri (HH) bitkilərdən (HV) ayırır.</li>
<li>3 oktyabr yağışından sonrakı keçiddə quru sabit nəzarətlərdən (şəhər, neft yataqları, dəniz) 0,6–1,3 dB çox qalxdı; Xəzər küləkli səhərlərdə parlaqlaşır (NASA POWER küləyi ilə yoxlanıb: r = 0,63); yay ərzində Bakı ən az dəyişdi; 200 m–1 km miqyasında əkin sahələri gözlədiyimizdən xeyli az dəyişdi.</li></ul></div>
<div class="summary-card"><h3>Niyə vacibdir</h3>
<p>Kür-Araz ovalığında əkinçilik və su istifadəsi həm ərzaq, həm də dayazlaşan Kür çayı və Xəzər üçün önəmlidir. Hər 12 gündən bir, istənilən havada pulsuz, kalibrlənmiş radar fermerlərə, su idarəçilərinə və tələbələrə öz sahələrini və kanallarını izləməyə imkan verir.</p></div>
<div class="summary-card"><h3>NISAR burada daha nə edə bilər</h3><ul>
<li>Hər mövsüm, hər sahə üçün əkin xəritələri və məhsul yığımı tarixləri.</li>
<li>Kür daşqın düzənliyinin buludların arxasından daşqın xəritələri.</li>
<li>İllərlə interferometriya ilə Bakı neft yataqları ətrafında millimetr miqyaslı yer hərəkəti.</li></ul></div>
<div class="summary-card"><h3>Kim istifadə edir və necə böyüyür</h3>
<ul><li><strong>Fermerlər və aqronomlar:</strong> yağışdan və ya suvarmadan sonra ərazilərinin nə qədər nəm olduğunu pulsuz, hətta bulud altında da görürlər.</li>
<li><strong>Su və suvarma idarəçiləri:</strong> hər 12 gündən bir suyun torpağa harada çatdığını yoxlayırlar.</li>
<li><strong>Sığorta və kənd təsərrüfatı kreditorları:</strong> yağış, daşqın və sahə fəaliyyəti barədə müstəqil sübut.</li>
<li><strong>Şəhərlər və planlaşdırıcılar:</strong> gələcək yer hərəkəti yoxlamaları üçün sabit radar qeydi.</li>
<li><strong>Məktəb və universitetlər:</strong> real yerli məlumatla, Azərbaycan dilində izah olunan radar.</li></ul>
<p><strong>Xərc:</strong> məlumat pulsuzdur (NASA-nın açıq məlumat siyasəti); sayt pulsuz hostinqdə sadə statik səhifədir; bir radar kadrını bir mövsüm üçün hazırlamaq təxminən 1 GB yükləmə və bir noutbuk tələb edir.</p>
<p><strong>Miqyas (plan):</strong> eyni skriptlər istənilən NISAR kadrı üçün işləyir. Sonrakı addımlar: (1) hər 12 günlük keçiddən sonra avtomatik yeniləmə; (2) bütün Azərbaycan, sonra Cənubi Qafqaz və Mərkəzi Asiyanın suvarılan çay hövzələri; (3) 10–20 m-lik GCOV məhsulu ilə sahə səviyyəsində xəritələr və bir fermer kooperativi və ya universitetlə pilot layihə. Alət pulsuz və açıq qalır; qurumlar və sığortaçılar üçün xüsusi hesabatlar onu maliyyələşdirə bilər.</p></div>
<p class="source">Məlumat: NASA-ISRO NISAR (ASF DAAC), NASA Terra/MODIS (GIBS), NASA POWER. Tam istinadlar "Məlumat və metod" bölməsindədir.</p>`,
    },
  },
];

export const ACTIONS = {
  fly_baku: { en: 'Baku', az: 'Bakı', place: 'baku', zoom: 11 },
  fly_oil: { en: 'Oil fields', az: 'Neft yataqları', place: 'oilfield', zoom: 11 },
  fly_forest: { en: 'Caucasus forest', az: 'Qafqaz meşəsi', place: 'forest', zoom: 10 },
  fly_caspian: { en: 'Caspian Sea', az: 'Xəzər dənizi', place: 'caspian', zoom: 9 },
  fly_kura: { en: 'Kura fields', az: 'Kür sahələri', place: 'kura_fields', zoom: 10 },
  play_again: { en: 'Play again', az: 'Yenidən oynat' },
  irrigation_map: { en: 'Irrigated areas vs soil moisture', az: 'Suvarılan sahələr və torpaq nəmliyi' },
  ndvi_compare: { en: 'NDVI: July vs October', az: 'NDVI: iyul və oktyabr' },
  change_season: { en: 'Season: HV, Jun → Oct', az: 'Mövsüm: HV, iyun → oktyabr' },
  go_explore: { en: 'Explore on your own', az: 'Özünüz kəşf edin' },
  go_data: { en: 'Data & method', az: 'Məlumat və metod' },
};
