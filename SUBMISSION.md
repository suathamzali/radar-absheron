# Space Apps 2026 — project page texts (paste into the form)

## Project name
Radar Absheron

## High-level project summary
Radar Absheron is an interactive, bilingual (English/Azerbaijani) web story map that makes NASA-ISRO NISAR radar readable for anyone. It plays 15 calibrated NISAR passes (Nov 2025–Oct 2026) over Baku, the Absheron peninsula and the Kura-Araz lowland, our home region. A swipe shows NISAR seeing the ground on 12 July 2026 while MODIS saw only clouds. A legend-first story teaches HH vs HV colours, then shows real findings: after the 3 October rain, soil moisture rose from 0.18 to 0.23 m³/m³ and the land's radar echo rose about 1.3 dB more than the stable city (checked against an urban control); the Caspian's brightness follows the wind; Baku stands still; and, honestly, the farmland barely changed at 200 m–1 km. Change maps and click-anywhere time series let users test their own questions. Every value states its units, source and limits. It matters because free, all-weather radar every 12 days can help farmers, water managers and students in Azerbaijan follow their land and water.

## Link to project demo
_30-second video link (YouTube/Drive, public)_

## Link to final project
_Live site (GitHub Pages) and repository link_

## Detailed project description
**What it does.** A story of 9 steps plus a free Explore mode:
1. Radar sees through clouds: swipe between MODIS true colour and NISAR, same day (12 Jul 2026).
2. How to read radar colours: magenta = HH (buildings, rough ground), green = HV (plant volume), dark = smooth water; four example places.
3. The dance: a time-lapse of 10 passes (18 Jun–16 Oct 2026) that plays once.
4. The radar felt the rain: soil moisture 22 Sep vs 4 Oct, NASA POWER rain, measured change (land median HH +2.3 dB, of which ~1 dB was scene-wide; land ≈ 1.3 dB above the urban control; soil moisture 0.18 → 0.23 m³/m³).
5. Kura-Araz lowland: an honest negative result. HV changed by only +0.6 dB (median) June–October at this scale; field-level monitoring needs NISAR's 10–20 m GCOV.
6. Absheron: a stable city and century-old oil fields, and why NISAR interferometry could watch ground motion there.
7. The Caspian dances with the wind: sea HH varies with wind; sea HV equals the instrument noise floor (≈ −20 dB). Over dry land, too, HV is often within 3 dB of the noise floor, and the app says so.
8. Find the change yourself: a dB change map (69 % of land cells brightened by > 1.5 dB after the rain), plus a season comparison.
9. Summary: what you saw, why it matters, what NISAR could do next here.
Explore: any layer (HH+HV colour, HH, HV, soil moisture, change map), any of 15 dates, swipe against MODIS true colour or NDVI, and click anywhere for a calibrated σ⁰ and soil-moisture time series with rain bars and a table alternative.

**How it works.** We downloaded NISAR L3 SME2 products (track 56, frame 22) from the ASF DAAC. A Python script reads σ⁰ HH/HV, the noise floor, soil moisture, quality flags and water fraction; converts σ⁰ to dB; uses one fixed colour stretch for every date so colours are comparable over time; and builds small web images and a ~1 km data cube. The browser app (vanilla JavaScript + Leaflet) draws the layers, swipe, time-lapse, change maps and charts.

**Benefits.** Anyone can read radar without training; numbers carry units and limits; it works through clouds and at night; it is keyboard and screen-reader friendly and bilingual; the method works for any NISAR frame.

**What we hope to achieve.** A first step towards a public NISAR viewer for Azerbaijan: crop and harvest maps with GCOV, flood maps of the Kura floodplain, and ground-motion monitoring around Baku's oil fields.

**Tools.** HTML, CSS, JavaScript (ES modules), Leaflet 1.9.4, Python 3 (h5py, numpy, Pillow, requests), GitHub Pages. Accessibility: native dialog, aria-live, reduced motion, 44 px touch targets.

## NASA data
- NISAR L3 Soil Moisture (SME2) PROVISIONAL V1, doi:10.5067/NIL3SME2-P1 (https://doi.org/10.5067/NIL3SME2-P1): calibrated σ⁰ HH/HV, noise-equivalent σ⁰, soil moisture, quality flags, water fraction; 10 dates, 18 Jun–16 Oct 2026.
- NISAR L3 SME2 BETA V1, doi:10.5067/NIL3SME2-B1 (https://doi.org/10.5067/NIL3SME2-B1): 5 winter dates, 26 Nov 2025–13 Jan 2026.
- NISAR L2 GCOV browse images via ASF Vertex (https://search.asf.alaska.edu/), used to design the colour composite; NISAR Data User Guide (https://nisar-docs.asf.alaska.edu/).
- NASA POWER daily precipitation (https://power.larc.nasa.gov/).
- NASA Terra/MODIS Corrected Reflectance True Colour and NDVI 8-day, NASA Blue Marble base map, via NASA GIBS (https://www.earthdata.nasa.gov/data/tools/gibs).

## Space agency partner data and other references
- ISRO is a NISAR mission partner (S-band, launch); we used the NASA-processed L-band products.
- Leaflet 1.9.4 (BSD-2-Clause), IBM Plex Sans/Mono (SIL Open Font License) via Google Fonts.
- No copyrighted images, music or text were used.

## Use of Super Intelligence (SI)
Yes. The team chose the challenge, the study area and the concept, and reviewed all texts. An AI coding assistant (Anthropic Claude) helped write the code, the data-processing scripts and draft texts, and searched the NISAR documentation. All data shown are real NASA / NASA-ISRO measurements or models; no images, audio or data were generated by AI. This is also stated in the README and in the app's "Data & method" panel.

## Checklist for the team (tick yourselves)
- [ ] Live link and repository open in a private window without login.
- [ ] Video ≤ 30 s, public link tested in a private window.
- [ ] All fields pasted; project submitted before 23:59 Baku time on 15 Nov.
