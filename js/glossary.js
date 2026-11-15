// Tap-to-explain glossary: turns the first mention of each hard term in a container into a button
// that opens a short plain-language explanation.
const TERMS = {
  radar: {
    en: ['radar', 'A sensor that sends its own radio waves and listens for the echo, a bit like a bat. It works at night and through clouds.'],
    az: ['radar', 'Özü radio dalğası göndərib əks-sədanı dinləyən cihaz, bir az yarasa kimi. Gecə də, buludların arxasından da işləyir.'],
    re: { en: /\bradar\b/i, az: /\bradar\b/i },
  },
  nisar: {
    en: ['NISAR', 'A NASA and Indian Space Research Organisation (ISRO) radar satellite, launched in July 2025. It images almost all of Earth\'s land about every 12 days.'],
    az: ['NISAR', 'NASA və Hindistan Kosmik Tədqiqatlar Təşkilatının (ISRO) radar peyki, 2025-ci ilin iyulunda buraxılıb. Yer kürəsinin demək olar ki, bütün qurusunu təxminən hər 12 gündən bir çəkir.'],
    re: { en: /\bNISAR\b/, az: /\bNISAR\b/ },
  },
  lband: {
    en: ['L-band', 'Radio waves about 24 cm long. They pass through clouds and partly through leaves.'],
    az: ['L-diapazon', 'Təxminən 24 sm uzunluğunda radio dalğaları. Buludlardan və qismən yarpaqlardan keçir.'],
    re: { en: /\bL-band\b/, az: /\bL-diapazon\S*/ },
  },
  hh: {
    en: ['HH', 'The echo of a horizontally sent wave that comes back horizontal. Strong from buildings and rough bare ground.'],
    az: ['HH', 'Üfüqi göndərilən dalğanın üfüqi qayıdan əks-sədası. Binalardan və kobud çılpaq torpaqdan güclü olur.'],
    re: { en: /\bHH\b/, az: /\bHH\b/ },
  },
  hv: {
    en: ['HV', 'The echo that comes back turned (vertical). Leaves and branches turn the wave, so strong HV is a sign of plants.'],
    az: ['HV', 'Fırlanmış (şaquli) qayıdan əks-səda. Yarpaq və budaqlar dalğanı fırladır, ona görə güclü HV bitki əlamətidir.'],
    re: { en: /\bHV\b/, az: /\bHV\b/ },
  },
  db: {
    en: ['dB (decibel)', 'A scale for echo strength, like loudness for sound. +3 dB is about twice as strong; −20 dB is a very weak echo.'],
    az: ['dB (desibel)', 'Əks-səda gücünün şkalası, səs üçün ucalıq kimi. +3 dB təxminən iki dəfə güclü deməkdir; −20 dB çox zəif əks-sədadır.'],
    re: { en: /\bdB\b/, az: /\bdB\b/ },
  },
  sigma: {
    en: ['σ⁰ (sigma-nought)', 'How much radar energy one square metre of ground sends back. The standard measure of radar brightness.'],
    az: ['σ⁰ (siqma-sıfır)', 'Yerin bir kvadrat metrinin geri qaytardığı radar enerjisi. Radar parlaqlığının standart ölçüsü.'],
    re: { en: /σ⁰/, az: /σ⁰/ },
  },
  sm: {
    en: ['m³/m³ (soil moisture)', 'How much of the top soil is water. 0.25 means a quarter of the soil volume is water; 0.05 is very dry.'],
    az: ['m³/m³ (torpaq nəmliyi)', 'Torpağın üst qatının nə qədərinin su olduğu. 0,25 torpaq həcminin dörddə biri sudur deməkdir; 0,05 çox qurudur.'],
    re: { en: /m³\/m³/, az: /m³\/m³/ },
  },
  noise: {
    en: ['noise floor', 'The weakest echo the instrument can tell apart from its own electronic hiss. Values close to it are not trustworthy.'],
    az: ['küy səviyyəsi', 'Cihazın öz elektron küyündən ayıra bildiyi ən zəif əks-səda. Ona yaxın dəyərlərə etibar etmək olmaz.'],
    re: { en: /\bnoise floor\b/i, az: /küy səviyyə\S*/i },
  },
  ndvi: {
    en: ['NDVI', 'A greenness index from an optical satellite (MODIS): the higher, the more green leaves.'],
    az: ['NDVI', 'Optik peykdən (MODIS) yaşıllıq indeksi: nə qədər yüksəkdirsə, bir o qədər çox yaşıl yarpaq var.'],
    re: { en: /\bNDVI\b/, az: /\bNDVI\b/ },
  },
  prov: {
    en: ['PROVISIONAL / BETA', 'Early versions of NISAR data that are not yet fully checked against measurements on the ground.'],
    az: ['İLKİN / BETA', 'NISAR məlumatının hələ yer ölçmələri ilə tam yoxlanmamış erkən versiyaları.'],
    re: { en: /\b(PROVISIONAL|BETA)\b/, az: /(İLKİN\S*|\bBETA\b)/ },
  },
  median: {
    en: ['median', 'The middle value: half of the values are higher and half are lower. A few odd values fool it less than the average.'],
    az: ['median', 'Orta dəyər: dəyərlərin yarısı ondan böyük, yarısı kiçikdir. Bir neçə qəribə dəyər onu ədədi ortadan az çaşdırır.'],
    re: { en: /\bmedian\b/i, az: /\bmedian\S*/i },
  },
  corr: {
    en: ['r (correlation)', 'How closely two things rise and fall together: 1 = always together, 0 = no link. 0.63 is a clear but not perfect link.'],
    az: ['r (korrelyasiya)', 'İki şeyin nə qədər birlikdə artıb-azaldığı: 1 = həmişə birlikdə, 0 = əlaqə yoxdur. 0,63 aydın, amma mükəmməl olmayan əlaqədir.'],
    re: { en: /\br = /, az: /\br = / },
  },
  insar: {
    en: ['InSAR', 'Comparing radar images from different dates to measure tiny ground movements, down to millimetres.'],
    az: ['InSAR', 'Yerin millimetrlərlə ölçülən kiçik hərəkətlərini tapmaq üçün müxtəlif tarixlərin radar şəkillərini müqayisə etmək.'],
    re: { en: /\bInSAR\b/, az: /\bInSAR\b/ },
  },
};

