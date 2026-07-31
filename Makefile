PYTHON ?= python3

.PHONY: setup-python check-rust test-rust check-python run-analysis validate-data all-checks

setup-python:
	$(PYTHON) -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r requirements.txt

check-rust:
	cargo check

test-rust:
	cargo test

check-python:
	$(PYTHON) -m py_compile src/analysis/test_kklt.py

run-analysis:
	MPLBACKEND=Agg $(PYTHON) src/analysis/test_kklt.py

validate-data:
	$(PYTHON) -m json.tool src/data/flux_samples.json > /dev/null

all-checks: check-rust test-rust check-python validate-data
