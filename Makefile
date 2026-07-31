PYTHON ?= python3
PYTHON_BIN := $(if $(wildcard .venv/bin/python),.venv/bin/python,$(PYTHON))

.PHONY: setup-python check-rust test-rust check-python run-analysis validate-data experiment-python experiments search-ds search-ds-tuned all-checks

setup-python:
	$(PYTHON) -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r requirements.txt

check-rust:
	cargo check

test-rust:
	cargo test

check-python:
	$(PYTHON_BIN) -m py_compile src/analysis/test_kklt.py

run-analysis:
	MPLBACKEND=Agg $(PYTHON_BIN) src/analysis/test_kklt.py

validate-data:
	$(PYTHON_BIN) -m json.tool src/data/flux_samples.json > /dev/null

experiment-python:
	$(PYTHON_BIN) -m py_compile tools/run_experiments.py
	$(PYTHON_BIN) tools/run_experiments.py

experiments: test-rust experiment-python

search-ds:
	$(PYTHON_BIN) -m py_compile tools/search_ds_candidates.py
	$(PYTHON_BIN) tools/search_ds_candidates.py

search-ds-tuned:
	$(PYTHON_BIN) -m py_compile tools/search_ds_candidates.py
	$(PYTHON_BIN) tools/search_ds_candidates.py \
		--t-max=220 \
		--points=5000 \
		--w0-min=-3.5e-4 \
		--w0-max=-4.0e-5 \
		--w0-steps=22 \
		--a-min=0.45 \
		--a-max=1.0 \
		--a-steps=24 \
		--c-min-exp=-10.2 \
		--c-max-exp=-7.6 \
		--c-steps=28 \
		--target-vmin=1e-13 \
		--max-vmin=2e-11 \
		--rank-mode=small-vacuum \
		--keep-top=40

all-checks: check-rust test-rust check-python validate-data
