# KKLT_String_Cosmology

KKLT_String_Cosmology models moduli stabilization and anti-D3 uplift in Type IIB compactifications for integration with physics-ide workflows.

Detailed manuscript overview: manuscript/md/About.md

## What is included

- Rust core model for KKLT potential calculations in src/lib.rs
- Browser-based interactive explorer in src/UI/index.html
- Python exploratory diagnostics and plotting in src/analysis/test_kklt.py
- Scenario data in src/data/flux_samples.json

## Quick start

1. Create Python environment and install dependencies:

	make setup-python

2. Validate the project:

	make all-checks

3. Run exploratory analysis script:

	make run-analysis

## Repository layout

- docs/: developer notes and model expansion guidance
- manuscript/md/: manuscript and scientific notes
- src/config/: scenario templates and future parameter packs
- src/simulations/: simulation drivers and scan pipelines
- src/analysis/notebooks/: notebook-based experiments
- src/analysis/results/: generated figures and outputs
- tools/: environment and utility scripts

See docs/DEVELOPMENT.md for expansion ideas and workflow details.
