// Radar Absheron controller: story, explore controls, time bar, inspector, keyboard, language.
import { loadAll, seriesAt, rainBetweenPasses, nearestPowerSite } from './data.js';
import { RadarMap, CONTEXT, CHANGE_DB } from './map.js';
import { renderChart } from './chart.js';
import { STEPS, ACTIONS } from './story.js';
import { t, setLang, getLang, applyStatic, fmtISO } from './i18n.js';
import { dataPanelHtml } from './datapanel.js';

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PROV_FIRST = 5, PROV_LAST = 14, RAIN_BEFORE = 12, RAIN_AFTER = 13;
const RAIN_BEFORE_I = RAIN_BEFORE, RAIN_AFTER_I = RAIN_AFTER;

const S = {
  mode: 'story', step: 0, date: 7, layer: 'composite', compare: false, compareRight: 'modis_truecolor_2026-07-12',
  changeFrom: RAIN_BEFORE_I, changeTo: RAIN_AFTER_I, changePol: 0, opacity: 1,
  playing: null, left: null, right: null, inspected: null,
};
let data, rmap;

// ---------- helpers ----------
function fmtDate(i, short = false) { return fmtISO(data.dates[i].date, short ? 'short' : 'full'); }
function passTime(i) {
  const s = data.dates[i].start;
  return new Date(/Z$/.test(s) ? s : `${s}Z`).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku' });
}
const levelOf = (i) => (data.dates[i].level === 'BETA' ? t('level_beta') : t('level_prov'));
function announce(msg) { const n = $('#live'); n.textContent = ''; setTimeout(() => { n.textContent = msg; }, 30); }
function layerName(desc) {
  if (!desc) return '';
  if (desc.kind === 'ctx') return desc.id.includes('ndvi') ? `MODIS NDVI ${CONTEXT[desc.id].date}` : `MODIS ${CONTEXT[desc.id].date}`;
  if (desc.kind === 'sm') return `${t('layer_sm')} ${fmtDate(desc.date, true)}`;
  if (desc.kind === 'change') return `${t('layer_change')} ${desc.pol ? 'HV' : 'HH'} ${fmtDate(desc.from, true)} → ${fmtDate(desc.to, true)}`;
  const p = desc.pol === 'hh' ? t('layer_hh') : desc.pol === 'hv' ? t('layer_hv') : t('layer_composite');
  return `NISAR ${p} ${fmtDate(desc.date, true)}`;
}

// ---------- layers ----------
let applySeq = 0;
async function applyLayers(left, right, swipe) {
  const seq = ++applySeq;
  S.left = left; S.right = right || null;
  await rmap.setLeft(left);
  if (seq !== applySeq) return; // a newer request superseded this one
  await rmap.setRight(S.right);
  if (seq !== applySeq) return;
  $('#swipe').hidden = !S.right;
  if (S.right) {
    if (swipe !== undefined) setSwipe(swipe);
    $('#swipeLeftTag').textContent = layerName(left);
    $('#swipeRightTag').textContent = layerName(S.right);
    announce(t('live_compare', layerName(left), layerName(S.right)));
  } else {
    announce(t('live_date', layerName(left)));
  }
  renderLegend();
}

function setSwipe(pct) {
  rmap.setSwipe(pct);
  const x = `${pct}%`;
  document.querySelector('.swipe-line').style.left = x;
  const k = $('#swipeKnob');
  k.style.left = x;
  k.setAttribute('aria-valuenow', Math.round(pct));
  k.setAttribute('aria-valuetext', `${Math.round(pct)}%: ${t('swipe')}`);
  $('#swipeLeftTag').style.right = `calc(${100 - pct}% + 10px)`;
  $('#swipeRightTag').style.left = `calc(${pct}% + 10px)`;
}

function datedTarget() {
  const dated = (d) => d && (d.kind === 'radar' || d.kind === 'sm');
  if (dated(S.left)) return 'left';
  if (dated(S.right)) return 'right';
  return null;
}

function setDate(i, { fromUser = false, layers = true } = {}) {
  S.date = Math.max(0, Math.min(data.D - 1, i));
  $('#dateRange').value = S.date;
  $('#dateRange').setAttribute('aria-valuetext', `${fmtDate(S.date)}, ${levelOf(S.date)}`);
  $('#dateLabel').textContent = fmtDate(S.date);
  $('#dateSub').textContent = ` ${t('pass_sub', passTime(S.date))} · ${levelOf(S.date)}`;
  const tgt = layers ? datedTarget() : null;
  if (tgt === 'left') applyLayers({ ...S.left, date: S.date }, S.right);
  else if (tgt === 'right') applyLayers(S.left, { ...S.right, date: S.date });
  else renderLegend();
  if (S.inspected) drawInspector();
  if (fromUser) stopPlay();
}

