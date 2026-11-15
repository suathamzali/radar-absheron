// Loads the prepared NISAR (SME2) and NASA POWER assets and answers point queries.
export const V = '20261115g';

export async function loadAll() {
  const get = (p) => fetch(`${p}?v=${V}`).then((r) => {
    if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
    return r;
  });
  const [sme, cubeBuf, power, waterBuf] = await Promise.all([
    get('assets/data/sme.json').then((r) => r.json()),
    get('assets/data/sme_cube.bin').then((r) => r.arrayBuffer()),
    get('assets/data/power.json').then((r) => r.json()),
    get('assets/data/water_mask.bin').then((r) => r.arrayBuffer()),
  ]);
  const [D, H, W, C] = sme.cube_shape;
  const cube = new Uint8Array(cubeBuf);
  if (cube.length !== D * H * W * C) throw new Error('sme_cube.bin has an unexpected size');
  const water = new Uint8Array(waterBuf);
  return { sme, cube, water, power, D, H, W, C, dates: sme.dates, bounds: sme.bounds, places: sme.places };
}

const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

export function cellOf(bounds, H, W, lat, lon) {
  const yN = mercY(bounds.north), yS = mercY(bounds.south);
  const r = Math.floor(((yN - mercY(lat)) / (yN - yS)) * H);
  const c = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * W);
  if (r < 0 || c < 0 || r >= H || c >= W) return null;
  return { r, c };
}

/** Decode one uint8 value of channel ch (0 HH dB, 1 HV dB, 2 soil moisture). */
export function decode(data, ch, v) {
  if (v === 0) return null;
  const s = data.sme.scales;
  const [lo, hi] = [s.q_hh_db, s.q_hv_db, s.q_sm][ch];
  return lo + ((v - 1) / 254) * (hi - lo);
}

const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Calibrated series at a point (median of a 3x3 window of ~1 km cells). */
export function seriesAt(data, lat, lon) {
  const { cube, D, H, W, C, bounds } = data;
  const cell = cellOf(bounds, H, W, lat, lon);
  if (!cell) return null;
  const out = { hh: [], hv: [], sm: [] };
  for (let d = 0; d < D; d++) {
    const acc = [[], [], []];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = cell.r + dr, c = cell.c + dc;
        if (r < 0 || c < 0 || r >= H || c >= W) continue;
        const i = (((d * H + r) * W) + c) * C;
        for (let ch = 0; ch < 3; ch++) {
          const v = decode(data, ch, cube[i + ch]);
          if (v !== null) acc[ch].push(v);
        }
      }
    }
    out.hh.push(median(acc[0]));
    out.hv.push(median(acc[1]));
    out.sm.push(median(acc[2]));
  }
  if (out.hh.every((v) => v === null)) return null;
  return out;
}

/** Rain (mm) summed since the previous NISAR pass (max 12 days back), NASA POWER. */
export function rainBetweenPasses(power, siteId, passDates) {
  const site = power.sites[siteId];
  const idx = new Map(site.dates.map((d, i) => [d, i]));
  return passDates.map((pd, k) => {
    const end = idx.get(pd);
    if (end === undefined) return null;
    const prev = k === 0 ? undefined : idx.get(passDates[k - 1]);
    const start = prev === undefined || end - prev > 12 ? Math.max(0, end - 12) : prev + 1;
    let s = 0;
    for (let i = start; i <= end; i++) s += Math.max(0, site.rain_mm[i]);
    return Math.round(s * 10) / 10;
  });
}

export function nearestPowerSite(power, lat, lon) {
  let best = null, bd = Infinity;
  for (const [id, s] of Object.entries(power.sites)) {
    const d = (s.lat - lat) ** 2 + (s.lon - lon) ** 2;
    if (d < bd) { bd = d; best = id; }
  }
  return best;
}
