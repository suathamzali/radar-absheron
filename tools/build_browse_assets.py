"""Turn NISAR GCOV browse images (data_raw/browse) into web assets (assets/data).

NISAR QA browse colour rule for dual-pol HH/HV GCOV (isce-framework/nisarqa, gcov_reader.save_browse):
  red = HHHH, green = HVHV, blue = HHHH; each channel is clipped to percentiles, converted to dB and
  gamma-corrected per image. So channel values are RELATIVE within one image, not calibrated units.

Outputs
  assets/data/frames/gcov_<date>.webp   display image, Web Mercator rows, transparent no-data
  assets/data/cube.bin                  uint8 [date][row][col][HH,HV] at 1/CUBE_STEP resolution
  assets/data/frames.json               dates, bounds, cube shape, source URLs
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data_raw" / "browse"
OUT = ROOT / "assets" / "data"
FRAMES = OUT / "frames"

# LatLon browse bounds of track 56 frame 22 (from the product KML; all dates share one grid,
# verified with phase correlation: 0 px offset between every date).
SRC_W, SRC_E, SRC_S, SRC_N = 47.11512947435486, 51.37928520955171, 38.93713116963295, 42.129537048170945
# Study area: Kura-Araz lowland to the Absheron peninsula.
W, E, S, N = 47.55, 50.45, 39.10, 41.15
OUT_W = 1160          # output width in px (~250 m per px)
CUBE_STEP = 4         # cube resolution = OUT_W / CUBE_STEP


def merc_y(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def reproject(arr):
    """Crop a lat/lon-grid array to the study box and resample rows to Web Mercator (nearest)."""
    h, w = arr.shape[:2]
    lon_px = (SRC_E - SRC_W) / w
    lat_px = (SRC_N - SRC_S) / h
    yN, yS = merc_y(N), merc_y(S)
    out_h = round(OUT_W * (yN - yS) / math.radians(E - W))
    cols = np.clip(((W + (np.arange(OUT_W) + 0.5) * (E - W) / OUT_W - SRC_W) / lon_px).astype(int), 0, w - 1)
    my = yN - (np.arange(out_h) + 0.5) * (yN - yS) / out_h
    lats = np.degrees(2 * np.arctan(np.exp(my)) - math.pi / 2)
    rows = np.clip(((SRC_N - lats) / lat_px).astype(int), 0, h - 1)
    return arr[rows][:, cols]


def main():
    FRAMES.mkdir(parents=True, exist_ok=True)
    man = [m for m in json.loads((RAW / "manifest.json").read_text()) if m["product"] == "GCOV"]
    man.sort(key=lambda m: m["date"])
    cube, dates = [], []
    for m in man:
        rgb = np.asarray(Image.open(RAW / m["file"]).convert("RGB"))
        out = reproject(rgb)
        nodata = out.sum(axis=2) == 0
        rgba = np.dstack([out, np.where(nodata, 0, 255).astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(FRAMES / f"gcov_{m['date']}.webp", quality=80, method=6)
        small = out[CUBE_STEP // 2::CUBE_STEP, CUBE_STEP // 2::CUBE_STEP]
        hh, hv = small[..., 0].astype(np.uint8), small[..., 1].astype(np.uint8)
        nd = nodata[CUBE_STEP // 2::CUBE_STEP, CUBE_STEP // 2::CUBE_STEP]
        hh = np.where(nd, 0, np.maximum(hh, 1))  # 0 is reserved for no-data
        hv = np.where(nd, 0, np.maximum(hv, 1))
        cube.append(np.dstack([hh, hv]))
        dates.append({"date": m["date"], "start": m["start"], "scene": m["scene"],
                      "browse_url": m["browse_url"],
                      "collection": m["browse_url"].split("/")[4]})
        print(m["date"], out.shape, f"no-data {nodata.mean():.1%}")
    cube = np.stack(cube).astype(np.uint8)
    (OUT / "cube.bin").write_bytes(cube.tobytes())
    meta = {
        "bounds": {"west": W, "east": E, "south": S, "north": N},
        "image_size": [OUT_W, int(cube.shape[1] * CUBE_STEP)],
        "cube_shape": list(cube.shape),  # dates, rows, cols, 2 (HH, HV)
        "track": 56, "frame": 22, "direction": "ascending",
        "encoding": "uint8 relative brightness from NISAR QA browse (per-image percentile clip, dB, gamma); 0 = no data",
        "dates": dates,
    }
    (OUT / "frames.json").write_text(json.dumps(meta, indent=1))
    print("cube", cube.shape, f"{cube.nbytes/1e6:.1f} MB")


if __name__ == "__main__":
    main()
