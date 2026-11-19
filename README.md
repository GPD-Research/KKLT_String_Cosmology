# KKLT_String_Cosmology

KKLT_String_Cosmology models moduli stabilization and anti-D3 uplift in Type IIB compactifications for integration with physics-ide workflows.

Detailed manuscript overview: manuscript/md/About.md

## What is included

- Rust core model for KKLT potential calculations in src/lib.rs
- Browser-based interactive explorer in src/UI/index.html
- StringScope, an oscilloscope-style viewer of vibrating string states, in src/UI/string_scope.html
- Python exploratory diagnostics and plotting in src/analysis/test_kklt.py
- Scenario data in src/data/flux_samples.json

## Quick start

1. Create Python environment and install dependencies:

	make setup-python

2. Validate the project:

	make all-checks

3. Run exploratory analysis script:

	make run-analysis

## StringScope viewer

Run it online at https://gpd-research.com/KKLT_String_Cosmology/src/UI/string_scope.html.

Open `src/UI/string_scope.html` in a browser. It needs no build or server.

It animates a bosonic string on a circle of radius R, with α′ = 1. You can view a closed loop, or an open string stretched between two branes. Stepped knobs set the quantum numbers: mode number n, quanta q, polarization, KK momentum k, winding w, radius R and brane separation L.

The display names each state with its symbol, for example Graviton g<sub>μν</sub>, Kalb–Ramond B<sub>μν</sub>, Radion σ, Photon γ, W± or Tachyon T. Massive string levels with no named particle are labeled as such. The live equations show the mode expansion, the mass formula α′M² = k²/R² + w²R² + 2(N + Ñ − 2) (open: (L/2π)² + N − 1) and the level-matching check.

The physics lives in `src/UI/strings.js`, and `src/analysis/string_spectrum.py` mirrors it. Run `make test-python` to check that the two agree.

## Repository layout

- docs/: developer notes and model expansion guidance
- manuscript/md/: manuscript and scientific notes
- src/config/: scenario templates and future parameter packs
- src/simulations/: simulation drivers and scan pipelines
- src/analysis/notebooks/: notebook-based experiments
- src/analysis/results/: generated figures and outputs
- tools/: environment and utility scripts

See docs/DEVELOPMENT.md for expansion ideas and workflow details.

**Cache-busting:** every local script, stylesheet and image an HTML page loads carries `?v=<hash of the file>`, so visitors get changes at once instead of mixing new and cached files. After editing one, run `python tools/stamp_assets.py`; CI fails (`--check`) if a tag is stale.
