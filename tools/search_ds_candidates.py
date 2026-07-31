#!/usr/bin/env python3
"""Search KKLT parameter space for metastable de Sitter candidates.

A candidate must satisfy:
- Positive local minimum in V_total(t)
- A post-minimum barrier with V_barrier > V_min
- Downhill direction after the barrier toward larger t (runaway channel)

Outputs JSON report to src/analysis/results/ds_candidates.json.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List, Optional

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.analysis.test_kklt import KKLTParameters, total_potential


@dataclass
class Candidate:
    w0: float
    a_param: float
    c_uplift: float
    t_min: float
    v_min: float
    t_barrier: float
    v_barrier: float
    barrier_height: float
    right_edge_v: float


def _local_min_index(v: np.ndarray) -> Optional[int]:
    for i in range(1, len(v) - 1):
        if v[i] <= v[i - 1] and v[i] <= v[i + 1]:
            return i
    return None


def _scan_candidate(
    t: np.ndarray,
    w0: float,
    a_param: float,
    c_uplift: float,
    barrier_tol: float,
) -> Optional[Candidate]:
    params = KKLTParameters(w0=w0, a_param=a_param, c_uplift=c_uplift)
    v = total_potential(t, params)

    min_idx = _local_min_index(v)
    if min_idx is None:
        return None

    v_min = float(v[min_idx])
    t_min = float(t[min_idx])
    if v_min <= 0.0:
        return None

    post = v[min_idx + 1 :]
    if post.size < 3:
        return None

    barrier_idx_rel = int(np.argmax(post))
    barrier_idx = min_idx + 1 + barrier_idx_rel
    v_barrier = float(v[barrier_idx])
    t_barrier = float(t[barrier_idx])
    barrier_height = v_barrier - v_min

    if barrier_height <= barrier_tol:
        return None

    right_edge_v = float(v[-1])
    if right_edge_v >= v_barrier:
        return None

    return Candidate(
        w0=w0,
        a_param=a_param,
        c_uplift=c_uplift,
        t_min=t_min,
        v_min=v_min,
        t_barrier=t_barrier,
        v_barrier=v_barrier,
        barrier_height=barrier_height,
        right_edge_v=right_edge_v,
    )


def search(
    t_min: float,
    t_max: float,
    points: int,
    w0_min: float,
    w0_max: float,
    w0_steps: int,
    a_min: float,
    a_max: float,
    a_steps: int,
    c_min_exp: float,
    c_max_exp: float,
    c_steps: int,
    barrier_tol: float,
    target_vmin: float,
    max_vmin: float,
    rank_mode: str,
    keep_top: int,
) -> List[Candidate]:
    t = np.linspace(t_min, t_max, points)
    w0_values = np.linspace(w0_min, w0_max, w0_steps)
    a_values = np.linspace(a_min, a_max, a_steps)
    c_values = np.logspace(c_min_exp, c_max_exp, c_steps)

    found: List[Candidate] = []
    total = len(w0_values) * len(a_values) * len(c_values)
    done = 0

    for w0 in w0_values:
        for a_param in a_values:
            for c_uplift in c_values:
                done += 1
                cand = _scan_candidate(t, float(w0), float(a_param), float(c_uplift), barrier_tol)
                if cand is not None:
                    if cand.v_min > max_vmin:
                        continue
                    found.append(cand)

    print(f"Scanned {total} parameter tuples")
    if rank_mode == "small-vacuum":
        found.sort(key=lambda x: (abs(x.v_min - target_vmin), -x.barrier_height, x.t_min))
    else:
        found.sort(key=lambda x: (-x.barrier_height, x.v_min))
    return found[:keep_top]


def write_report(candidates: List[Candidate], out_path: Path) -> None:
    payload = {
        "candidate_count": len(candidates),
        "candidates": [asdict(c) for c in candidates],
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_csv(candidates: List[Candidate], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "w0",
        "a_param",
        "c_uplift",
        "t_min",
        "v_min",
        "t_barrier",
        "v_barrier",
        "barrier_height",
        "right_edge_v",
    ]

    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for cand in candidates:
            writer.writerow(asdict(cand))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Search KKLT parameter space for metastable dS candidates")
    parser.add_argument("--t-min", type=float, default=5.0)
    parser.add_argument("--t-max", type=float, default=180.0)
    parser.add_argument("--points", type=int, default=3000)

    parser.add_argument("--w0-min", type=float, default=-5e-4)
    parser.add_argument("--w0-max", type=float, default=-2e-5)
    parser.add_argument("--w0-steps", type=int, default=14)

    parser.add_argument("--a-min", type=float, default=0.2)
    parser.add_argument("--a-max", type=float, default=1.0)
    parser.add_argument("--a-steps", type=int, default=18)

    parser.add_argument("--c-min-exp", type=float, default=-10.0)
    parser.add_argument("--c-max-exp", type=float, default=-7.0)
    parser.add_argument("--c-steps", type=int, default=20)

    parser.add_argument("--barrier-tol", type=float, default=1e-15)
    parser.add_argument("--target-vmin", type=float, default=1e-13)
    parser.add_argument("--max-vmin", type=float, default=5e-11)
    parser.add_argument(
        "--rank-mode",
        choices=["barrier", "small-vacuum"],
        default="barrier",
        help="Ranking objective: strongest barriers or closest small positive vacuum energy",
    )
    parser.add_argument("--keep-top", type=int, default=25)

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    candidates = search(
        t_min=args.t_min,
        t_max=args.t_max,
        points=args.points,
        w0_min=args.w0_min,
        w0_max=args.w0_max,
        w0_steps=args.w0_steps,
        a_min=args.a_min,
        a_max=args.a_max,
        a_steps=args.a_steps,
        c_min_exp=args.c_min_exp,
        c_max_exp=args.c_max_exp,
        c_steps=args.c_steps,
        barrier_tol=args.barrier_tol,
        target_vmin=args.target_vmin,
        max_vmin=args.max_vmin,
        rank_mode=args.rank_mode,
        keep_top=args.keep_top,
    )

    out_json = Path("src/analysis/results/ds_candidates.json")
    out_csv = Path("src/analysis/results/ds_candidates.csv")
    write_report(candidates, out_json)
    write_csv(candidates, out_csv)

    print(f"Found {len(candidates)} candidate(s)")
    for i, cand in enumerate(candidates[:10], start=1):
        print(
            f"[{i}] w0={cand.w0:.3e}, a={cand.a_param:.4f}, c={cand.c_uplift:.3e}, "
            f"t_min={cand.t_min:.2f}, Vmin={cand.v_min:.3e}, "
            f"barrier={cand.barrier_height:.3e} at t={cand.t_barrier:.2f}"
        )

    print(f"JSON report: {out_json}")
    print(f"CSV report: {out_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
