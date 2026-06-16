# Project Page Specification

## Purpose

This static page presents overall evaluation tables and audio-only examples for
the WalkReOnline experiment.
It is intended for GitHub Pages deployment from `docs/`.

Overall evaluation tables report method-level means by robot and SNR, omit
`clean_only`, round displayed values to two decimals, and bold the best value in
each robot-SNR metric column. Each audio example set compares the mixture,
references, and separated target estimates with spectrograms.

## Source Data

The project page builder uses:

- Sample-level results:
  `/mnt/usb_ssd2tb/ExpLog/WalkReOnline_v12/cross_site/online_summary/all_method_sample_level_results.csv`
- Overall evaluation scores:
  `/mnt/usb_ssd2tb/ExpLog/WalkReOnline_v12/cross_site/online_summary/all_method_scores_long.csv`

The paths are defined in `src/config.py` as
`PROJECT_PAGE_GENERAL_SAMPLE_LEVEL_RESULTS_CSV` and
`PROJECT_PAGE_SUMMARY_SCORES_CSV`.

## Generated Files

The builder writes:

- `docs/index.html`
- `docs/style.css`
- `docs/script.js`
- `docs/assets/data/project-data.json`
- `docs/assets/spectrogram_colorbar.png`
- `docs/assets/audio/<sample_id>/*.wav`
- `docs/assets/audio/<sample_id>/*.png`

`docs/` is the GitHub Pages publish directory.

## Audio Example Set Layout

Each set shows metadata at the top:

- `Robot: Go1` or `Robot: G1`
- `SNR: <value> dB`
- `Class: <class name>`
- `Ground Truth: Normal` or `Ground Truth: Anomaly`

The upper audio row contains:

- `Mixture`
- `Ego-Noise`
- `Target`

The lower audio row contains method outputs:

- `EgoSep (Ours)`
- `SAM-Audio` (`Sam-Audio`)
- `CLAPSep` (`clapsep`)
- `Conv-TasNet` (`espnet_convtasnet`)
- `Dual-Path RNN` (`espnet_dprnn_tf`)
- `Conformer` (`espnet_conformer`)

Each method output also displays:

- `Status (Prediction): Normal` or `Status (Prediction): Anomaly`
- `Correct` or `Wrong`
- `CAP Score↑`: CLAP audio embedding cosine similarity between the target and
  the separated estimate.
- `SAJ Score↑`: overall SAJ separation judgment score.

## Sample Selection

The builder selects `PROJECT_PAGE_SAMPLE_COUNT` sets.

Selection is automatic and prioritizes samples where:

- `EgoSep` is classification-correct.
- Competing methods are classification-wrong.
- `EgoSep` has higher separation metrics than competing methods.

To avoid selecting only one condition, candidates are taken in rotation over:

- robot
- SNR
- ground-truth label

The rotation bucket is:

`(robot, snr_db, Ground Truth)`

The current order is sorted by:

1. SNR
2. robot
3. `Normal`, then `Anomaly`

If more samples are needed than the number of buckets, the rotation repeats.
With the current `PROJECT_PAGE_SAMPLE_COUNT = 36`, each of the 12
`robot x SNR x Ground Truth` buckets appears three times when enough
candidates exist.

## Audio Scale

Audio files keep the source scale when they are materialized for the project page.

The builder loads each source track and writes it to `docs/assets/audio/`
without peak normalization or any other amplitude scaling.

## Spectrograms

Every playable audio file has one spectrogram image directly above it.

Spectrogram settings are defined only in `src/config.py`:

- `PROJECT_PAGE_SPECTROGRAM_N_FFT`
- `PROJECT_PAGE_SPECTROGRAM_HOP_LENGTH`
- `PROJECT_PAGE_SPECTROGRAM_DB_MIN`
- `PROJECT_PAGE_SPECTROGRAM_DB_MAX`
- `PROJECT_PAGE_SPECTROGRAM_CMAP`

Current settings:

- dB range: `-70 dB` to `-30 dB`
- colormap: `jet`
- x-axis unit: `sec`
- y-axis unit: `kHz`
- axis label and tick text is kept compact but readable for embedded images

The spectrogram dB reference is amplitude `1.0`.

A single shared colorbar is placed near the top of the page.

## Build Command

Run:

```bash
/home/koki/miniconda3/envs/sam-audio-new/bin/python scripts/build_project_page.py
```

This regenerates:

- selected samples
- wav files at the source scale
- spectrogram images
- colorbar
- JSON payload

## Local Preview

Run:

```bash
/home/koki/miniconda3/envs/sam-audio-new/bin/python -m http.server 8000 --directory docs
```

Open:

```text
http://127.0.0.1:8000/
```

## Configuration Rule

Page-generation parameters must be defined in `src/config.py`.
Scripts must import parameters from `src/config.py` rather than defining them
inline.
