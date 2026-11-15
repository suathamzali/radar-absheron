// "Data & method" panel. Kept in English as the reference text (accuracy); a short Azerbaijani note on top.
export function dataPanelHtml(data, lang) {
  const n = data.dates.length;
  const prov = data.dates.filter((d) => d.level === 'PROVISIONAL');
  const beta = data.dates.filter((d) => d.level === 'BETA');
  const sc = data.sme.scales;
  const az = lang === 'az'
    ? `<div class="plain"><p><strong>Qısaca:</strong> Bu saytdakı hər rəqəm NASA-nın pulsuz, açıq məlumatından gəlir. Radar şəkilləri NASA və Hindistanın NISAR peykindəndir; yağış və külək NASA POWER-dən, adi foto və yaşıllıq NASA MODIS-dəndir.</p>
<p>Hər tarixi eyni şkalada göstəririk ki, rənglər müqayisə oluna bilsin. Əsas iddiaları ikinci mənbə ilə yoxlamışıq (yağış, külək, adi foto, şəhər). Məlumat hələ "ilkin" versiyadır: istiqamət verir, amma yerində ölçməni əvəz etmir. Aşağıdakı texniki hissə dəqiqlik üçün ingilis dilindədir.</p></div>`
    : `<div class="plain"><p><strong>In short:</strong> every number on this site comes from NASA's free, open data. The radar pictures are from NISAR, a NASA and India (ISRO) satellite; rain and wind come from NASA POWER; the ordinary photos and greenness come from NASA MODIS.</p>
<p>We show every date on the same scale so colours can be compared, and we checked the main claims against a second source (rain, wind, photos, the city). The data are still an early "provisional" version: a good guide, but not a replacement for measuring on the ground. The technical details follow below.</p></div>`;
  return `${az}
<h2 id="dataTitle">Data &amp; method</h2>
<p>Every number in Radar Absheron comes from NASA (or NASA-ISRO) open data. Here is what each one is, how we processed it, and what it cannot tell you.</p>

<h3>1. NISAR radar (core data)</h3>
<ul>
<li><strong>NISAR L3 Soil Moisture (SME2)</strong>, track 56, frame 22 (ascending, ~05:47 Baku time), 200 m EASE-Grid 2.0.
${prov.length} PROVISIONAL products (${prov[0].date} to ${prov[prov.length - 1].date}, doi:10.5067/NIL3SME2-P1) and
${beta.length} BETA products (${beta[0].date} to ${beta[beta.length - 1].date}, doi:10.5067/NIL3SME2-B1).
Downloaded from the <a href="https://search.asf.alaska.edu/#/?dataset=NISAR" target="_blank" rel="noopener">ASF DAAC</a> with an Earthdata Login.</li>
<li>Layers used: <code>sigma0HH</code>, <code>sigma0HV</code> (calibrated backscatter, linear → dB), <code>noiseEquivalentBackscatterHV</code> (noise floor), <code>soilMoisture</code> (m³/m³), <code>retrievalQualityFlag</code> (bit 0 = recommended), <code>waterbodyFraction</code>.</li>
<li>SME2 is generated from NISAR L2 GCOV products (see the <a href="https://nisar-docs.asf.alaska.edu/" target="_blank" rel="noopener">NISAR Data User Guide</a>). We also checked the GCOV browse images of the same track (QA colour rule: red = HH, green = HV, blue = HH) to design the colour composite.</li>
</ul>

<h3>2. Context data</h3>
<ul>
<li><strong>NASA POWER</strong> daily precipitation (PRECTOTCORR), 1 Nov 2025 – 31 Oct 2026, for two points: Baku area (40.40° N, 49.85° E) and the Kura-Araz lowland (39.95° N, 48.45° E). A MERRA-2-based reanalysis on a ~50 km grid: an area estimate, not a rain gauge. <a href="https://power.larc.nasa.gov/" target="_blank" rel="noopener">power.larc.nasa.gov</a></li>
<li><strong>NASA POWER hourly wind</strong> (WS10M) at 40.15° N, 50.30° E, interpolated to each pass time (01:47 UTC), to test whether sea brightness follows the wind (tools/wind_test.py: r = 0.63 over 15 passes, permutation p ≈ 0.01; partial r = 0.67 after removing the noise-floor drift).</li>
<li><strong>Irrigation test</strong> (tools/irrigation_test.py): MODIS NDVI (12 Jul + 13 Aug 2026, values from the GIBS colormap) marks land still green in a dry summer (NDVI ≥ 0.45, about 6,600 km²) as irrigated and NDVI ≤ 0.25 as dry steppe, inside 47.6–49.6° E, 39.2–40.45° N. NISAR soil moisture (recommended retrievals) was higher on irrigated land on all 15 dates (+0.07 m³/m³ in summer), but almost as much in winter (+0.06), so the irrigation water itself cannot yet be separated from soil and groundwater.</li>
<li><strong>NASA Terra/MODIS</strong> Corrected Reflectance (True Colour) for 12 Jul and 16 Oct 2026, and MODIS Terra NDVI (8-day) for the same dates, via <a href="https://www.earthdata.nasa.gov/data/tools/gibs" target="_blank" rel="noopener">NASA GIBS</a> WMS.</li>
<li>Base map: NASA Blue Marble shaded relief and reference labels (OpenStreetMap-derived) via NASA GIBS.</li>
</ul>

<h3>3. How it works</h3>
<pre class="source">ASF DAAC (SME2 HDF5, ${n} dates)
  → tools/build_sme2_assets.py (Python, h5py, numpy, Pillow)
     · nearest-neighbour resample to a Web-Mercator grid (~250 m), study box 47.55–50.45° E, 39.10–41.15° N
     · σ⁰ → dB; one fixed display stretch for all dates: HH ${sc.rgb_hh_db[0]}…${sc.rgb_hh_db[1]} dB, HV ${sc.rgb_hv_db[0]}…${sc.rgb_hv_db[1]} dB
     · colour composite R = HH, G = HV, B = HH (same rule as NISAR QA browse images)
     · soil-moisture colour map 0–${sc.sm_max} m³/m³; non-recommended retrievals drawn pale
     · a ~1 km data cube (HH dB, HV dB, soil moisture) for clicks and change maps
  → browser (Leaflet 1.9.4): swipe, time-lapse, change map (dB difference), point charts</pre>

<h3>4. Limits (read before drawing conclusions)</h3>
<ul>
<li>PROVISIONAL and BETA products are not fully calibrated or validated. The winter BETA dates may carry an offset of about 1 dB against the summer PROVISIONAL dates (we see a ~1 dB shift even over the sea), so the main findings use June–October only.</li>
<li>Soil moisture is not yet validated; NISAR's accuracy goal is 0.06 m³/m³ where vegetation water content is below 5 kg/m². Retrievals in cities, dense vegetation and water are flagged.</li>
<li>Over the sea, HV is at the noise floor (median HV ≈ noise-equivalent σ⁰ ≈ −20 dB): sea HV is noise.</li>
<li>Over dry land, HV is also weak: on 63–70 % of land cells (summer–autumn dates) it lies within 3 dB of the noise floor, so small HV changes there are not meaningful.</li>
<li>On 4 Oct 2026 part of the brightening was scene-wide (central Baku +1.0 dB, sea +1.7 dB); we compare land with this urban control rather than claim the full +2.3 dB for wet soil.</li>
<li>Points and change maps use ~1 km cells (median of 3 × 3 cells in the point chart). Single fields are smaller.</li>
<li>Explanations of farmland changes are hypotheses. We have no 2026 field records or crop maps for Azerbaijan.</li>
<li>NASA POWER rain is a ~50 km model estimate, not a local gauge.</li>
<li>No ground motion (InSAR) analysis was done.</li>
</ul>

<h3>5. Accessibility</h3>
<p>Built in from the start: every control works with a keyboard (shortcuts under "?"), visible focus, a modal start dialog (native &lt;dialog&gt;), live text descriptions of each layer and point, a table alternative for every chart, colour plus line style in charts, a colour-blind-safe brown/teal change palette, reduced-motion support (no auto-play), 44 px touch targets on phones, English and Azerbaijani.</p>
<p><strong>What we tested ourselves:</strong> see the README. <strong>Not yet verified:</strong> a full screen-reader session by a blind user.</p>

<h3>6. Use of Super Intelligence (SI)</h3>
<p>The team chose the challenge, the study area (our home region) and the concept, and checked the results against local knowledge. An AI coding assistant (Anthropic Claude) helped write the code, the data-processing scripts and the draft texts, and searched the NISAR documentation. All data are real NASA/NASA-ISRO measurements or models as labelled; no images or data were generated by AI. The logo, the 3D illustrations, the promo video and its music were made with code written with the assistant (SVG, three.js, Remotion and a Python synthesizer, pitch/intro/music.py); they use only the real NASA images and tested numbers, and no generative image or video model. The promo video's Azerbaijani voiceover is AI-generated speech (ElevenLabs text-to-speech, voice "Roger") reading a script the team wrote.</p>

<h3>7. Credits &amp; licences</h3>
<ul>
<li>NISAR data: NASA-ISRO, distributed by the Alaska Satellite Facility DAAC. NASA data are free and open (NASA Earth Science Data and Information Policy).</li>
<li>MODIS imagery and base map: NASA GIBS / Worldview. Rain: NASA POWER Project.</li>
<li><a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a> 1.9.4 (BSD-2-Clause). IBM Plex Sans and Mono (SIL Open Font License) via Google Fonts.</li>
<li>Made by team NasAda (Baku, Azerbaijan) for the NASA Space Apps Challenge 2026, challenge "Dancing with the SARs".</li>
</ul>`;
}
