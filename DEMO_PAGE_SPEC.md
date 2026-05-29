# Demo Page Specification

## Purpose

This static page presents audio-only demos for the WalkReOnline experiment.
It is intended for GitHub Pages deployment from `docs/`.

The page does not show accuracy tables or metric charts. Each demo set compares
the mixture, references, and separated target estimates with spectrograms.

## Source Data

The demo builder uses:

- Sample-level results:
  `/mnt/usb_ssd2tb/ExpLog/WalkReOnline_v5/online_summary/all_method_sample_level_results.csv`

The path is defined in `src/config.py` as `ALL_METHOD_SAMPLE_LEVEL_RESULTS_CSV`.

## Generated Files

The builder writes:

- `docs/index.html`
- `docs/style.css`
- `docs/script.js`
- `docs/assets/data/demo-data.json`
- `docs/assets/spectrogram_colorbar.png`
- `docs/assets/audio/<sample_id>/*.wav`
- `docs/assets/audio/<sample_id>/*.png`

`docs/` is the GitHub Pages publish directory.

## Demo Set Layout

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

- `Ours` (`sam_audio_lora`)
- `SAM-Audio` (`Sam-Audio`)
- `CLAPSep` (`clapsep`)
- `Conv-TasNet` (`espnet_convtasnet`)
- `Dual-Path RNN` (`espnet_dprnn_tf`)
- `Conformer` (`espnet_conformer`)

Each method output also displays:

- `Prediction: Normal` or `Prediction: Anomaly`
- `Correct` or `Wrong`
- `CAP Score↑`: CLAP audio embedding cosine similarity between the target and
  the separated estimate.
- `SAJ Score↑`: overall SAJ separation judgment score.

## Sample Selection

The builder selects `DEMO_PAGE_SAMPLE_COUNT` sets.

Selection is automatic and prioritizes samples where:

- `Ours` is classification-correct.
- Competing methods are classification-wrong.
- `Ours` has higher separation metrics than competing methods.

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
With the current `DEMO_PAGE_SAMPLE_COUNT = 36`, each of the 12
`robot x SNR x Ground Truth` buckets appears three times when enough
candidates exist.

## Audio Normalization

For each demo set:

1. Load the original `Mixture`.
2. Compute `scale = 1 / max(abs(Mixture))`.
3. Apply the same `scale` to every audio file in the set:
   - `Mixture`
   - `Ego-Noise`
   - `Target`
   - every method prediction
4. Write the scaled files to `docs/assets/audio/`.

This keeps all tracks within a set on the same amplitude scale.

## Spectrograms

Every playable audio file has one spectrogram image directly above it.

Spectrogram settings are defined only in `src/config.py`:

- `DEMO_SPECTROGRAM_N_FFT`
- `DEMO_SPECTROGRAM_HOP_LENGTH`
- `DEMO_SPECTROGRAM_DB_MIN`
- `DEMO_SPECTROGRAM_DB_MAX`
- `DEMO_SPECTROGRAM_CMAP`

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
/home/koki/miniconda3/envs/sam-audio-new/bin/python scripts/build_demo_page.py
```

This regenerates:

- selected samples
- scaled wav files
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
