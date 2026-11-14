/* global L */
// Leaflet map with a NISAR radar layer, an optional swipe-compare layer, and point inspection.
import { V } from './data.js?v=20261115e';
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const CONTEXT = {
  'modis_truecolor_2026-07-12': { file: 'assets/data/context/modis_truecolor_2026-07-12.webp', date: '2026-07-12' },
  'modis_truecolor_2026-10-16': { file: 'assets/data/context/modis_truecolor_2026-10-16.webp', date: '2026-10-16' },
  'modis_ndvi_2026-07-12': { file: 'assets/data/context/modis_ndvi_2026-07-12.webp', date: '2026-07-12' },
  'modis_ndvi_2026-10-16': { file: 'assets/data/context/modis_ndvi_2026-10-16.webp', date: '2026-10-16' },
};

// Diverging palette for change maps (brown = lower later, teal = higher later); BrBG endpoints.
const BROWN = [191, 129, 45], TEAL = [64, 176, 166];
export const CHANGE_DB = { hide: 1.5, full: 6 };

export class RadarMap {
  constructor(el, data, { onInspect } = {}) {
    this.data = data;
    this.onInspect = onInspect;
    const b = data.bounds;
    this.bounds = L.latLngBounds([b.south, b.west], [b.north, b.east]);
    this.cache = new Map();
    this.imgs = new Map();
    this.swipePct = 50;

    this.map = L.map(el, {
      zoomControl: true, minZoom: 6, maxZoom: 12, zoomSnap: 0.25,
      maxBounds: this.bounds.pad(0.6), keyboard: true, worldCopyJump: false,
    }).setView([40.15, 48.95], 8);
    el.setAttribute('aria-label', 'Map of Baku, the Absheron peninsula and the Kura-Araz lowland with NISAR radar layer');

    L.tileLayer(`${GIBS}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`, {
      maxNativeZoom: 8, maxZoom: 12,
      attribution: 'Base: NASA Blue Marble via <a href="https://www.earthdata.nasa.gov/gibs">NASA GIBS</a>',
    }).addTo(this.map);

    this.map.createPane('radarA').style.zIndex = 410;
    this.map.createPane('radarB').style.zIndex = 420;
    this.map.createPane('labels').style.zIndex = 640;
    this.map.createPane('pin').style.zIndex = 650;
    this.map.getPane('labels').style.pointerEvents = 'none';
    // Own labels (GIBS reference-label tiles rendered as black squares at some zooms).
    const LABELS = [
      ['Baku', 'Bakı', 40.409, 49.867, 'city'], ['Sumgait', 'Sumqayıt', 40.59, 49.67, 'town'],
      ['Shirvan', 'Şirvan', 39.94, 48.92, 'town'], ['Sabirabad', 'Sabirabad', 40.01, 48.48, 'town'],
      ['Saatly', 'Saatlı', 39.93, 48.37, 'town'], ['Kurdamir', 'Kürdəmir', 40.34, 48.16, 'town'],
      ['Ismayilli', 'İsmayıllı', 40.79, 48.15, 'town'], ['Shamakhi', 'Şamaxı', 40.63, 48.64, 'town'],
      ['Caspian Sea', 'Xəzər dənizi', 40.0, 50.25, 'sea'], ['Absheron', 'Abşeron', 40.52, 50.05, 'region'],
      ['Kura-Araz lowland', 'Kür-Araz ovalığı', 39.75, 48.2, 'region'], ['Greater Caucasus', 'Böyük Qafqaz', 40.98, 48.0, 'region'],
    ];
    this.labelLayer = L.layerGroup(LABELS.map(([en, az, lat, lon, kind]) => L.marker([lat, lon], {
      pane: 'labels', interactive: false, keyboard: false,
      icon: L.divIcon({ className: `map-label map-label-${kind}`, html: `<span data-en="${en}" data-az="${az}">${en}</span>`, iconSize: null }),
    })));
    this.labelLayer.addTo(this.map);
    this.map.attributionControl.addAttribution('Radar: NASA-ISRO NISAR via <a href="https://search.asf.alaska.edu/">ASF DAAC</a>');

    this.layerA = null;
    this.layerB = null;
    this.marker = null;
    this.opacity = 1;

    this.map.on('click', (e) => this.inspect(e.latlng));
    this.map.on('move zoom zoomend viewreset resize', () => this.updateClip());
    this.map.getContainer().addEventListener('keydown', (e) => {
      if (e.code === 'KeyI' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.inspect(this.map.getCenter());
      }
    });
  }