let tip = null;
let openBtn = null;
let lang = 'en';

function ensureTip() {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = 'termTip';
  tip.className = 'term-tip';
  tip.setAttribute('role', 'note');
  tip.hidden = true;
  document.body.append(tip);
  document.addEventListener('click', (e) => {
    if (!tip.hidden && !tip.contains(e.target) && !e.target.closest('.term')) closeTip();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tip.hidden) { closeTip(true); e.stopPropagation(); }
  }, true);
  window.addEventListener('resize', () => closeTip());
  document.addEventListener('scroll', () => closeTip(), true); // panel or page scroll
  return tip;
}

export function closeTip(refocus = false) {
  if (!tip || tip.hidden) return;
  tip.hidden = true;
  if (openBtn) {
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.removeAttribute('aria-describedby');
    if (refocus) openBtn.focus();
  }
  openBtn = null;
}

function openTip(btn) {
  const t = ensureTip();
  if (openBtn === btn) { closeTip(); return; }
  closeTip();
  const def = TERMS[btn.dataset.term];
  const [name, text] = def[lang] || def.en;
  t.innerHTML = `<strong>${name}</strong><span>${text}</span>`;
  t.hidden = false;
  const r = btn.getBoundingClientRect();
  const w = Math.min(300, window.innerWidth - 24);
  t.style.width = `${w}px`;
  const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
  t.style.left = `${left + window.scrollX}px`;
  t.style.top = `${r.bottom + window.scrollY + 6}px`;
  const tr = t.getBoundingClientRect();
  if (tr.bottom > window.innerHeight - 8 && r.top > tr.height + 12) t.style.top = `${r.top + window.scrollY - tr.height - 6}px`;
  btn.setAttribute('aria-expanded', 'true');
  btn.setAttribute('aria-describedby', 'termTip');
  openBtn = btn;
}

/** Wrap the first mention of each term inside `root` (text only; skips links, buttons, headings, sources). */
export function linkTerms(root, language) {
  lang = language === 'az' ? 'az' : 'en';
  if (!root) return;
  closeTip();
  const used = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (n.parentElement.closest('a, button, summary, h1, h2, h3, .term, .source, kbd, code, pre')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    // Find all term matches in this node, keep the earliest new one each round.
    let cur = node;
    for (;;) {
      let best = null;
      for (const [id, def] of Object.entries(TERMS)) {
        if (used.has(id)) continue;
        const m = def.re[lang].exec(cur.nodeValue);
        if (m && (!best || m.index < best.m.index)) best = { id, m };
      }
      if (!best) break;
      used.add(best.id);
      const after = cur.splitText(best.m.index);
      const rest = after.splitText(best.m[0].length);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'term';
      btn.dataset.term = best.id;
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = best.m[0];
      btn.addEventListener('click', (e) => { e.stopPropagation(); openTip(btn); });
      after.replaceWith(btn);
      cur = rest;
    }
  }
}