// ---------- play ----------
function play(range) {
  stopPlay();
  const [a, b] = range || [S.date >= data.D - 1 ? PROV_FIRST : S.date, data.D - 1];
  rmap.preload(Array.from({ length: b - a + 1 }, (_, k) => a + k));
  let i = a;
  setDate(i);
  $('#playBtn').setAttribute('aria-pressed', 'true');
  $('#playBtn').setAttribute('aria-label', t('pause'));
  $('#playBtn').firstElementChild.textContent = '❚❚';
  S.playing = setInterval(() => {
    i += 1;
    if (i > b) { stopPlay(); return; }
    setDate(i);
  }, 1300);
}
function stopPlay() {
  if (S.playing) clearInterval(S.playing);
  S.playing = null;
  $('#playBtn').setAttribute('aria-pressed', 'false');
  $('#playBtn').setAttribute('aria-label', t('play'));
  $('#playBtn').firstElementChild.textContent = '▶';
}

// ---------- legend ----------
function renderLegend() {
  const L = $('#legend');
  const d = S.left;
  if (!d) { L.hidden = true; return; }
  L.hidden = false;
  const sc = data.sme.scales;
  let html = '';
  if (d.kind === 'radar' && d.pol === 'composite') {
    html = `<h3>${t('legend_title_composite')}</h3>
      <div class="sw"><i style="background:#e9a6e0"></i><span>${t('lg_magenta')}</span></div>
      <div class="sw"><i style="background:#3fa354"></i><span>${t('lg_green')}</span></div>
      <div class="sw"><i style="background:#f1f1ee"></i><span>${t('lg_white')}</span></div>
      <div class="sw"><i style="background:#1d221f"></i><span>${t('lg_dark')}</span></div>
      <p>${t('lg_rel', sc.rgb_hh_db, sc.rgb_hv_db)}</p><p>${t('lg_stripes')}</p>`;
  } else if (d.kind === 'radar') {
    const r = d.pol === 'hh' ? sc.rgb_hh_db : sc.rgb_hv_db;
    html = `<h3>${t(d.pol === 'hh' ? 'legend_title_hh' : 'legend_title_hv')}</h3>
      <div class="ramp" style="background:linear-gradient(90deg,#000,#fff)"></div>
      <div class="ramp-labels"><span>${r[0]} dB</span><span>${r[1]} dB</span></div>
      <p>${t('lg_single', d.pol.toUpperCase(), r)}</p>`;
  } else if (d.kind === 'sm') {
    html = `<h3>${t('legend_title_sm')}</h3>
      <div class="ramp" style="background:linear-gradient(90deg,rgb(222,196,148),rgb(196,168,108) 22%,rgb(120,170,160) 44%,rgb(44,127,184) 67%,rgb(23,52,125))"></div>
      <div class="ramp-labels"><span>0 · ${t('lg_sm_dry')}</span><span>0.2</span><span>${sc.sm_max} m³/m³ · ${t('lg_sm_wet')}</span></div>
      <p>${t('lg_sm')}</p><p class="tag">${levelOf(d.date)}</p>`;
  } else if (d.kind === 'change') {
    const p = d.pol ? 'HV' : 'HH';
    html = `<h3>${t('legend_title_change')}</h3>
      <div class="ramp" style="background:linear-gradient(90deg,rgb(191,129,45),rgba(191,129,45,.5) 45%,#fff 50%,rgba(64,176,166,.5) 55%,rgb(64,176,166))"></div>
      <div class="ramp-labels"><span>−${CHANGE_DB.full} dB · ${t('lg_change_low')}</span><span>+${CHANGE_DB.full} dB · ${t('lg_change_high')}</span></div>
      <p>${t('lg_change_note', p, fmtDate(d.from, true), fmtDate(d.to, true), CHANGE_DB.hide, CHANGE_DB.full)}</p>`;
  } else if (d.kind === 'ctx') {
    html = `<h3>${t('legend_title_ctx')}</h3><p>${d.id.includes('ndvi') ? t('lg_ctx_ndvi') : t('lg_ctx_true')}</p>`;
    if (S.right) html += `<p><strong>→</strong> ${layerName(S.right)}</p>`;
  }
  if (S.right && d.kind !== 'ctx') html += `<p><strong>⇔</strong> ${layerName(S.right)}</p>`;
  const anyBeta = [S.left, S.right].some((x) => x && x.date !== undefined && data.dates[x.date].level === 'BETA');
  if (anyBeta) html += `<p class="tag">${t('beta_note')}</p>`;
  const wasOpen = L.querySelector('details') ? L.querySelector('details').open : window.matchMedia('(min-width: 1100px)').matches;
  html = html.replace(/^\s*<h3>(.*?)<\/h3>/, (m0, title) => `<details${wasOpen ? ' open' : ''}><summary><h3>${title}</h3></summary>`) + '</details>';
  L.innerHTML = html;
}

