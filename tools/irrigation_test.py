"""Human driver test: does irrigation keep the Kura-Araz lowland wetter in summer?

Irrigation mask (another sensor): NASA MODIS Terra NDVI (8-day) for 12 Jul and 13 Aug 2026 from GIBS,
converted from colours to NDVI with the official GIBS colormap (MODIS_NDVI.xml). In a semi-arid lowland in
mid-summer, land that is still green (mean NDVI >= IRR) is almost only irrigated cropland; land with
NDVI <= DRY is dry steppe / semi-desert.

Soil moisture: NISAR L3 SME2 `soilMoisture`, only retrievals marked "recommended" (retrievalQualityFlag bit 0
== 0), water fraction < 0.2, inside the lowland box below, on the app's 250 m Web-Mercator grid.

Confound check: the gap should be large in the irrigation season and small in winter (BETA dates), when
nobody irrigates. If the gap were the same in winter, it would be soil type, not irrigation.

Outputs: assets/data/irrigation_test.json, assets/img/irrigation.svg, assets/data/context/irrigated_mask.webp
"""
import io
import json
import math
import re
import sys
import urllib.request
from pathlib import Path

import h5py
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_sme2_assets import E, N, OUT_W, S, W, target_index  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data_raw"
BOX = (47.60, 49.60, 39.20, 40.45)  # lon min, lon max, lat min, lat max: Kura-Araz and Shirvan plains
NDVI_DATES = ["2026-07-12", "2026-08-13"]
IRR, DRY = 0.45, 0.25
VARIANTS = [(0.40, 0.30), (0.45, 0.25), (0.50, 0.20)]


