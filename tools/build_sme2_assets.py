"""Turn NISAR L3 SME2 HDF5 files (data_raw/sme2) into calibrated web assets (assets/data/sme).

SME2 contains, on a 200 m EASE-Grid 2.0 (1-D latitude/longitude vectors per row/column):
  radarData/frequencyA/sigma0HH, sigma0HV            linear sigma-nought (unitless power ratio)
  radarData/frequencyA/noiseEquivalentBackscatterHV  noise floor, dB
  soilMoisture, soilMoistureUncertainty              m3/m3 (PROVISIONAL / BETA, not validated)
  retrievalQualityFlag                               bit 0: 0 = retrieval recommended
  ancillaryData/landCover, waterbodyFraction

Outputs (all on the same Web-Mercator grid as the map overlay):
  assets/data/sme/rgb_<date>.webp   R=HH, G=HV, B=HH with ONE fixed dB stretch for all dates
  assets/data/sme/sm_<date>.webp    soil moisture colour map, fixed 0-0.45 m3/m3 scale
  assets/data/sme_cube.bin          uint8 [date][row][col][HH, HV, SM]; 0 = no data
  assets/data/sme.json              dates, quality level, scales, place series in real units
"""
import json
import math
import re
from pathlib import Path

import h5py
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data_raw" / "sme2"
OUT = ROOT / "assets" / "data"
IMG = OUT / "sme"

W, E, S, N = 47.55, 50.45, 39.10, 41.15
OUT_W = 1160
STEP = 4

# One fixed display stretch for every date (chosen from land percentiles, printed below).
HH_DB = (-20.0, -3.0)
HV_DB = (-24.0, -9.0)
SM_MAX = 0.45
# Cube quantization (uint8, 0 = no data)
Q_HH = (-35.0, 5.0)
Q_HV = (-40.0, 0.0)
Q_SM = (0.0, 0.6)

PLACES = json.loads((ROOT / "tools" / "places.json").read_text())