// ---------- inspector ----------
function inspect(latlng, label) {
  S.inspected = { lat: latlng.lat, lng: latlng.lng, label };
  drawInspector();
}

function drawInspector() {
  const { lat, lng, label } = S.inspected;
  const box = $('#inspector');
  box.hidden = false;
  $('#inspTitle').textContent = label || t('insp_point', lat, lng);
  const s = seriesAt(data, lat, lng);
  const lang = getLang();
  if (!s) {
    $('#inspDesc').textContent = t('insp_nodata');
    ['#chart', '#chart2', '#chartTable', '#chartTable2'].forEach((q) => $(q).replaceChildren());
    $('#inspNote').textContent = '';
    announce(t('insp_nodata'));
    return;
  }
  const dates = data.dates.map((d) => d.date);
  const vals = [...s.hh, ...s.hv].filter((v) => v !== null);
  const yMin = Math.floor(Math.min(-22, ...vals) / 2) * 2;
  const yMax = Math.ceil(Math.max(-6, ...vals) / 2) * 2;
  renderChart($('#chart'), $('#chartTable'), {
    dates, lang, digits: 1, current: S.date, gaps: [4], gapLabel: t('gap'), yMin, yMax, yLabel: t('rel_label'),
    title: `${t('rel_label')}: ${label || t('insp_point', lat, lng)}`,
    series: [
      { label: t('hh_line'), color: '#a3237a', values: s.hh },
      { label: t('hv_line'), color: '#1d7a3c', values: s.hv, dash: '6 4', marker: 'square' },
    ],
  });
  const site = nearestPowerSite(data.power, lat, lng);
  const rain = rainBetweenPasses(data.power, site, dates);
  renderChart($('#chart2'), $('#chartTable2'), {
    dates, lang, digits: 2, current: S.date, gaps: [4], gapLabel: t('gap'), yMin: 0, yMax: 0.5, yLabel: t('sm_label'),
    title: `${t('sm_label')}, ${t('rain_label')}`,
    series: [{ label: t('sm_line'), color: '#2c7fb8', values: s.sm }],
    bars: { label: `${t('rain_label')} · NASA POWER`, unit: 'mm', values: rain, color: '#6b8fb5' },
  });
  const f = (v) => (v === null ? '–' : v.toFixed(1));
  const hv0 = s.hv[PROV_FIRST], hv1 = s.hv[PROV_LAST];
  const dv = hv0 !== null && hv1 !== null ? hv1 - hv0 : 0;
  const prov = (a) => a.slice(PROV_FIRST, PROV_LAST + 1).filter((v) => v !== null);
  const hhP = prov(s.hh);
  let extra = '';
  if (hhP.length && Math.max(...hhP) > -3) extra += t('saturated');
  if (prov(s.hv).length && Math.max(...prov(s.hv)) < -18.5) extra += t('dark');
  const smA = s.sm[RAIN_BEFORE], smB = s.sm[RAIN_AFTER];
  const smTxt = smA !== null && smB !== null ? t('sm_sentence', smA.toFixed(2), smB.toFixed(2)) : '';
  const desc = t('insp_desc', {
    hvDir: Math.abs(dv) < 1 ? t('stayed') : dv > 0 ? t('rose') : t('fell'),
    hv0: f(hv0), hv1: f(hv1), hhMin: hhP.length ? f(Math.min(...hhP)) : '–', hhMax: hhP.length ? f(Math.max(...hhP)) : '–',
    sm: smTxt, extra,
  });
  $('#inspDesc').textContent = desc;
  $('#inspNote').textContent = `${t('beta_note')} ${t('rain_label')}: NASA POWER, ${data.power.sites[site].name}.`;
  announce(`${$('#inspTitle').textContent}. ${desc}`);
  if (window.matchMedia('(min-width: 761px)').matches) box.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
}