  // ---------- image sources ----------
  loadImage(url) {
    if (!this.imgs.has(url)) {
      this.imgs.set(url, new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error(`Image failed: ${url}`));
        im.src = url;
      }));
    }
    return this.imgs.get(url);
  }

  frameUrl(i) { return `assets/data/sme/rgb_${this.data.dates[i].date}.webp?v=${V}`; }

  smUrl(i) { return `assets/data/sme/sm_${this.data.dates[i].date}.webp?v=${V}`; }

  async sourceFor(desc) {
    const key = JSON.stringify(desc);
    if (this.cache.has(key)) return this.cache.get(key);
    let url;
    if (desc.kind === 'radar' && desc.pol === 'composite') url = this.frameUrl(desc.date);
    else if (desc.kind === 'radar') url = await this.singlePol(desc.date, desc.pol === 'hh' ? 0 : 1);
    else if (desc.kind === 'sm') url = this.smUrl(desc.date);
    else if (desc.kind === 'change') url = this.changeImage(desc.from, desc.to, desc.pol ?? 1);
    else if (desc.kind === 'ctx') url = CONTEXT[desc.id].file;
    this.cache.set(key, url);
    return url;
  }

  async singlePol(i, ch) {
    const im = await this.loadImage(this.frameUrl(i));
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0);
    const px = cx.getImageData(0, 0, cv.width, cv.height);
    const a = px.data;
    for (let k = 0; k < a.length; k += 4) {
      const v = a[k + ch];
      a[k] = v; a[k + 1] = v; a[k + 2] = v;
    }
    cx.putImageData(px, 0, 0);
    return new Promise((res) => cv.toBlob((b) => res(URL.createObjectURL(b)), 'image/png'));
  }

  /** Difference in dB of one polarization between two dates, from the ~1 km cube. */
  changeImage(from, to, ch) {
    const { cube, H, W, C } = this.data;
    const s = this.data.sme.scales;
    const step = ((ch === 0 ? s.q_hh_db : s.q_hv_db)[1] - (ch === 0 ? s.q_hh_db : s.q_hv_db)[0]) / 254;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const cx = cv.getContext('2d');
    const img = cx.createImageData(W, H);
    const a = img.data;
    const T = CHANGE_DB.hide, FULL = CHANGE_DB.full;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const i0 = (((from * H + r) * W) + c) * C;
        const i1 = (((to * H + r) * W) + c) * C;
        const o = (r * W + c) * 4;
        if (cube[i0 + ch] === 0 || cube[i1 + ch] === 0 || this.data.water[r * W + c]) { a[o + 3] = 0; continue; }
        const d = (cube[i1 + ch] - cube[i0 + ch]) * step;
        const m = Math.abs(d);
        if (m < T) { a[o + 3] = 0; continue; }
        const t = Math.min(1, (m - T) / (FULL - T));
        const col = d > 0 ? TEAL : BROWN;
        a[o] = col[0]; a[o + 1] = col[1]; a[o + 2] = col[2];
        a[o + 3] = Math.round(130 + 125 * t);
      }
    }
    cx.putImageData(img, 0, 0);
    return cv.toDataURL('image/png');
  }

  // ---------- layers ----------
  async setLeft(desc) {
    this.descA = desc;
    const url = await this.sourceFor(desc);
    if (this.descA !== desc) return; // a newer request won
    this.layerA = this.swapOverlay(this.layerA, url, 'radarA', desc);
  }

  async setRight(desc) {
    this.descB = desc;
    if (!desc) {
      if (this.layerB) { this.map.removeLayer(this.layerB); this.layerB = null; }
      this.map.getPane('radarB').style.clip = '';
      return;
    }
    const url = await this.sourceFor(desc);
    if (this.descB !== desc) return;
    this.layerB = this.swapOverlay(this.layerB, url, 'radarB', desc);
    this.updateClip();
  }

  swapOverlay(layer, url, pane, desc) {
    const opacity = desc.kind === 'ctx' ? 1 : this.opacity;
    const cls = desc.kind === 'change' ? 'radar-change' : 'radar-img';
    if (layer) {
      layer.setUrl(url);
      layer.setOpacity(opacity);
      return layer;
    }
    return L.imageOverlay(url, this.bounds, { pane, opacity, className: cls, alt: '' }).addTo(this.map);
  }

  setOpacity(v) {
    this.opacity = v;
    if (this.layerA && this.descA?.kind !== 'ctx') this.layerA.setOpacity(v);
    if (this.layerB && this.descB?.kind !== 'ctx') this.layerB.setOpacity(v);
  }

  preload(indices) {
    indices.forEach((i) => this.loadImage(this.frameUrl(i)).catch(() => {}));
  }

  // ---------- swipe ----------
  setSwipe(pct) {
    this.swipePct = Math.max(0, Math.min(100, pct));
    this.updateClip();
  }

  updateClip() {
    const pane = this.map.getPane('radarB');
    if (!this.layerB) { pane.style.clip = ''; return; }
    const size = this.map.getSize();
    const nw = this.map.containerPointToLayerPoint([0, 0]);
    const se = this.map.containerPointToLayerPoint(size);
    const x = nw.x + (size.x * this.swipePct) / 100;
    pane.style.clip = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${x}px)`;
  }

  // ---------- navigation & inspection ----------
  fly(center, zoom) {
    if (reduceMotion()) this.map.setView(center, zoom, { animate: false });
    else this.map.flyTo(center, zoom, { duration: 1.2 });
  }

  inspect(latlng, label) {
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = L.circleMarker(latlng, {
      pane: 'pin', radius: 9, color: '#15212b', weight: 3, fillColor: '#ffffff', fillOpacity: 0.85, interactive: false,
    }).addTo(this.map);
    this.onInspect?.(latlng, label);
  }

  clearMarker() {
    if (this.marker) { this.map.removeLayer(this.marker); this.marker = null; }
  }

  invalidate() { this.map.invalidateSize(); this.updateClip(); }

  setLabelLang(lang) {
    this.map.getContainer().querySelectorAll('.map-label span').forEach((s) => {
      s.textContent = s.dataset[lang] || s.dataset.en;
      s.lang = lang;
    });
  }
}
