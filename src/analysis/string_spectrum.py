"""Bosonic string on a circle of radius R (alpha' = 1).

Python mirror of src/UI/strings.js, used by tests to pin down the physics
behind the String Scope viewer. Keep the two files in sync.
"""

import math

TOL = 1e-9
TAU = 2 * math.pi


def level(bank):
    return bank["n"] * bank["q"]


def amplitude(bank):
    return math.sqrt(2 * bank["q"] / bank["n"]) if bank["q"] > 0 else 0.0


def mass_squared(cfg):
    if cfg["mode"] == "open":
        return (cfg["L"] / TAU) ** 2 + level(cfg["left"]) - 1
    k, w, R = cfg["k"], cfg["w"], cfg["R"]
    return (k / R) ** 2 + (w * R) ** 2 + 2 * (level(cfg["left"]) + level(cfg["right"]) - 2)


def level_matched(cfg):
    return cfg["mode"] == "open" or level(cfg["left"]) - level(cfg["right"]) == cfg["k"] * cfg["w"]


def _state(name, symbol, detail, **extra):
    return {"name": name, "symbol": symbol, "detail": detail, **extra}


def _compact(pol):
    return pol == "y"


def _closed_tensor(pl, pr):
    if not _compact(pl) and not _compact(pr):
        if pl == pr:
            return [_state("Graviton", "g_μν", "symmetric tensor α₋₁ α̃₋₁; its trace part is the Dilaton Φ")]
        return [
            _state("Graviton", "g_μν", "symmetric half of α₋₁ α̃₋₁"),
            _state("Kalb–Ramond field", "B_μν", "antisymmetric half of α₋₁ α̃₋₁"),
        ]
    if _compact(pl) and _compact(pr):
        return [_state("Radion", "σ", "size of the extra dimension, the 1-D analogue of KKLT's volume modulus t")]
    return [
        _state("Graviphoton", "A_μ", "Kaluza–Klein photon from g_μy"),
        _state("Winding photon", "B_μ", "vector from B_μy"),
    ]


def _combine(parts, base):
    return _state(
        " + ".join(p["name"] for p in parts),
        " + ".join(p["symbol"] for p in parts),
        "; ".join(p["detail"] for p in parts),
        parts=parts,
        **base,
    )


def classify(cfg):
    m2 = mass_squared(cfg)
    N = level(cfg["left"])
    Nt = 0 if cfg["mode"] == "open" else level(cfg["right"])
    base = {"m2": m2, "N": N, "Nt": Nt, "massless": abs(m2) < TOL, "physical": level_matched(cfg)}

    if not base["physical"]:
        return _state("Not a physical state", "—", "level matching N − Ñ = kw fails", **base)
    if m2 < -TOL:
        return _state("Tachyon", "T", "M² < 0: the bosonic string's unstable ground state", **base)

    if cfg["mode"] == "open":
        pol = cfg["left"]["pol"]
        if N == 1 and cfg["left"]["n"] == 1:
            if not _compact(pol):
                if cfg["L"] == 0:
                    return _state("Photon", "γ", "massless U(1) gauge field A_μ living on the brane", **base)
                return _state(
                    "W boson",
                    "W±",
                    "string stretched between separated branes: a massive gauge boson (Higgs mechanism)",
                    **base,
                )
            if cfg["L"] == 0:
                return _state(
                    "Brane-position scalar", "φ", "oscillation along the Dirichlet direction moves the brane", **base
                )
            return _state("Massive scalar", "φ", "stretched-string mode along the Dirichlet direction", **base)
        if base["massless"]:
            return _state("Massless scalar", "φ", "stretched ground state at L = 2π√α′", **base)
        return _state("Massive string state", "—", f"no named particle; spin up to {N}", **base)

    k, w = cfg["k"], cfg["w"]
    if N == 1 and Nt == 1:
        parts = _closed_tensor(cfg["left"]["pol"], cfg["right"]["pol"])
        if base["massless"]:
            return _combine(parts, base)
        kind = "Kaluza–Klein" if k != 0 else "winding"
        tag = f"(k={k})" if k != 0 else f"(w={w})"
        return _combine(
            [
                _state(f"{p['name']}, {kind} mode", f"{p['symbol']}{tag}", f"massive copy: {p['detail']}")
                for p in parts
            ],
            base,
        )
    if base["massless"]:
        bank = cfg["left"] if N == 1 else cfg["right"] if Nt == 1 else None
        if bank and not _compact(bank["pol"]):
            return _state(
                "W gauge boson", "W±", "extra massless vector at the self-dual radius R = √α′ (SU(2) symmetry)", **base
            )
        return _state("Massless scalar", "φ", "extra massless scalar at a special radius", **base)
    return _state("Massive string state", "—", f"no named particle; spin up to {N + Nt}", **base)


def shape(cfg, tau, points=256):
    is_open = cfg["mode"] == "open"
    span = math.pi if is_open else TAU
    out = []
    for i in range(points + 1):
        s = span * i / points
        p = {"s": s, "x1": 0.0, "x2": 0.0, "y": 0.0}
        if is_open:
            b = cfg["left"]
            a = amplitude(b) * math.cos(b["n"] * tau)
            p["y"] = cfg["L"] * s / math.pi
            if _compact(b["pol"]):
                p["y"] += a * math.sin(b["n"] * s)
            else:
                p[b["pol"]] += a * math.cos(b["n"] * s)
        else:
            p["y"] = cfg["k"] / cfg["R"] * tau + cfg["w"] * cfg["R"] * s
            left, right = cfg["left"], cfg["right"]
            p[left["pol"]] += amplitude(left) * math.cos(left["n"] * (tau + s))
            p[right["pol"]] += amplitude(right) * math.cos(right["n"] * (tau - s))
        out.append(p)
    return out


def t_dual(cfg):
    return {**cfg, "k": cfg["w"], "w": cfg["k"], "R": 1 / cfg["R"]}
