"""Download NISAR L3 SME2 granules for the Baku / Kura study area.

Run it yourself with your own Earthdata Login token (never commit it):

    PowerShell:  $env:EARTHDATA_TOKEN = "<your token>"; python tools/fetch_nisar_sme2.py
    Bash:        EARTHDATA_TOKEN=<your token> python tools/fetch_nisar_sme2.py

The token is read from the environment only; it is never printed or saved.
Files go to data_raw/ (git-ignored). About 0.1 GB per file.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import requests  # strips the Authorization header when a redirect leaves the host

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data_raw" / "sme2"
ASF_API = "https://api.daac.asf.alaska.edu/services/search/param"
# Ascending track 56, frame 22 covers Absheron and the Kura-Araz lowland.
PATH, FRAME = 56, 22


def list_granules():
    q = urllib.parse.urlencode({
        "platform": "NISAR", "processingLevel": "SME2",
        "intersectsWith": "POINT(49.85 40.38)", "output": "geojson", "maxResults": 200,
    })
    with urllib.request.urlopen(f"{ASF_API}?{q}", timeout=120) as r:
        feats = json.load(r)["features"]
    urls = sorted({f["properties"]["url"] for f in feats
                   if f["properties"].get("pathNumber") == PATH
                   and f["properties"].get("frameNumber") == FRAME})
    return urls


def main():
    token = os.environ.get("EARTHDATA_TOKEN", "").strip()
    if not token:
        import getpass
        token = getpass.getpass("Paste your Earthdata token (hidden), then press Enter: ").strip()
    if not token:
        sys.exit("No token given.")
    OUT.mkdir(parents=True, exist_ok=True)
    urls = list_granules()
    print(f"{len(urls)} SME2 granules found for track {PATH} frame {FRAME}")
    s = requests.Session()
    s.headers["Authorization"] = f"Bearer {token}"
    for i, url in enumerate(urls, 1):
        name = url.rsplit("/", 1)[-1]
        dest = OUT / name
        if dest.exists() and dest.stat().st_size > 1_000_000:
            print(f"[{i}/{len(urls)}] already here: {name}")
            continue
        print(f"[{i}/{len(urls)}] downloading {name}")
        with s.get(url, stream=True, timeout=600) as r:
            if r.status_code != 200 or "html" in r.headers.get("content-type", ""):
                sys.exit(f"Download failed (HTTP {r.status_code}). Check the token and that you "
                         "accepted the ASF data-use agreement at https://search.asf.alaska.edu once.")
            tmp = dest.with_suffix(".part")
            with open(tmp, "wb") as fh:
                for chunk in r.iter_content(1 << 20):
                    fh.write(chunk)
            tmp.replace(dest)
    print("Done. Tell Claude the download finished.")


if __name__ == "__main__":
    main()
