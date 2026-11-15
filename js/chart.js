// Small accessible SVG line chart with optional rain bars, plus a table alternative.
const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
}

import { fmtISO } from './i18n.js?v=20261115p';
const fmtDate = (d, lang) => fmtISO(d, 'short', lang);

/**
 * opts: { dates, series: [{label, color, dash, values}], yMin, yMax, yLabel,
 *         bars: {label, values, unit, color} | null, current: index, title, lang, digits }
 */
export function renderChart(host, tableHost, opts) {
  const { dates, series, yMin, yMax, yLabel, bars, current, title, lang = 'en', digits = 0, gaps = [], gapLabel = 'no data' } = opts;
  const gapSet = new Set(gaps);
  const Wd = 440, Hd = bars ? 236 : 196;
  const m = { l: 40, r: 10, t: 14, b: bars ? 74 : 34 };
  const pw = Wd - m.l - m.r, ph = (bars ? 150 : 196) - m.t - 34;
  const x = (i) => m.l + (dates.length === 1 ? pw / 2 : (i * pw) / (dates.length - 1));
  const y = (v) => m.t + ph - ((v - yMin) / (yMax - yMin)) * ph;

  const svg = el('svg', { viewBox: `0 0 ${Wd} ${Hd}`, role: 'img', 'aria-label': title || 'Time series chart' });
  // grid + y axis
  for (let k = 0; k <= 4; k++) {
    const v = yMin + ((yMax - yMin) * k) / 4;
    svg.append(el('line', { x1: m.l, x2: Wd - m.r, y1: y(v), y2: y(v), class: 'grid' }));
    svg.append(el('text', { x: m.l - 6, y: y(v) + 3, 'text-anchor': 'end', class: 'axis' }, v.toFixed(digits)));
  }
  svg.append(el('text', { x: 4, y: m.t - 4, class: 'axis' }, yLabel));
  // x labels (every other)
  dates.forEach((d, i) => {
    if (i % 2 && i !== dates.length - 1) return;
    const anchor = i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle';
    svg.append(el('text', { x: x(i) + (i === 0 ? -4 : i === dates.length - 1 ? 4 : 0), y: m.t + ph + 14, 'text-anchor': anchor, class: 'axis' }, fmtDate(d, lang)));
  });
  for (const g of gaps) {
    const x0 = x(g) + 6, x1 = x(g + 1) - 6;
    svg.append(el('rect', { x: x0, y: m.t, width: Math.max(2, x1 - x0), height: ph, fill: '#eef0ee' }));
    svg.append(el('text', { x: (x0 + x1) / 2, y: m.t + 12, 'text-anchor': 'middle', class: 'axis' }, gapLabel));
  }
  if (current !== undefined && current !== null) {
    svg.append(el('line', { x1: x(current), x2: x(current), y1: m.t, y2: m.t + ph, stroke: '#c25700', 'stroke-width': 2, 'stroke-dasharray': '3 3' }));
  }
  // lines
  for (const s of series) {
    let d = '', pen = false;
    s.values.forEach((v, i) => {
      if (v === null || v === undefined || Number.isNaN(v)) { pen = false; return; }
      if (gapSet.has(i - 1)) pen = false;
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(Math.max(yMin, Math.min(yMax, v))).toFixed(1)}`;
      pen = true;
    });
    svg.append(el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2.5, 'stroke-dasharray': s.dash || '', 'stroke-linejoin': 'round' }));
    s.values.forEach((v, i) => {
      if (v === null || v === undefined || Number.isNaN(v)) return;
      const yy = y(Math.max(yMin, Math.min(yMax, v)));
      const shape = s.marker === 'square'
        ? el('rect', { x: x(i) - 3.5, y: yy - 3.5, width: 7, height: 7, fill: s.color })
        : el('circle', { cx: x(i), cy: yy, r: 3.6, fill: '#fff', stroke: s.color, 'stroke-width': 2 });
      svg.append(shape);
    });
  }
  // legend
  let lx = m.l;
  const ly = Hd - (bars ? 8 : 6);
  for (const s of series) {
    svg.append(el('line', { x1: lx, x2: lx + 18, y1: ly - 4, y2: ly - 4, stroke: s.color, 'stroke-width': 3, 'stroke-dasharray': s.dash || '' }));
    const t = el('text', { x: lx + 23, y: ly, class: 'axis' }, s.label);
    svg.append(t);
    lx += 30 + s.label.length * 6.1;
  }
  // rain bars
  if (bars) {
    const top = m.t + ph + 26, bh = 34;
    const max = Math.max(5, ...bars.values.filter((v) => v !== null));
    svg.append(el('text', { x: 4, y: top - 3, class: 'axis' }, `${bars.label} (max ${max.toFixed(0)} ${bars.unit})`));
    bars.values.forEach((v, i) => {
      if (v === null) return;
      const h = (v / max) * bh;
      svg.append(el('rect', { x: x(i) - 7, y: top + bh - h, width: 14, height: Math.max(h, 0.8), fill: bars.color || '#3a6ea5' }));
    });
    svg.append(el('line', { x1: m.l, x2: Wd - m.r, y1: top + bh, y2: top + bh, class: 'grid' }));
  }
  host.replaceChildren(svg);

  // table alternative
  if (tableHost) {
    const tb = document.createElement('table');
    const head = document.createElement('tr');
    [lang === 'az' ? 'Tarix' : 'Date', ...series.map((s) => s.label), ...(bars ? [`${bars.label} (${bars.unit})`] : [])]
      .forEach((h) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; head.append(th); });
    const thead = document.createElement('thead'); thead.append(head); tb.append(thead);
    const body = document.createElement('tbody');
    dates.forEach((d, i) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = d; tr.append(th);
      series.forEach((s) => { const td = document.createElement('td'); const v = s.values[i]; td.textContent = v === null || v === undefined ? '–' : v.toFixed(digits); tr.append(td); });
      if (bars) { const td = document.createElement('td'); td.textContent = bars.values[i] ?? '–'; tr.append(td); }
      body.append(tr);
    });
    tb.append(body);
    tableHost.replaceChildren(tb);
  }
}
