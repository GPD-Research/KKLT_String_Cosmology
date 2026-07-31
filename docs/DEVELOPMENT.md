# Development Notes

## Scope
This repository models KKLT modulus stabilization and uplift dynamics using:
- Rust core equations in src/lib.rs
- Browser UI in src/UI/index.html
- Python exploratory analysis in src/analysis/test_kklt.py

## Structure
- src/config: scenario templates and future parameter packs
- src/simulations: simulation drivers and scan pipelines
- src/analysis/notebooks: notebooks for exploratory studies
- src/analysis/results: generated plots and data tables (git-ignored)
- tools: utility scripts for environment checks and automation

## Recommended Workflow
1. Create Python environment: make setup-python
2. Run compile checks: make all-checks
3. Run exploratory script: make run-analysis

## Next Expansion Ideas
- Add axion dependence theta and full complex modulus support
- Add finite-temperature corrections and tunneling diagnostics
- Add parameter scan tooling that writes CSV/Parquet results to src/analysis/results
- Add unit consistency checks and regression fixtures
