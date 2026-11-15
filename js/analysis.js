// Rule-based reading of one point's NISAR numbers: surface type, analysis, recommendations.
// Thresholds are simple and stated in the text; results are indications, not ground truth.
const P0 = 5, P1 = 14, RAIN_B = 12, RAIN_A = 13; // provisional range; 22 Sep and 4 Oct 2026

const med = (a) => { const v = a.filter((x) => x !== null && Number.isFinite(x)).sort((p, q) => p - q); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
const f1 = (v) => (v === null ? '–' : v.toFixed(1));
const f2 = (v) => (v === null ? '–' : v.toFixed(2));

const T = {
  en: {
    title: 'What these numbers say',
    type: 'What this place probably is',
    types: {
      water: 'Water (sea or lake)',
      city: 'Built-up: city, industry or oil fields',
      dense: 'Dense vegetation: trees or tall crops',
      farm: 'Mixed land with some vegetation: farmland, shrubs or mixed surfaces',
      bare: 'Bare or sparse land: dry steppe or semi-desert',
    },
    why: {
      water: 'The plant echo (HV) is as weak as the instrument\'s background noise, as over calm water.',
      city: (hh) => `Very strong HH (median ${hh} dB): walls and streets send the wave straight back.`,
      dense: (hv) => `A strong plant echo (HV, median ${hv} dB): leaves and branches bounce the wave around.`,
      farm: (hv) => `A medium plant echo (HV, median ${hv} dB): there are some plants.`,
      bare: (hv) => `A weak plant echo (HV, median ${hv} dB): few plants; close to the instrument\'s noise floor.`,
    },
    analysis: 'Analysis',
    smWet: (p, a) => `Soil moisture here (median ${p} m³/m³, Jun–Oct) is <strong>wetter</strong> than the lowland average (${a}).`,
    smDry: (p, a) => `Soil moisture here (median ${p} m³/m³, Jun–Oct) is <strong>drier</strong> than the lowland average (${a}).`,
    smSame: (p, a) => `Soil moisture here (median ${p} m³/m³, Jun–Oct) is close to the lowland average (${a}).`,
    smNone: 'No soil-moisture retrieval here (the product skips water, cities and very dense vegetation).',
    rainStrong: (d) => `It reacted <strong>strongly</strong> to the 3 October rain (soil moisture +${d}).`,
    rainWeak: (d) => `It reacted only weakly to the 3 October rain (soil moisture ${d >= 0 ? '+' : ''}${d}).`,
    trendUp: (d) => `The plant echo (HV) rose by ${d} dB from June to October.`,
    trendDown: (d) => `The plant echo (HV) fell by ${d} dB from June to October (harvest, drying or ploughing are possible causes).`,
    trendFlat: 'The plant echo (HV) stayed about the same from June to October.',
    recs: 'What you can do with this',
    rec: {
      water: ['Use this point to follow wind and sea state: on windier mornings the sea looks brighter.', 'Do not use it for soil moisture or plants.'],
      city: ['A stable radar target: a good place to measure slow ground sinking over years with NISAR interferometry (InSAR).', 'Soil moisture is not available here; tap farmland nearby instead.'],
      dense: ['Good for following forest or orchard change over the seasons.', 'Treat soil-moisture values here with care: dense plants weaken the reading.'],
    },
    // Practical advice for farmland and open land, built from this point's own numbers.
    tip: {
      wet: (p, a) => `This area is usually <strong>wetter</strong> than the lowland average (${p} vs ${a} m³/m³). It probably needs less irrigation than drier parts of the lowland, so check before watering on a fixed schedule.`,
      dry: (p, a) => `This area is usually <strong>drier</strong> than the lowland average (${p} vs ${a} m³/m³). If it is farmland, check whether canal water really reaches it. If it stays dry pass after pass, take this to your water users' association or irrigation office: the satellite shows it too.`,
      same: 'Soil moisture here is close to the lowland average: no sign of a water problem.',
      rainStrong: (d) => `The 3 October rain clearly wetted the soil here (+${d}). If you farm here, after a rain like that you can usually <strong>delay the next irrigation turn by a few days</strong> and save water and pumping costs.`,
      rainWeak: 'The 3 October rain barely changed the soil here. A light rain is not enough to skip irrigation in this area.',
      chart: 'Use this point\'s chart to see how fast the soil here dries after rain: it helps to plan sowing, ploughing and the next watering, even on cloudy days.',
      ground: 'One reading covers about 1 km, so your field is mixed with its neighbours. Check your own field before deciding (squeeze a handful of soil). Single fields will need NISAR\'s 10–20 m product.',
    },
    caveat: 'Automatic reading from provisional NISAR data (~1 km around the point). It is a guide, not a field survey.',
  },
  az: {
    title: 'Bu rəqəmlər nə deyir',
    type: 'Bura çox güman ki, nədir',
    types: {
      water: 'Su (dəniz və ya göl)',
      city: 'Tikili ərazi: şəhər, sənaye və ya neft yataqları',
      dense: 'Sıx bitki örtüyü: ağaclar və ya hündür əkinlər',
      farm: 'Qismən bitki örtüklü qarışıq torpaq: əkin sahəsi, kolluq və ya qarışıq səth',
      bare: 'Çılpaq və ya seyrək torpaq: quru çöl və ya yarımsəhra',
    },
    why: {
      water: 'Bitki əks-sədası (HV) cihazın fon küyü qədər zəifdir, sakit suda olduğu kimi.',
      city: (hh) => `Çox güclü HH (median ${hh} dB): divarlar və küçələr dalğanı birbaşa geri qaytarır.`,
      dense: (hv) => `Güclü bitki əks-sədası (HV, median ${hv} dB): yarpaq və budaqlar dalğanı o yan-bu yana atır.`,
      farm: (hv) => `Orta bitki əks-sədası (HV, median ${hv} dB): burada bir qədər bitki var.`,
      bare: (hv) => `Zəif bitki əks-sədası (HV, median ${hv} dB): bitki azdır; cihazın küy səviyyəsinə yaxındır.`,
    },
    analysis: 'Təhlil',
    smWet: (p, a) => `Buradakı torpaq nəmliyi (median ${p} m³/m³, iyun–oktyabr) ovalığın ortasından (${a}) <strong>nəmdir</strong>.`,
    smDry: (p, a) => `Buradakı torpaq nəmliyi (median ${p} m³/m³, iyun–oktyabr) ovalığın ortasından (${a}) <strong>qurudur</strong>.`,
    smSame: (p, a) => `Buradakı torpaq nəmliyi (median ${p} m³/m³, iyun–oktyabr) ovalığın ortasına (${a}) yaxındır.`,
    smNone: 'Burada torpaq nəmliyi ölçülmür (məhsul su, şəhər və çox sıx bitki örtüyünü buraxır).',
    rainStrong: (d) => `3 oktyabr yağışına <strong>güclü</strong> cavab verdi (torpaq nəmliyi +${d}).`,
    rainWeak: (d) => `3 oktyabr yağışına zəif cavab verdi (torpaq nəmliyi ${d >= 0 ? '+' : ''}${d}).`,
    trendUp: (d) => `Bitki əks-sədası (HV) iyundan oktyabradək ${d} dB artdı.`,
    trendDown: (d) => `Bitki əks-sədası (HV) iyundan oktyabradək ${d} dB azaldı (səbəb məhsul yığımı, quruma və ya şum ola bilər).`,
    trendFlat: 'Bitki əks-sədası (HV) iyundan oktyabradək təxminən eyni qaldı.',
    recs: 'Bununla nə edə bilərsiniz',
    rec: {
      water: ['Bu nöqtədən küləyi və dəniz vəziyyətini izləmək üçün istifadə edin: küləkli səhərlərdə dəniz daha parlaq görünür.', 'Torpaq nəmliyi və bitkilər üçün istifadə etməyin.'],
      city: ['Sabit radar hədəfidir: NISAR interferometriyası (InSAR) ilə illər ərzində yerin yavaş çökməsini ölçmək üçün yaxşı yerdir.', 'Burada torpaq nəmliyi yoxdur; yaxındakı əkin sahəsinə toxunun.'],
      dense: ['Meşə və ya bağ dəyişikliyini mövsümlər boyu izləmək üçün yaxşıdır.', 'Buradakı torpaq nəmliyi dəyərlərinə ehtiyatla yanaşın: sıx bitki ölçməni zəiflədir.'],
    },
    tip: {
      wet: (p, a) => `Bu ərazi adətən ovalığın ortasından <strong>nəmdir</strong> (${p}, ortası ${a} m³/m³). Yəqin ki, ovalığın quru hissələrindən az suvarma tələb edir; ona görə sabit cədvəllə suvarmazdan əvvəl yoxlayın.`,
      dry: (p, a) => `Bu ərazi adətən ovalığın ortasından <strong>qurudur</strong> (${p}, ortası ${a} m³/m³). Əkin sahəsidirsə, kanal suyunun həqiqətən çatıb-çatmadığını yoxlayın. Keçiddən keçidə quru qalırsa, su istifadəçiləri birliyinə və ya meliorasiya idarəsinə müraciət edin: peyk də bunu göstərir.`,
      same: 'Buradakı torpaq nəmliyi ovalığın ortasına yaxındır: su problemi əlaməti yoxdur.',
      rainStrong: (d) => `3 oktyabr yağışı burada torpağı aydın şəkildə nəmləndirdi (+${d}). Burada əkinçilik edirsinizsə, belə yağışdan sonra adətən <strong>növbəti suvarmanı bir neçə gün təxirə sala</strong>, su və nasos xərcinə qənaət edə bilərsiniz.`,
      rainWeak: '3 oktyabr yağışı burada torpağı demək olar ki, dəyişmədi. Bu ərazidə yüngül yağış suvarmanı buraxmaq üçün kifayət deyil.',
      chart: 'Torpağın yağışdan sonra nə qədər tez quruduğunu bu nöqtənin qrafikində görün: bu, buludlu günlərdə də əkini, şumu və növbəti suvarmanı planlamağa kömək edir.',
      ground: 'Bir ölçmə təxminən 1 km-i əhatə edir, ona görə sizin sahəniz qonşularla qarışır. Qərar verməzdən əvvəl öz sahənizi yoxlayın (bir ovuc torpağı sıxıb baxın). Ayrı sahələr üçün NISAR-ın 10–20 m-lik məhsulu lazım olacaq.',
    },
    caveat: 'İlkin NISAR məlumatından avtomatik oxunuş (nöqtə ətrafında ~1 km). Bu, istiqamətdir, sahə müayinəsi deyil.',
  },
};

/** s = {hh[], hv[], sm[]} for all dates; data = loaded app data; water = 0/1 at the point. */
export function analyzePoint(data, s, water, lang) {
  const L = T[lang] || T.en;
  const prov = (a) => a.slice(P0, P1 + 1);
  const hh = med(prov(s.hh)), hv = med(prov(s.hv)), sm = med(prov(s.sm));
  const areaSm = med(data.dates.slice(P0, P1 + 1).map((d) => d.land_sm_median));
  let type;
  if (water || (hv !== null && hv < -18.5)) type = 'water';
  else if (hh !== null && hh > -6) type = 'city';
  else if (hv !== null && hv > -12) type = 'dense';
  else if (hv !== null && hv > -16) type = 'farm';
  else type = 'bare';
  const why = type === 'water' ? L.why.water : type === 'city' ? L.why.city(f1(hh)) : L.why[type](f1(hv));

  const lines = [];
  let smState = null;
  let rain = null;
  if (sm === null || type === 'water') lines.push(L.smNone);
  else {
    const d = sm - areaSm;
    smState = d > 0.03 ? 'wet' : d < -0.03 ? 'dry' : 'same';
    lines.push((smState === 'wet' ? L.smWet : smState === 'dry' ? L.smDry : L.smSame)(f2(sm), f2(areaSm)));
    const a = s.sm[RAIN_B], b = s.sm[RAIN_A];
    if (a !== null && b !== null) { rain = +(b - a).toFixed(2); lines.push(rain >= 0.04 ? L.rainStrong(rain.toFixed(2)) : L.rainWeak(rain)); }
  }
  if (type !== 'water' && s.hv[P0] !== null && s.hv[P1] !== null) {
    const dt = s.hv[P1] - s.hv[P0];
    lines.push(Math.abs(dt) < 1 ? L.trendFlat : dt > 0 ? L.trendUp(dt.toFixed(1)) : L.trendDown(Math.abs(dt).toFixed(1)));
  }
  let recs;
  if (type === 'farm' || type === 'bare') {
    // Farmer-style advice from this point's own numbers.
    recs = [];
    if (smState) recs.push(smState === 'wet' ? L.tip.wet(f2(sm), f2(areaSm)) : smState === 'dry' ? L.tip.dry(f2(sm), f2(areaSm)) : L.tip.same);
    if (rain !== null) recs.push(rain >= 0.04 ? L.tip.rainStrong(rain.toFixed(2)) : L.tip.rainWeak);
    if (smState) recs.push(L.tip.chart);
    recs.push(L.tip.ground);
  } else recs = L.rec[type];
  return `<h4>${L.title}</h4>
<p><strong>${L.type}:</strong> ${L.types[type]}. <span class="why">${why}</span></p>
<p class="an-h">${L.analysis}</p><ul>${lines.map((x) => `<li>${x}</li>`).join('')}</ul>
<p class="an-h">${L.recs}</p><ul>${recs.map((x) => `<li>${x}</li>`).join('')}</ul>
<p class="hint">${L.caveat}</p>`;
}
