// Rule-based reading of one point's NISAR numbers: surface type, analysis, recommendations.
// Thresholds are simple and stated in the text; results are indications, not ground truth.
const P0 = 5, P1 = 14, RAIN_B = 12, RAIN_A = 13; // provisional range; 22 Sep and 4 Oct 2026

const med = (a) => { const v = a.filter((x) => x !== null && Number.isFinite(x)).sort((p, q) => p - q); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
const f1 = (v) => (v === null ? '–' : v.toFixed(1));
const f2 = (v) => (v === null ? '–' : v.toFixed(2));

const T = {
  en: {
    title: 'What these numbers say',
    type: 'Surface type (radar estimate)',
    types: {
      water: 'Water (sea or lake)',
      city: 'Built-up: city, industry or oil fields',
      dense: 'Dense vegetation: trees or tall crops',
      farm: 'Mixed land with some vegetation: farmland, shrubs or mixed surfaces',
      bare: 'Bare or sparse land: dry steppe or semi-desert',
    },
    why: {
      water: 'HV is at the instrument noise floor, as over calm water.',
      city: (hh) => `Very strong HH (median ${hh} dB): walls and streets send the wave straight back.`,
      dense: (hv) => `Strong HV (median ${hv} dB): leaves and branches scatter the wave.`,
      farm: (hv) => `Medium HV (median ${hv} dB): some plant volume.`,
      bare: (hv) => `Weak HV (median ${hv} dB): little plant volume; close to the noise floor.`,
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
    recs: 'Recommendations',
    rec: {
      water: ['Use this point to study wind and sea state: on windier mornings the sea looks brighter.', 'Do not use it for soil moisture or vegetation.'],
      city: ['A stable radar target: a good place to measure slow ground sinking over years with NISAR interferometry (InSAR).', 'Soil moisture is not available here; compare land points nearby instead.'],
      dense: ['Good for following vegetation or forest change with HV over seasons.', 'Treat soil-moisture values here with care: dense plants weaken the retrieval.'],
      farmWet: ['Behaves like irrigated or naturally wet farmland: a good point to follow the irrigation and crop season every 12 days.', 'To see single fields, use NISAR’s 10–20 m GCOV product and check on the ground.'],
      farmDry: ['Drier than the lowland average: if this is farmland, it may be worth checking its water supply on the ground.', 'Compare with neighbouring points to see whether the whole area is dry or only this spot.'],
      farm: ['Typical vegetated land for this area: follow it across seasons to see when plants grow and are harvested.', 'Field-level decisions need NISAR’s 10–20 m product and a ground check.'],
      bare: ['Good for watching how quickly the ground gets wet after rain and dries again.', 'Small changes in HV here are close to the noise floor and not meaningful.'],
    },
    caveat: 'Automatic reading from provisional NISAR data (~1 km around the point). It is a guide, not a field survey.',
  },
  az: {
    title: 'Bu rəqəmlər nə deyir',
    type: 'Səth növü (radar təxmini)',
    types: {
      water: 'Su (dəniz və ya göl)',
      city: 'Tikili ərazi: şəhər, sənaye və ya neft yataqları',
      dense: 'Sıx bitki örtüyü: ağaclar və ya hündür əkinlər',
      farm: 'Qismən bitki örtüklü qarışıq torpaq: əkin sahəsi, kolluq və ya qarışıq səth',
      bare: 'Çılpaq və ya seyrək torpaq: quru çöl və ya yarımsəhra',
    },
    why: {
      water: 'HV cihazın küy səviyyəsindədir, sakit su üzərində olduğu kimi.',
      city: (hh) => `Çox güclü HH (median ${hh} dB): divarlar və küçələr dalğanı birbaşa geri qaytarır.`,
      dense: (hv) => `Güclü HV (median ${hv} dB): yarpaq və budaqlar dalğanı səpələyir.`,
      farm: (hv) => `Orta HV (median ${hv} dB): müəyyən qədər bitki həcmi var.`,
      bare: (hv) => `Zəif HV (median ${hv} dB): bitki azdır; küy səviyyəsinə yaxındır.`,
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
    recs: 'Tövsiyələr',
    rec: {
      water: ['Bu nöqtədən külək və dəniz vəziyyətini öyrənmək üçün istifadə edin: küləkli səhərlərdə dəniz daha parlaq görünür.', 'Torpaq nəmliyi və bitki örtüyü üçün istifadə etməyin.'],
      city: ['Sabit radar hədəfidir: NISAR interferometriyası (InSAR) ilə illər ərzində yerin yavaş çökməsini ölçmək üçün yaxşı yerdir.', 'Burada torpaq nəmliyi yoxdur; yaxındakı quru nöqtələrlə müqayisə edin.'],
      dense: ['Mövsümlər boyu HV ilə bitki və ya meşə dəyişikliyini izləmək üçün yaxşıdır.', 'Buradakı torpaq nəmliyi dəyərlərinə ehtiyatla yanaşın: sıx bitki ölçməni zəiflədir.'],
      farmWet: ['Suvarılan və ya təbii nəm əkin sahəsi kimi davranır: suvarma və əkin mövsümünü hər 12 gündən bir izləmək üçün yaxşı nöqtədir.', 'Ayrı sahələri görmək üçün NISAR-ın 10–20 m-lik GCOV məhsulundan istifadə edin və yerində yoxlayın.'],
      farmDry: ['Ovalığın ortasından qurudur: əgər bu əkin sahəsidirsə, suyunu yerində yoxlamağa dəyər.', 'Qonşu nöqtələrlə müqayisə edin: bütün ərazi qurudur, yoxsa yalnız bu yer.'],
      farm: ['Bu ərazi üçün tipik bitki örtüklü torpaqdır: bitkilərin nə vaxt böyüdüyünü və yığıldığını görmək üçün mövsümlər boyu izləyin.', 'Sahə səviyyəsində qərarlar üçün NISAR-ın 10–20 m-lik məhsulu və yerində yoxlama lazımdır.'],
      bare: ['Torpağın yağışdan sonra nə qədər tez nəmləndiyini və quruduğunu izləmək üçün yaxşıdır.', 'Buradakı kiçik HV dəyişiklikləri küy səviyyəsinə yaxındır və mənalı deyil.'],
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
  if (sm === null || type === 'water') lines.push(L.smNone);
  else {
    const d = sm - areaSm;
    smState = d > 0.03 ? 'wet' : d < -0.03 ? 'dry' : 'same';
    lines.push((smState === 'wet' ? L.smWet : smState === 'dry' ? L.smDry : L.smSame)(f2(sm), f2(areaSm)));
    const a = s.sm[RAIN_B], b = s.sm[RAIN_A];
    if (a !== null && b !== null) { const dr = +(b - a).toFixed(2); lines.push(dr >= 0.04 ? L.rainStrong(dr.toFixed(2)) : L.rainWeak(dr)); }
  }
  if (type !== 'water' && s.hv[P0] !== null && s.hv[P1] !== null) {
    const dt = s.hv[P1] - s.hv[P0];
    lines.push(Math.abs(dt) < 1 ? L.trendFlat : dt > 0 ? L.trendUp(dt.toFixed(1)) : L.trendDown(Math.abs(dt).toFixed(1)));
  }
  let recKey = type;
  if (type === 'farm') recKey = smState === 'wet' ? 'farmWet' : smState === 'dry' ? 'farmDry' : 'farm';
  const recs = L.rec[recKey];
  return `<h4>${L.title}</h4>
<p><strong>${L.type}:</strong> ${L.types[type]}. <span class="why">${why}</span></p>
<p class="an-h">${L.analysis}</p><ul>${lines.map((x) => `<li>${x}</li>`).join('')}</ul>
<p class="an-h">${L.recs}</p><ul>${recs.map((x) => `<li>${x}</li>`).join('')}</ul>
<p class="hint">${L.caveat}</p>`;
}
