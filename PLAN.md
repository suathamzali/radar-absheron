# Radar Absheron: Winning Plan
**Challenge:** Dancing with the SARs (NASA Space Apps 2026) · **Team:** NasAda, Baku ·
**Deadline:** 2026-11-15 23:59 (UTC+4)

## 1. One-sentence idea
Through clouds and at night, NISAR's L-band radar watched Baku and the Kura-Araz lowland every 12 days
in summer–autumn 2026; Radar Absheron lets anyone play that record, compare dates, and read what changed
and why (harvests, irrigation, rain, wind on the Caspian, a city that stays still).

## 2. Judging criteria and how we score 5
| Criterion | How we answer it |
|---|---|
| Impact | Farmers, water managers and students in Azerbaijan see crop and moisture rhythms of their own region; the method works for any NISAR frame. |
| Creativity | "Dance" framing: each place has a rhythm; a story map that plays once, then hands over to free exploration; change map + click time series. |
| Validity | Real NISAR GCOV (11 dates) and, if downloaded, SME2 calibrated sigma0 / soil moisture; every value labelled (relative vs dB vs m3/m3, provisional); hypotheses marked as hypotheses. |
| Relevance | NISAR is the core of every view; HH vs HV polarizations; time series; ancillary NASA POWER rain and GIBS optical/NDVI for context. |
| Presentation | Start screen with one question + three steps, legend first, summary card, 30 s demo. |

**Target awards:** Local Impact, Best Use of Data, Best Storytelling, Best Use of Science.

## 3. Product: what we build
| View | NASA source | Feature -> encoding |
|---|---|---|
| How radar sees (legend) | NISAR GCOV browse | Magenta = strong HH, green = strong HV, dark = smooth surface/water |
| Time-lapse + swipe | NISAR GCOV browse, track 56 frame 22, 11 dates | Play once Jun -> Oct; compare two dates side by side |
| Kura-Araz fields | GCOV browse (+ SME2 sigma0 HV) | HV rise/fall = crop growth/harvest (hypothesis) |
| Absheron & Baku | GCOV browse | Stable bright city (HH), dark salt lakes, oil fields |
| Caspian coast | GCOV browse | Sea brightness changes with wind roughness, not water level |
| Soil moisture (if data) | NISAR SME2 (provisional) + NASA POWER rain | m3/m3 map per date; rainfall bars |
| Change map | HV difference between two dates | Diverging colours; relative unless SME2 dB is available |
| Point inspector | all of the above | Click -> HH/HV time series chart + text description |

## 4. Out of scope
Sonification, other world regions, InSAR deformation analysis.

## 5. Schedule to the deadline (Baku time, 15 Nov)
| Time | Work |
|---|---|
| 00:00–02:00 | Intake, data access, plan files |
| 02:00–08:00 | Data pipeline + app build |
| 08:00–12:00 | Story text, accessibility, science panels |
| 12:00–16:00 | Review rounds, judge agent, fixes |
| 16:00–19:00 | README, submission text, deploy, team phone tests |
| 19:00–23:00 | Demo video (team), form (team), buffer |

## 6. Demo script (<=30 s)
0–5 s: "NISAR sees Azerbaijan through clouds and darkness." Start screen. ·
5–20 s: time-lapse over Kura fields, swipe June vs October, click a field -> the HV curve changes. ·
20–27 s: keyboard-only navigation and the spoken description. ·
27–30 s: name, link, "Powered by NASA-ISRO NISAR data".

## 7. Risks and fallbacks
- Earthdata download not done -> the app runs on public browse images only, labelled relative.
- GitHub Pages delay -> record the video from the local preview.
- Provisional SME2 values -> shown with the accuracy goal (0.06 m3/m3) and a "provisional" badge.