def merc_y(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def grid_latlon(h, w):
    yN, yS = merc_y(N), merc_y(S)
    lons = W + (np.arange(w) + 0.5) * (E - W) / w
    my = yN - (np.arange(h) + 0.5) * (yN - yS) / h
    lats = np.degrees(2 * np.arctan(np.exp(my)) - math.pi / 2)
    return lats, lons


def colormap():
    xml = (RAW / "ndvi_colormap.xml").read_text()
    rgb, val = [], []
    for m in re.finditer(r'<ColorMapEntry rgb="(\d+),(\d+),(\d+)"[^>]*?value="\[([-\d.]+),([-\d.]+)\)"', xml):
        lo, hi = float(m.group(4)), float(m.group(5))
        if lo < 0:
            continue
        rgb.append([int(m.group(1)), int(m.group(2)), int(m.group(3))])
        val.append((lo + hi) / 2)
    return np.array(rgb, float), np.array(val)


def ndvi_image(date, h, w):
    path = RAW / f"modis_ndvi_{date}.png"
    if not path.exists():
        R = 6378137
        x = lambda lon: R * math.radians(lon)
        y = lambda lat: R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
        url = ("https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0"
               f"&LAYERS=MODIS_Terra_NDVI_8Day&STYLES=&CRS=EPSG:3857&BBOX={x(W)},{y(S)},{x(E)},{y(N)}"
               f"&WIDTH={w}&HEIGHT={h}&FORMAT=image/png&TIME={date}&TRANSPARENT=TRUE")
        path.write_bytes(urllib.request.urlopen(url, timeout=120).read())
    im = np.asarray(Image.open(path).convert("RGBA")).astype(float)
    crgb, cval = colormap()
    flat = im[..., :3].reshape(-1, 3)
    out = np.empty(len(flat))
    dist = np.empty(len(flat))
    for i in range(0, len(flat), 200000):
        d = ((flat[i:i + 200000, None, :] - crgb[None, :, :]) ** 2).sum(-1)
        k = d.argmin(1)
        out[i:i + 200000] = cval[k]
        dist[i:i + 200000] = np.sqrt(d[np.arange(len(k)), k])
    out = out.reshape(im.shape[:2])
    out[im[..., 3] < 128] = np.nan
    exact = float((dist.reshape(im.shape[:2])[im[..., 3] >= 128] < 1).mean())
    return out, exact


def main():
    files = sorted((RAW / "sme2").glob("*.h5"))
    with h5py.File(files[0], "r") as h:
        g = h["science/LSAR/SME2/grids"]
        ri, ci, rv, cv, out_h = target_index(g["latitude"][:].astype(float), g["longitude"][:].astype(float))
        wf = g["ancillaryData/waterbodyFraction"][:].astype(float)[np.ix_(ri, ci)]
    H, Wd = out_h, OUT_W
    lats, lons = grid_latlon(H, Wd)
    inbox = ((lons[None, :] >= BOX[0]) & (lons[None, :] <= BOX[1]) & (lats[:, None] >= BOX[2]) & (lats[:, None] <= BOX[3]))
    land = inbox & (wf < 0.2) & rv[:, None] & cv[None, :]

    ndvis, exact = [], []
    for d in NDVI_DATES:
        a, ex = ndvi_image(d, H, Wd)
        ndvis.append(a)
        exact.append(round(ex, 3))
    ndvi = np.nanmean(np.stack(ndvis), axis=0)

    def masks(irr, dry):
        return land & (ndvi >= irr), land & (ndvi <= dry)

    irr_m, dry_m = masks(IRR, DRY)
    rows = []
    variants = {f"{a}/{b}": [] for a, b in VARIANTS}
    for f in files:
        m = re.search(r"_(\d{8})T\d{6}_\d{8}T\d{6}_([A-Z])\d{5}_", f.name)
        date = f"{m.group(1)[:4]}-{m.group(1)[4:6]}-{m.group(1)[6:]}"
        level = "BETA" if m.group(2) == "X" else "PROVISIONAL"
        with h5py.File(f, "r") as h:
            g = h["science/LSAR/SME2/grids"]
            sm = g["soilMoisture"][:].astype(float)
            sm[sm == g["soilMoisture"].attrs["_FillValue"]] = np.nan
            flag = g["retrievalQualityFlag"][:].astype(np.int32)
            ri, ci, rv, cv, _ = target_index(g["latitude"][:].astype(float), g["longitude"][:].astype(float))
            sm, flag = sm[np.ix_(ri, ci)], flag[np.ix_(ri, ci)]
        ok = np.isfinite(sm) & ((flag & 1) == 0)
        a, b = sm[irr_m & ok], sm[dry_m & ok]
        rows.append({"date": date, "level": level,
                     "sm_irrigated": round(float(np.median(a)), 3) if a.size else None,
                     "sm_dry": round(float(np.median(b)), 3) if b.size else None,
                     "diff": round(float(np.median(a) - np.median(b)), 3) if a.size and b.size else None,
                     "n_irr": int(a.size), "n_dry": int(b.size),
                     "kept_irr_pct": round(100 * a.size / max(1, int((irr_m & np.isfinite(sm)).sum())), 1)})
        for (ti, td) in VARIANTS:
            mi, md = masks(ti, td)
            x, y = sm[mi & ok], sm[md & ok]
            variants[f"{ti}/{td}"].append(round(float(np.median(x) - np.median(y)), 3) if x.size and y.size else None)
        print(rows[-1])

    summer = [r for r in rows if r["level"] == "PROVISIONAL" and r["date"] <= "2026-08-31"]
    winter = [r for r in rows if r["level"] == "BETA"]
    autumn = [r for r in rows if r["level"] == "PROVISIONAL" and r["date"] > "2026-08-31"]
    med = lambda rs: round(float(np.median([r["diff"] for r in rs if r["diff"] is not None])), 3)
    summary = {
        "box": BOX, "ndvi_dates": NDVI_DATES, "thresholds": {"irrigated_ndvi_min": IRR, "dry_ndvi_max": DRY},
        "ndvi_exact_colour_match": exact,
        "irrigated_cells_250m": int(irr_m.sum()), "dry_cells_250m": int(dry_m.sum()),
        "irrigated_area_km2": round(float(irr_m.sum()) * (250 * math.cos(math.radians(39.8))) ** 2 / 1e6),
        "gap_summer_median": med(summer), "gap_autumn_median": med(autumn), "gap_winter_median": med(winter),
        "summer_dates_irrigated_wetter": f"{sum(1 for r in summer if r['diff'] and r['diff'] > 0)}/{len(summer)}",
        "variants_gap_by_date": variants,
    }
    print(json.dumps(summary, indent=1))
    (ROOT / "assets" / "data" / "irrigation_test.json").write_text(json.dumps({"dates": rows, "summary": summary}, indent=1))

    # mask image for the map: teal = irrigated (green in summer), sand = dry steppe
    rgba = np.zeros((H, Wd, 4), np.uint8)
    rgba[irr_m] = (24, 150, 140, 210)
    rgba[dry_m] = (214, 176, 112, 150)
    Image.fromarray(rgba, "RGBA").save(ROOT / "assets" / "data" / "context" / "irrigated_mask.webp", quality=90)

    # chart: median soil moisture, irrigated vs dry, all dates (index axis, gap between Jan and Jun)
    Wc, Hc, ml, mr, mt, mb = 440, 220, 44, 10, 16, 44
    n = len(rows)
    xs = lambda i: ml + i * (Wc - ml - mr) / (n - 1)
    ys = lambda v: mt + (0.40 - v) / 0.40 * (Hc - mt - mb)
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {Wc} {Hc}" role="img" '
         f'aria-label="Line chart: median soil moisture of irrigated land versus dry land for 15 dates. In summer irrigated land is wetter by about {summary["gap_summer_median"]} cubic metres per cubic metre; in winter the gap is {summary["gap_winter_median"]}." '
         'font-family="IBM Plex Mono, monospace" font-size="10">']
    for v in [0, 0.1, 0.2, 0.3, 0.4]:
        p.append(f'<line x1="{ml}" x2="{Wc - mr}" y1="{ys(v):.1f}" y2="{ys(v):.1f}" stroke="#e3e7e5"/><text x="{ml - 6}" y="{ys(v) + 3:.1f}" text-anchor="end" fill="#44515c">{v:.1f}</text>')
    gx0, gx1 = xs(4) + 6, xs(5) - 6
    p.append(f'<rect x="{gx0:.1f}" y="{mt}" width="{gx1 - gx0:.1f}" height="{Hc - mt - mb}" fill="#eef0ee"/><text x="{(gx0 + gx1) / 2:.1f}" y="{mt + 12}" text-anchor="middle" fill="#44515c">no data</text>')
    for i, r in enumerate(rows):
        if i in (0, 4, 5, 9, 14):
            mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][int(r["date"][5:7]) - 1]
            p.append(f'<text x="{xs(i):.1f}" y="{Hc - mb + 14}" text-anchor="middle" fill="#44515c">{int(r["date"][8:])} {mon}</text>')
    for key, col, dash in (("sm_irrigated", "#18968c", ""), ("sm_dry", "#a8742a", "6 4")):
        for seg in (rows[:5], rows[5:]):
            off = 0 if seg is rows[:5] else 5
            pts = " ".join(f"{xs(off + j):.1f},{ys(r[key]):.1f}" for j, r in enumerate(seg) if r[key] is not None)
            p.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="2.5" stroke-dasharray="{dash}"/>')
        for i, r in enumerate(rows):
            if r[key] is not None:
                p.append(f'<circle cx="{xs(i):.1f}" cy="{ys(r[key]):.1f}" r="3.2" fill="#fff" stroke="{col}" stroke-width="2"/>')
    p.append(f'<text x="4" y="{mt - 4}" fill="#44515c">soil moisture (m³/m³)</text>')
    p.append(f'<line x1="{ml}" x2="{ml + 18}" y1="{Hc - 10}" y2="{Hc - 10}" stroke="#18968c" stroke-width="3"/><text x="{ml + 23}" y="{Hc - 6}" fill="#15212b">irrigated (green in July–Aug)</text>')
    p.append(f'<line x1="{ml + 230}" x2="{ml + 248}" y1="{Hc - 10}" y2="{Hc - 10}" stroke="#a8742a" stroke-width="3" stroke-dasharray="6 4"/><text x="{ml + 253}" y="{Hc - 6}" fill="#15212b">dry steppe</text>')
    p.append("</svg>")
    (ROOT / "assets" / "img" / "irrigation.svg").write_text("".join(p), encoding="utf-8")


if __name__ == "__main__":
    main()
