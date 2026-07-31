#!/usr/bin/env bash
set -euo pipefail

echo "Checking Rust toolchain..."
if command -v cargo >/dev/null 2>&1; then
  cargo --version
else
  echo "cargo not found"
fi

echo "Checking Python dependencies..."
PYTHON_BIN="python3"
if [[ -x ".venv/bin/python" ]]; then
  PYTHON_BIN=".venv/bin/python"
fi

"$PYTHON_BIN" - <<'PY'
missing = []
for name in ("numpy", "matplotlib"):
    try:
        __import__(name)
    except ModuleNotFoundError:
        missing.append(name)
if missing:
    print("Missing:", ", ".join(missing))
    raise SystemExit(1)
print("Python dependencies are available")
PY

echo "Environment looks good."
