# Radar Absheron
NASA Space Apps Challenge 2026 — "Dancing with the SARs". Team: NasAda (Baku, Azerbaijan local event).
**Submission deadline: 2026-11-15 23:59 Baku time (UTC+4).** Full plan: `PLAN.md`. Team task split: `TEAM_TASKS.md`.

## What it is
An interactive web story map that shows five months (June–October 2026) of NISAR L-band radar over
Baku, the Absheron peninsula and the Kura-Araz lowland: time-lapse, two-date swipe, change map, and
click-anywhere time series, with honest explanations of what each colour and number means.

## Rules
- Every file in the repo is written in English. Chat with the user in Azerbaijani.
- Stack: vanilla HTML/CSS/JS ES modules + Leaflet@1.9.4 from cdnjs, no build step. Python 3.13
  scripts in `tools/` turn raw NISAR/NASA files (in git-ignored `data_raw/`) into small web assets.
- Accessibility is a core judging theme: keyboard, aria-live, reduced motion, 44 px phone targets,
  contrast >= 4.5:1, text alternatives for every chart.
- Science honesty: browse-image values are relative (per-image stretch); calibrated values come from
  NISAR SME2 sigma0 (dB) and soil moisture (m3/m3, PROVISIONAL). Say which one is shown.
- Every NASA asset gets a credit line (source URL) in the UI and README.
- Deploy: GitHub Pages; bump the ?v= cache version before each push; keep assets small.
- Git commits: NEVER add Co-Authored-By: Claude or any AI attribution trailer (user's explicit instruction).
- Never commit or handle tokens. `tools/fetch_nisar_sme2.py` reads EARTHDATA_TOKEN from the
  environment only, and the account owner runs it.