function placeInspector() {
  const box = $('#inspector');
  if (S.mode === 'story') $('#stepBody').after(box);
  else if (S.mode === 'explore') $('#exploreView .hint').after(box);
  else $('#dataView').after(box);
}

function closeInspector() {
  $('#inspector').hidden = true;
  S.inspected = null;
  rmap.clearMarker();
}

// ---------- story ----------
function renderStep(apply = true) {
  const st = STEPS[S.step];
  const L = getLang();
  const tx = st[L] || st.en;
  $('#stepCount').textContent = t('step_of', S.step + 1, STEPS.length);
  $('#stepTitle').textContent = tx.title;
  $('#stepBody').innerHTML = tx.body;
  const acts = $('#stepActions');
  acts.replaceChildren(...(st.actions || []).map((a) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn';
    b.textContent = ACTIONS[a][L] || ACTIONS[a].en;
    b.addEventListener('click', () => runAction(a));
    return b;
  }));
  $('#prevStep').disabled = S.step === 0;
  const last = S.step === STEPS.length - 1;
  $('#nextStep').textContent = last ? t('finish') : t('next');
  [...$('#stepDots').querySelectorAll('button')].forEach((b, i) => {
    if (i === S.step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  if (!apply) return;
  stopPlay();
  rmap.fly(st.view.center, st.view.zoom);
  S.date = st.date;
  setDate(st.date, { layers: false });
  applyLayers(st.left, st.right, st.swipe ?? 50);
  if (st.inspect) {
    const p = data.places.find((x) => x.id === st.inspect);
    if (p) rmap.inspect({ lat: p.lat, lng: p.lon }, placeName(p));
  } else {
    closeInspector();
  }
  if (st.autoplay && !reduceMotion()) setTimeout(() => { if (STEPS[S.step] === st) play(st.autoplay); }, 1400);
}

function placeName(p) {
  const az = {
    baku: 'Bakı şəhər mərkəzi', boyukshor: 'Böyükşor gölü, Bakı', oilfield: 'Balaxanı–Sabunçu neft yataqları',
    kura_fields: 'Kür-Araz suvarılan sahələri (Saatlı–Sabirabad)', hajigabul: 'Hacıqabul gölü',
    forest: 'Böyük Qafqaz meşəsi (İsmayıllı)', caspian: 'Xəzər dənizi, Abşeron açıqları', shirvan: 'Şirvan düzü yarımsəhrası',
  };
  return getLang() === 'az' ? (az[p.id] || p.name) : p.name;
}

function runAction(a) {
  const ac = ACTIONS[a];
  if (ac.place) {
    const p = data.places.find((x) => x.id === ac.place);
    rmap.fly([p.lat, p.lon], ac.zoom);
    rmap.inspect({ lat: p.lat, lng: p.lon }, placeName(p));
  } else if (a === 'play_again') {
    play(STEPS[S.step].autoplay || [PROV_FIRST, PROV_LAST]);
  } else if (a === 'ndvi_compare') {
    applyLayers({ kind: 'ctx', id: 'modis_ndvi_2026-07-12' }, { kind: 'ctx', id: 'modis_ndvi_2026-10-16' }, 50);
  } else if (a === 'change_season') {
    applyLayers({ kind: 'change', from: PROV_FIRST, to: PROV_LAST, pol: 1 }, null);
  } else if (a === 'go_explore') {
    setMode('explore');
  } else if (a === 'go_data') {
    setMode('data');
  }
}

function goStep(i) {
  if (i >= STEPS.length) { setMode('explore'); return; }
  S.step = Math.max(0, Math.min(STEPS.length - 1, i));
  renderStep();
  $('#stepTitle').setAttribute('tabindex', '-1');
  $('#stepTitle').focus({ preventScroll: false });
}

// ---------- explore ----------
function exploreLeft() {
  if (S.layer === 'change') return { kind: 'change', from: S.changeFrom, to: S.changeTo, pol: S.changePol };
  if (S.layer === 'sm') return { kind: 'sm', date: S.date };
  return { kind: 'radar', date: S.date, pol: S.layer };
}
function exploreRight() {
  if (!S.compare) return null;
  const v = S.compareRight;
  if (v.startsWith('date:')) return { kind: 'radar', date: Number(v.slice(5)), pol: S.layer === 'hh' || S.layer === 'hv' ? S.layer : 'composite' };
  if (v === 'sm') return { kind: 'sm', date: S.date };
  return { kind: 'ctx', id: v };
}
function applyExplore() {
  $('#changeFields').hidden = S.layer !== 'change';
  $('#compareRow').hidden = !S.compare;
  applyLayers(exploreLeft(), exploreRight(), 50);
}

function fillSelects() {
  const opts = data.dates.map((d, i) => `<option value="${i}">${fmtDate(i)} · ${levelOf(i)}</option>`).join('');
  $('#changeFrom').innerHTML = opts; $('#changeTo').innerHTML = opts;
  $('#changeFrom').value = S.changeFrom; $('#changeTo').value = S.changeTo;
  const ctx = [
    ['modis_truecolor_2026-07-12', 'MODIS true colour · 12 Jul 2026'],
    ['modis_truecolor_2026-10-16', 'MODIS true colour · 16 Oct 2026'],
    ['modis_ndvi_2026-07-12', 'MODIS NDVI · Jul 2026'],
    ['modis_ndvi_2026-10-16', 'MODIS NDVI · Oct 2026'],
    ['sm', `${t('layer_sm')} (NISAR)`],
  ];
  $('#compareRight').innerHTML = ctx.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')
    + data.dates.map((d, i) => `<option value="date:${i}">NISAR · ${fmtDate(i)}</option>`).join('');
  $('#compareRight').value = S.compareRight;
  $('#placeList').replaceChildren(...data.places.map((p) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `${placeName(p)}<small>${p.lat.toFixed(2)}° N, ${p.lon.toFixed(2)}° E</small>`;
    b.addEventListener('click', () => {
      rmap.fly([p.lat, p.lon], p.id === 'caspian' ? 9 : 11);
      rmap.inspect({ lat: p.lat, lng: p.lon }, placeName(p));
    });
    li.append(b);
    return li;
  }));
}

// ---------- modes ----------
function setMode(m) {
  S.mode = m;
  document.querySelectorAll('.modes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('#storyView').hidden = m !== 'story';
  $('#exploreView').hidden = m !== 'explore';
  $('#dataView').hidden = m !== 'data';
  placeInspector();
  stopPlay();
  if (m === 'story') renderStep();
  if (m === 'explore') applyExplore();
  if (m === 'data') $('#dataView').innerHTML = dataPanelHtml(data, getLang());
  $('#panel').scrollTop = 0;
}

// ---------- language ----------
function applyLanguage(l) {
  setLang(l);
  store.set('ra_lang', l);
  applyStatic();
  rmap.setLabelLang(l);
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  buildTicks();
  buildKeys();
  fillSelects();
  if (S.mode === 'story') renderStep(false);
  if (S.mode === 'data') $('#dataView').innerHTML = dataPanelHtml(data, l);
  setDate(S.date);
  if (S.inspected) drawInspector();
  if (S.right) { $('#swipeLeftTag').textContent = layerName(S.left); $('#swipeRightTag').textContent = layerName(S.right); }
}

function buildTicks() {
  $('#ticks').innerHTML = [0, 4, 5, 8, 11, 14].map((i) => `<span>${fmtISO(data.dates[i].date, 'month')}</span>`).join('');
}

function buildKeys() {
  const k = [
    ['[ ]', t('k_prevnext')], ['P', t('k_play')], ['C', t('k_compare')], ['I', t('k_inspect')],
    ['B N', t('k_story')], ['← → ↑ ↓', t('k_arrows')], ['? H', t('k_help')], ['Esc', t('k_esc')],
  ];
  $('#keyList').innerHTML = k.map(([a, b]) => `<dt>${a.split(' ').map((x) => `<kbd>${x}</kbd>`).join(' ')}</dt><dd>${b}</dd>`).join('');
}

// ---------- wiring ----------
function wire() {
  document.querySelectorAll('.modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => applyLanguage(b.dataset.lang)));
  $('#prevStep').addEventListener('click', () => goStep(S.step - 1));
  $('#nextStep').addEventListener('click', () => goStep(S.step + 1));
  $('#stepDots').replaceChildren(...STEPS.map((st, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `${i + 1}. ${(st[getLang()] || st.en).title}`);
    b.addEventListener('click', () => goStep(i));
    li.append(b);
    return li;
  }));
  $('#dateRange').max = data.D - 1;
  $('#dateRange').addEventListener('input', (e) => setDate(Number(e.target.value), { fromUser: true }));
  $('#playBtn').addEventListener('click', () => (S.playing ? stopPlay() : play()));
  $('#inspClose').addEventListener('click', closeInspector);
  $('#helpBtn').addEventListener('click', () => $('#helpDlg').showModal());
  $('#helpClose').addEventListener('click', () => $('#helpDlg').close());

  document.querySelectorAll('input[name="layer"]').forEach((r) => r.addEventListener('change', () => { S.layer = r.value; applyExplore(); }));
  $('#changeFrom').addEventListener('change', (e) => { S.changeFrom = Number(e.target.value); applyExplore(); });
  $('#changeTo').addEventListener('change', (e) => { S.changeTo = Number(e.target.value); applyExplore(); });
  $('#changePol').addEventListener('change', (e) => { S.changePol = Number(e.target.value); applyExplore(); });
  $('#compareToggle').addEventListener('change', (e) => { S.compare = e.target.checked; applyExplore(); });
  $('#compareRight').addEventListener('change', (e) => { S.compareRight = e.target.value; applyExplore(); });
  $('#opacity').addEventListener('input', (e) => { S.opacity = Number(e.target.value) / 100; rmap.setOpacity(S.opacity); });

  // swipe drag + keyboard
  const knob = $('#swipeKnob');
  const wrap = document.querySelector('.map-wrap');
  let dragging = false;
  const toPct = (clientX) => { const r = wrap.getBoundingClientRect(); return ((clientX - r.left) / r.width) * 100; };
  knob.addEventListener('pointerdown', (e) => { dragging = true; knob.setPointerCapture(e.pointerId); e.preventDefault(); });
  knob.addEventListener('pointermove', (e) => { if (dragging) setSwipe(Math.max(0, Math.min(100, toPct(e.clientX)))); });
  knob.addEventListener('pointerup', () => { dragging = false; });
  knob.addEventListener('keydown', (e) => {
    const cur = Number(knob.getAttribute('aria-valuenow'));
    const step = e.shiftKey ? 10 : 5;
    const map = { ArrowLeft: cur - step, ArrowDown: cur - step, ArrowRight: cur + step, ArrowUp: cur + step, Home: 0, End: 100 };
    if (e.key in map) { e.preventDefault(); e.stopPropagation(); setSwipe(Math.max(0, Math.min(100, map[e.key]))); }
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    if (tag === 'select' || (tag === 'input' && e.target.type !== 'range' && e.target.type !== 'radio' && e.target.type !== 'checkbox')) return;
    // Physical key codes so shortcuts work on any keyboard layout (e.g. Azerbaijani).
    const code = e.code, k = e.key;
    if (code === 'BracketLeft' || k === '[') { setDate(S.date - 1, { fromUser: true }); e.preventDefault(); }
    else if (code === 'BracketRight' || k === ']') { setDate(S.date + 1, { fromUser: true }); e.preventDefault(); }
    else if (code === 'KeyP') { S.playing ? stopPlay() : play(); }
    else if (code === 'KeyC' && S.mode === 'explore') { S.compare = !S.compare; $('#compareToggle').checked = S.compare; applyExplore(); }
    else if (code === 'KeyN' && S.mode === 'story') goStep(S.step + 1);
    else if (code === 'KeyB' && S.mode === 'story') goStep(S.step - 1);
    else if (k === '?' || code === 'KeyH' || (code === 'Slash' && e.shiftKey)) $('#helpDlg').showModal();
    else if (k === 'Escape' && !$('#inspector').hidden) closeInspector();
  });

  window.addEventListener('resize', () => rmap.invalidate());

  const dlg = $('#startDlg');
  $('#startStory').addEventListener('click', () => { dlg.close(); setMode('story'); goStep(0); });
  $('#startExplore').addEventListener('click', () => { dlg.close(); setMode('explore'); $('#exploreTitle').setAttribute('tabindex', '-1'); $('#exploreTitle').focus(); });
  dlg.addEventListener('cancel', () => { setTimeout(() => $('#stepTitle').focus(), 0); });
}

async function init() {
  setLang(store.get('ra_lang', (navigator.language || '').startsWith('az') ? 'az' : 'en'));
  applyStatic();
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  $('#startDlg').showModal();
  try {
    data = await loadAll();
  } catch (err) {
    console.error(err);
    $('#stepBody').textContent = t('load_error');
    return;
  }
  rmap = new RadarMap($('#map'), data, { onInspect: inspect });
  rmap.setLabelLang(getLang());
  wire();
  buildTicks();
  buildKeys();
  fillSelects();
  $('#stepTitle').setAttribute('tabindex', '-1');
  placeInspector();
  renderStep();
}

init();