def merc_y(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def target_index(lat_vec, lon_vec):
    yN, yS = merc_y(N), merc_y(S)
    out_h = round(OUT_W * (yN - yS) / math.radians(E - W))
    lons = W + (np.arange(OUT_W) + 0.5) * (E - W) / OUT_W
    my = yN - (np.arange(out_h) + 0.5) * (yN - yS) / out_h
    lats = np.degrees(2 * np.arctan(np.exp(my)) - math.pi / 2)
    # lat_vec decreases (north -> south); lon_vec increases
    dlat = abs(lat_vec[1] - lat_vec[0]) / 2
    dlon = abs(lon_vec[1] - lon_vec[0]) / 2
    ri = np.searchsorted(-lat_vec, -lats)
    ri = np.clip(ri, 0, len(lat_vec) - 1)
    ri = np.where(np.abs(lat_vec[np.clip(ri - 1, 0, None)] - lats) < np.abs(lat_vec[ri] - lats), np.clip(ri - 1, 0, None), ri)
    ci = np.clip(np.searchsorted(lon_vec, lons), 0, len(lon_vec) - 1)
    ci = np.where(np.abs(lon_vec[np.clip(ci - 1, 0, None)] - lons) < np.abs(lon_vec[ci] - lons), np.clip(ci - 1, 0, None), ci)
    rvalid = (lats <= lat_vec.max() + dlat) & (lats >= lat_vec.min() - dlat)
    cvalid = (lons <= lon_vec.max() + dlon) & (lons >= lon_vec.min() - dlon)
    return ri, ci, rvalid, cvalid, out_h


def to_db(x):
    with np.errstate(divide="ignore", invalid="ignore"):
        return 10 * np.log10(x)


def quant(x, lo, hi):
    q = np.clip(np.round(1 + (x - lo) / (hi - lo) * 254), 1, 255)
    return np.where(np.isfinite(x), q, 0).astype(np.uint8)


def sm_colour(sm):
    """Dry = sandy brown, wet = deep blue (monotonic lightness; readable for colour-blind users)."""
    stops = np.array([[0.00, 222, 196, 148], [0.10, 196, 168, 108], [0.20, 120, 170, 160],
                      [0.30, 44, 127, 184], [0.45, 23, 52, 125]])
    v = np.clip(sm, 0, SM_MAX)
    rgb = np.stack([np.interp(v, stops[:, 0], stops[:, k]) for k in (1, 2, 3)], axis=-1)
    return rgb.astype(np.uint8)


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    files = sorted(RAW.glob("*.h5"))
    dates, cube = [], []
    land_hh, land_hv = [], []
    place_series = {p["id"]: {"hh_db": [], "hv_db": [], "sm": [], "sm_ok": []} for p in PLACES}
    for f in files:
        m = re.search(r"_(\d{8})T(\d{6})_\d{8}T\d{6}_([A-Z]\d{5})_", f.name)
        d = f"{m.group(1)[:4]}-{m.group(1)[4:6]}-{m.group(1)[6:]}"
        crid = m.group(3)
        with h5py.File(f, "r") as h:
            g = h["science/LSAR/SME2/grids"]
            lat = g["latitude"][:].astype(float)
            lon = g["longitude"][:].astype(float)
            ri, ci, rv, cv, out_h = target_index(lat, lon)
            take = lambda a: a[np.ix_(ri, ci)]
            def read(path):
                ds = g[path]
                a = ds[:].astype(np.float32)
                fv = ds.attrs.get("_FillValue")
                if fv is not None:
                    a[a == fv] = np.nan
                return a
            hh = take(read("radarData/frequencyA/sigma0HH"))
            hv = take(read("radarData/frequencyA/sigma0HV"))
            nesz = take(read("radarData/frequencyA/noiseEquivalentBackscatterHV"))
            sm = take(read("soilMoisture"))
            flag = take(g["retrievalQualityFlag"][:].astype(np.int32))
            ident = h["science/LSAR/identification"]
            doi = ident["productDoi"][()].decode() if "productDoi" in ident else ""
            ptype = ident["processingType"][()].decode() if "processingType" in ident else ""
            start = ident["zeroDopplerStartTime"][()].decode()
            if not dates:
                lc = take(g["ancillaryData/landCover"][:].astype(np.int32))
                wf = take(read("ancillaryData/waterbodyFraction"))
        outside = ~(rv[:, None] & cv[None, :])
        hh[outside] = np.nan; hv[outside] = np.nan; sm[outside] = np.nan
        hh_db, hv_db = to_db(hh), to_db(hv)
        near_noise = hv_db < (nesz + 3.0)  # HV within 3 dB of the noise floor
        recommended = (flag & 1) == 0
        land = np.isfinite(hh_db) & (wf < 0.5)
        land_hh.append(np.nanpercentile(hh_db[land], [2, 50, 98]))
        land_hv.append(np.nanpercentile(hv_db[land], [2, 50, 98]))

        # calibrated composite with ONE fixed stretch
        r = np.clip((hh_db - HH_DB[0]) / (HH_DB[1] - HH_DB[0]), 0, 1)
        gch = np.clip((hv_db - HV_DB[0]) / (HV_DB[1] - HV_DB[0]), 0, 1)
        rgb = (np.nan_to_num(np.dstack([r, gch, r])) * 255).astype(np.uint8)
        alpha = np.where(np.isfinite(hh_db) & np.isfinite(hv_db), 255, 0).astype(np.uint8)
        Image.fromarray(np.dstack([rgb, alpha]), "RGBA").save(IMG / f"rgb_{d}.webp", quality=82, method=6)

        smc = sm_colour(np.nan_to_num(sm))
        sa = np.where(np.isfinite(sm), np.where(recommended, 235, 120), 0).astype(np.uint8)
        Image.fromarray(np.dstack([smc, sa]), "RGBA").save(IMG / f"sm_{d}.webp", quality=85, method=6)

        sl = (slice(STEP // 2, None, STEP), slice(STEP // 2, None, STEP))
        cube.append(np.dstack([quant(hh_db[sl], *Q_HH), quant(hv_db[sl], *Q_HV), quant(sm[sl], *Q_SM)]))

        # place series (3x3 cells of 250 m, median in dB)
        for p in PLACES:
            yN, yS = merc_y(N), merc_y(S)
            rr = int((yN - merc_y(p["lat"])) / (yN - yS) * out_h)
            cc = int((p["lon"] - W) / (E - W) * OUT_W)
            win = (slice(max(rr - 1, 0), rr + 2), slice(max(cc - 1, 0), cc + 2))
            ps = place_series[p["id"]]
            def med(a):
                v = a[win][np.isfinite(a[win])]
                return round(float(np.median(v)), 2) if v.size else None
            ps["hh_db"].append(med(hh_db)); ps["hv_db"].append(med(hv_db))
            sv = sm[win]; ok = recommended[win] & np.isfinite(sv)
            ps["sm"].append(round(float(np.median(sv[np.isfinite(sv)])), 3) if np.isfinite(sv).any() else None)
            ps["sm_ok"].append(bool(ok.any()))
        level = "BETA" if crid.startswith("X") else ("PROVISIONAL" if crid.startswith("P") else crid)
        dates.append({"date": d, "start": start, "crid": crid, "level": level, "doi": doi,
                      "processing": ptype, "file": f.name,
                      "near_noise_land_pct": round(float(near_noise[land].mean() * 100), 1),
                      "land_hh_median_db": round(float(np.nanmedian(hh_db[land])), 2),
                      "land_hv_median_db": round(float(np.nanmedian(hv_db[land])), 2),
                      "land_sm_median": round(float(np.nanmedian(sm[land & recommended])), 3) if (land & recommended & np.isfinite(sm)).any() else None,
                      "sea_hv_median_db": round(float(np.nanmedian(hv_db[wf > 0.95])), 2) if (wf > 0.95).any() else None,
                      "sea_nesz_hv_median_db": round(float(np.nanmedian(nesz[wf > 0.95])), 2) if (wf > 0.95).any() else None,
                      "sea_hh_median_db": round(float(np.nanmedian(hh_db[wf > 0.95])), 2) if (wf > 0.95).any() else None})
        print(d, crid, level, "HH land p2/50/98", np.round(land_hh[-1], 1), "HV", np.round(land_hv[-1], 1))

    cube = np.stack(cube)
    (OUT / "sme_cube.bin").write_bytes(cube.tobytes())
    # water mask on the cube grid: 1 = mostly water (waterbodyFraction > 0.5)
    wmask = (np.nan_to_num(wf, nan=1.0)[STEP // 2::STEP, STEP // 2::STEP] > 0.5).astype(np.uint8)
    (OUT / "water_mask.bin").write_bytes(wmask.tobytes())
    lc_vals, lc_counts = np.unique(lc[np.isfinite(wf)], return_counts=True)
    meta = {
        "bounds": {"west": W, "east": E, "south": S, "north": N},
        "cube_shape": list(cube.shape),
        "track": 56, "frame": 22, "direction": "ascending",
        "scales": {"rgb_hh_db": HH_DB, "rgb_hv_db": HV_DB, "sm_max": SM_MAX,
                   "q_hh_db": Q_HH, "q_hv_db": Q_HV, "q_sm": Q_SM},
        "encoding": "sme_cube.bin uint8 v -> lo + (v-1)/254*(hi-lo); 0 = no data. Channels: HH dB, HV dB, soil moisture m3/m3.",
        "dates": dates,
        "places": [{"id": p["id"], "name": p["name"], "lon": p["lon"], "lat": p["lat"], **place_series[p["id"]]} for p in PLACES],
        "land_cover_codes_present": {int(v): int(c) for v, c in zip(lc_vals, lc_counts)},
    }
    (OUT / "sme.json").write_text(json.dumps(meta, indent=1))
    print("cube", cube.shape, f"{cube.nbytes/1e6:.1f} MB")


if __name__ == "__main__":
    main()
