"""Test the claim "the Caspian's radar brightness follows the wind".

Wind: NASA POWER hourly WS10M (MERRA-2 / GEOS-IT model, ~50 km) at 40.15 N, 50.30 E, interpolated to each
NISAR pass time (about 01:47 UTC). Radar: median sea HH sigma0 (dB) over the frame (water fraction > 0.95)
from assets/data/sme.json. Statistics: Pearson r with a two-sided permutation p-value (20,000 shuffles),
plus two confound checks: partial correlation controlling for the HV noise floor, and without 4 Oct 2026.

Outputs: assets/data/wind_test.json and assets/img/wind-vs-sea.svg (small scatter for the app).
"""
import json
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
LAT, LON = 40.15, 50.30
URL = ("https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=WS10M&community=RE"
       f"&longitude={LON}&latitude={LAT}&start=20251101&end=20261031&time-standard=UTC&format=JSON")
rng = np.random.default_rng(42)


def perm_r(x, y, n=20000):
    r0 = np.corrcoef(x, y)[0, 1]
    perm = np.array([np.corrcoef(x, rng.permutation(y))[0, 1] for _ in range(n)])
    return float(r0), float((np.abs(perm) >= abs(r0)).mean())


def resid(y, x):
    a = np.vstack([x, np.ones_like(x)]).T
    c, *_ = np.linalg.lstsq(a, y, rcond=None)
    return y - a @ c


def main():
    cache = ROOT / "data_raw" / "power_sea_hourly.json"
    if cache.exists():
        power = json.loads(cache.read_text())
    else:
        power = json.load(urllib.request.urlopen(URL, timeout=180))
    ws = power["properties"]["parameter"]["WS10M"]
    sme = json.loads((ROOT / "assets" / "data" / "sme.json").read_text(encoding="utf-8"))
    rows = []
    for d in sme["dates"]:
        t = d["start"]
        ymd, hh, mm = t[:10].replace("-", ""), int(t[11:13]), int(t[14:16])
        f = mm / 60
        w = (1 - f) * ws[f"{ymd}{hh:02d}"] + f * ws[f"{ymd}{hh + 1:02d}"]
        rows.append({"date": d["date"], "level": d["level"], "wind_ms": round(w, 2),
                     "sea_hh_db": d["sea_hh_median_db"], "noise_hv_db": d["sea_nesz_hv_median_db"]})
    W = np.array([r["wind_ms"] for r in rows])
    H = np.array([r["sea_hh_db"] for r in rows])
    N = np.array([r["noise_hv_db"] for r in rows])
    prov = np.array([r["level"] == "PROVISIONAL" for r in rows])
    no_storm = np.array([r["date"] != "2026-10-04" for r in rows])
    r_all, p_all = perm_r(W, H)
    r_prov, p_prov = perm_r(W[prov], H[prov])
    r_part, p_part = perm_r(resid(W, N), resid(H, N))
    r_ns, p_ns = perm_r(W[no_storm], H[no_storm])
    slope, icpt = np.polyfit(W, H, 1)
    stats = {
        "n": len(rows), "r": round(r_all, 2), "p": round(p_all, 3),
        "r_provisional": round(r_prov, 2), "p_provisional": round(p_prov, 3),
        "partial_r_given_noise": round(r_part, 2), "partial_p": round(p_part, 3),
        "r_without_4_oct": round(r_ns, 2), "p_without_4_oct": round(p_ns, 3),
        "slope_db_per_ms": round(float(slope), 2), "intercept_db": round(float(icpt), 2),
        "wind_min": float(W.min()), "wind_max": float(W.max()),
        "wind_source": "NASA POWER hourly WS10M (MERRA-2/GEOS-IT), 40.15N 50.30E, interpolated to pass time",
    }
    (ROOT / "assets" / "data" / "wind_test.json").write_text(json.dumps({"rows": rows, "stats": stats}, indent=1))

    # small scatter SVG (filled = provisional, hollow = beta) with the fitted line
    Wd, Hd, ml, mr, mt, mb = 440, 230, 46, 12, 14, 40
    x = lambda v: ml + (v - 0) / (11 - 0) * (Wd - ml - mr)
    y = lambda v: mt + (-14.0 - v) / (-14.0 - -17.0) * (Hd - mt - mb)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {Wd} {Hd}" role="img" '
             f'aria-label="Scatter plot: sea radar brightness HH against wind speed at the pass time for 15 dates; '
             f'brighter on windier mornings, r = {stats["r"]}." font-family="IBM Plex Mono, monospace" font-size="10">']
    for v in [-17, -16, -15, -14]:
        parts.append(f'<line x1="{ml}" x2="{Wd - mr}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="#e3e7e5"/>'
                     f'<text x="{ml - 6}" y="{y(v) + 3:.1f}" text-anchor="end" fill="#44515c">{v}</text>')
    for v in [0, 2, 4, 6, 8, 10]:
        parts.append(f'<text x="{x(v):.1f}" y="{Hd - mb + 14}" text-anchor="middle" fill="#44515c">{v}</text>')
    parts.append(f'<text x="{(ml + Wd - mr) / 2:.0f}" y="{Hd - 8}" text-anchor="middle" fill="#44515c">wind at pass time (m/s), NASA POWER</text>')
    parts.append(f'<text x="4" y="{mt - 2}" fill="#44515c">sea HH (dB)</text>')
    parts.append(f'<line x1="{x(1.5):.1f}" y1="{y(slope * 1.5 + icpt):.1f}" x2="{x(10.5):.1f}" y2="{y(slope * 10.5 + icpt):.1f}" '
                 f'stroke="#0b5f66" stroke-width="2" stroke-dasharray="5 4"/>')
    for r in rows:
        fill = "#a3237a" if r["level"] == "PROVISIONAL" else "#ffffff"
        parts.append(f'<circle cx="{x(r["wind_ms"]):.1f}" cy="{y(r["sea_hh_db"]):.1f}" r="4.5" fill="{fill}" stroke="#a3237a" stroke-width="2"/>')
    parts.append("</svg>")
    (ROOT / "assets" / "img" / "wind-vs-sea.svg").write_text("".join(parts), encoding="utf-8")
    print(json.dumps(stats, indent=1))


if __name__ == "__main__":
    main()
