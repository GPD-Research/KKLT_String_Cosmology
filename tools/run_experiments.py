#!/usr/bin/env python3
"""Run the experiment suite described in manuscript/md/testing.md.

This script validates the core physics phases and writes a machine-readable
summary to src/analysis/results/experiment_report.json.
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

# Ensure local analysis modules are importable when running from tools/.
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.analysis.test_kklt import KKLTParameters, total_potential


@dataclass
class CheckResult:
    name: str
    passed: bool
    details: str


def _has_local_barrier(values: np.ndarray, t_values: np.ndarray) -> Tuple[bool, str]:
    min_idx = int(np.argmin(values))
    if min_idx >= len(values) - 3:
        return False, "Minimum at right boundary; cannot establish post-minimum barrier"

    right = values[min_idx + 1 :]
    if right.size == 0:
        return False, "No post-minimum domain available"

    max_idx_rel = int(np.argmax(right))
    max_val = float(right[max_idx_rel])
    min_val = float(values[min_idx])

    if max_val > min_val:
        t_barrier = float(t_values[min_idx + 1 + max_idx_rel])
        return True, f"Barrier found: Vmax={max_val:.3e} > Vmin={min_val:.3e} at t~{t_barrier:.2f}"

    return False, f"No barrier: Vmax={max_val:.3e} <= Vmin={min_val:.3e}"


def _is_monotonic_decreasing(values: np.ndarray, tol: float = 1e-14) -> bool:
    return bool(np.all(np.diff(values) <= tol))


def run_experiments() -> Tuple[List[CheckResult], Dict[str, float]]:
    t = np.linspace(5.0, 100.0, 4000)
    summary: Dict[str, float] = {}
    results: List[CheckResult] = []

    # Test A: AdS minimum for zero uplift.
    params_ads = KKLTParameters(c_uplift=0.0)
    v_ads = total_potential(t, params_ads)
    vmin_ads = float(np.min(v_ads))
    tmin_ads = float(t[np.argmin(v_ads)])
    summary["ads_min_t"] = tmin_ads
    summary["ads_min_v"] = vmin_ads
    results.append(
        CheckResult(
            name="Test A: AdS minimum with zero uplift",
            passed=vmin_ads < 0.0,
            details=f"Vmin={vmin_ads:.3e} at t~{tmin_ads:.3f}",
        )
    )

    # Test B: dS uplift and barrier existence for default uplift.
    params_ds = KKLTParameters(c_uplift=3.0e-9)
    v_ds = total_potential(t, params_ds)
    vmin_ds = float(np.min(v_ds))
    tmin_ds = float(t[np.argmin(v_ds)])
    has_barrier, barrier_detail = _has_local_barrier(v_ds, t)
    summary["ds_min_t"] = tmin_ds
    summary["ds_min_v"] = vmin_ds
    results.append(
        CheckResult(
            name="Test B1: dS-like positive local minimum",
            passed=vmin_ds > 0.0,
            details=f"Vmin={vmin_ds:.3e} at t~{tmin_ds:.3f}",
        )
    )
    results.append(
        CheckResult(
            name="Test B2: Post-minimum barrier existence",
            passed=has_barrier,
            details=barrier_detail,
        )
    )

    # Test C: Overlift runaway threshold scan.
    c_values = np.logspace(-9, -7, 60)
    c_crit = None
    for c_uplift in c_values:
        vals = total_potential(t, KKLTParameters(c_uplift=float(c_uplift)))
        if _is_monotonic_decreasing(vals):
            c_crit = float(c_uplift)
            break

    passed_c = c_crit is not None and c_crit <= 1.0e-7
    if c_crit is not None:
        summary["c_crit"] = c_crit
    results.append(
        CheckResult(
            name="Test C: Overlift runaway threshold",
            passed=passed_c,
            details=(
                f"Detected Ccrit~{c_crit:.3e}" if c_crit is not None else "No monotonic runaway threshold found"
            ),
        )
    )

    # Test D: Asymptotic behavior at very large t.
    t_far = np.array([1000.0])
    v_far = float(total_potential(t_far, params_ds)[0])
    summary["asymptotic_v_t1000"] = v_far
    results.append(
        CheckResult(
            name="Test D: Asymptotic convergence V(1000) -> 0+",
            passed=(v_far > 0.0 and abs(v_far) < 1.0e-9),
            details=f"V(1000)={v_far:.3e}",
        )
    )

    return results, summary


def write_report(results: List[CheckResult], summary: Dict[str, float]) -> Path:
    report = {
        "passed": all(r.passed for r in results),
        "results": [r.__dict__ for r in results],
        "summary": summary,
    }
    out_path = Path("src/analysis/results/experiment_report.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return out_path


def main() -> int:
    results, summary = run_experiments()
    report_path = write_report(results, summary)

    print("=== KKLT Experiment Suite ===")
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(f"[{status}] {result.name}: {result.details}")

    print(f"Report: {report_path}")
    return 0 if all(r.passed for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
