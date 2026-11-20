"""String on a circle of radius R (alpha' = 1): bosonic (26-D) or Type II superstring (10-D, RNS).

Python mirror of src/UI/strings.js, used by tests to pin down the physics
behind the StringScope viewer. Keep the two files in sync.
"""

import math

TOL = 1e-9
TAU = 2 * math.pi


def level(bank):
    return bank["n"] * bank["q"]


def amplitude(bank):
    return math.sqrt(2 * bank["q"] / bank["n"]) if bank["q"] > 0 else 0.0


def is_super(cfg):
    return cfg.get("theory") == "super"


def level_of(cfg, bank):
    return level(bank) + (bank["r"] if is_super(cfg) else 0)


def intercept(cfg, bank):
    if not is_super(cfg):
        return 1
    return 0.5 if bank["sector"] == "NS" else 0


def gso_kept(cfg, bank):
    return not is_super(cfg) or not cfg["gso"] or bank["sector"] == "R" or bank["r"] > 0


def _excess(cfg, bank):
    return level_of(cfg, bank) - intercept(cfg, bank)


def mass_squared(cfg):
    if cfg["mode"] == "open":
        return (cfg["L"] / TAU) ** 2 + _excess(cfg, cfg["left"])
    k, w, R = cfg["k"], cfg["w"], cfg["R"]
    return (k / R) ** 2 + (w * R) ** 2 + 2 * (_excess(cfg, cfg["left"]) + _excess(cfg, cfg["right"]))


def level_matched(cfg):
    if cfg["mode"] == "open":
        return True
    return abs(_excess(cfg, cfg["left"]) - _excess(cfg, cfg["right"]) - cfg["k"] * cfg["w"]) < TOL


def _state(name, symbol, detail, **extra):
    return {"name": name, "symbol": symbol, "detail": detail, **extra}


def _compact(pol):
    return pol == "y"


def _closed_tensor(pl, pr, osc):
    if not _compact(pl) and not _compact(pr):
        if pl == pr:
            return [_state("Graviton", "g_μν", f"symmetric tensor {osc}; its trace part is the Dilaton Φ")]
        return [
            _state("Graviton", "g_μν", f"symmetric half of {osc}"),
            _state("Kalb–Ramond field", "B_μν", f"antisymmetric half of {osc}"),
        ]
    if _compact(pl) and _compact(pr):
        return [_state("Radion", "σ", "size of the extra dimension, the 1-D analogue of KKLT's volume modulus t")]
    return [
        _state("Graviphoton", "A_μ", "Kaluza–Klein photon from g_μy"),
        _state("Winding photon", "B_μ", "vector from B_μy"),
    ]


def _super_massless(cfg):
    left, right, is_a = cfg["left"], cfg["right"], cfg["type"] == "IIA"
    if left["sector"] == "NS" and right["sector"] == "NS":
        return _closed_tensor(left["fpol"], right["fpol"], "ψ₋½ ψ̃₋½")
    if left["sector"] == "R" and right["sector"] == "R" and not cfg["gso"]:
        forms = [("axions", "C_0", 2), ("1-forms", "C_1", 16), ("2-forms", "C_2", 56), ("3-forms", "C_3", 112), ("4-forms", "C_4", 70)]
        return [
            _state(f"Ramond–Ramond {n}", sym, f"{k} of the 256 unprojected R–R states (both chiralities)", share=k)
            for n, sym, k in forms
        ]
    if left["sector"] == "R" and right["sector"] == "R":
        if is_a:
            return [
                _state("Ramond–Ramond 1-form", "C_1", "8 of the 64 R–R states; couples to D0-branes", share=8),
                _state("Ramond–Ramond 3-form", "C_3", "56 of the 64 R–R states; couples to D2-branes", share=56),
            ]
        return [
            _state("Ramond–Ramond axion", "C_0", "1 of the 64 R–R states; couples to D-instantons", share=1),
            _state("Ramond–Ramond 2-form", "C_2", "28 of the 64 R–R states; F₃ = dC₂ is one of KKLT's fluxes", share=28),
            _state(
                "Ramond–Ramond 4-form",
                "C_4",
                "35 of the 64 R–R states, self-dual; couples to D3-branes like KKLT's anti-D3",
                share=35,
            ),
        ]
    ns = left if left["sector"] == "NS" else right
    if not cfg["gso"]:
        return [
            _state("Gravitini", "ψ_μ", "spin 3/2, both chiralities without GSO; 112 of 128 states", share=112),
            _state("Dilatini", "λ", "spin ½, both chiralities; 16 of 128 states", share=16),
        ]
    chir = "opposite chirality to its mirror (Type IIA)" if is_a else "same chirality as its mirror (Type IIB)"
    if _compact(ns["fpol"]):
        return [_state("Spin-½ fermion", "ψ_y", f"the gravitino's part along the circle, spin ½ in 9-D; {chir}")]
    return [
        _state("Gravitino", "ψ_μ", f"spin 3/2, the graviton's superpartner; 56 of 64 states; {chir}", share=56),
        _state("Dilatino", "λ", "spin ½, the dilaton's superpartner; 8 of 64 states", share=8),
    ]


def _combine(parts, base):
    return _state(
        " + ".join(p["name"] for p in parts),
        " + ".join(p["symbol"] for p in parts),
        "; ".join(p["detail"] for p in parts),
        parts=parts,
        **base,
    )


def _massive_copies(parts, cfg, base):
    kind = "Kaluza–Klein" if cfg["k"] != 0 else "winding"
    tag = f"(k={cfg['k']})" if cfg["k"] != 0 else f"(w={cfg['w']})"
    return _combine(
        [
            _state(
                f"{p['name']}, {kind} mode",
                f"{p['symbol']}{tag}",
                f"massive copy: {p['detail']}",
                **({"share": p["share"]} if "share" in p else {}),
            )
            for p in parts
        ],
        base,
    )


def _classify_super(cfg, base):
    def lowest(b):
        return b["q"] == 0 and b["r"] == (0.5 if b["sector"] == "NS" else 0)

    massive = _state("Massive string state", "—", "no named particle; one level of a massive supermultiplet", **base)
    if cfg["mode"] == "open":
        b = cfg["left"]
        if not lowest(b):
            return massive
        if b["sector"] == "R":
            if cfg["L"] == 0:
                return _state(
                    "Photino",
                    "λ",
                    f"massless spin-½ superpartner of the photon (a gaugino), a {16 if cfg['gso'] else 32}-component spinor",
                    **base,
                )
            return _state("W-ino", "W̃±", "massive spin-½ superpartner of the stretched-string W boson", **base)
        if not _compact(b["fpol"]):
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
                "Brane-position scalar", "φ", "fermion quantum along the Dirichlet direction moves the brane", **base
            )
        return _state("Massive scalar", "φ", "stretched-string mode along the Dirichlet direction", **base)
    if lowest(cfg["left"]) and lowest(cfg["right"]):
        parts = _super_massless(cfg)
        return _combine(parts, base) if base["massless"] else _massive_copies(parts, cfg, base)
    if base["massless"]:
        return _state("Massless scalar", "φ", "extra massless state at a special radius", **base)
    return massive


def classify(cfg):
    sup, is_open = is_super(cfg), cfg["mode"] == "open"
    m2 = mass_squared(cfg)
    N = level_of(cfg, cfg["left"])
    Nt = 0 if is_open else level_of(cfg, cfg["right"])
    gso = gso_kept(cfg, cfg["left"]) and (is_open or gso_kept(cfg, cfg["right"]))
    lm = level_matched(cfg)
    if not sup:
        fermion = False
    elif is_open:
        fermion = cfg["left"]["sector"] == "R"
    else:
        fermion = (cfg["left"]["sector"] == "R") != (cfg["right"]["sector"] == "R")
    base = {"m2": m2, "N": N, "Nt": Nt, "massless": abs(m2) < TOL, "physical": lm and gso, "gso": gso, "fermion": fermion}

    if not gso:
        return _state(
            "Removed by the GSO projection", "—", "NS states need an odd number of ψ quanta; this one has none", **base
        )
    if not lm:
        detail = "level matching N − a = Ñ − ã + kw fails" if sup else "level matching N − Ñ = kw fails"
        return _state("Not a physical state", "—", detail, **base)
    if m2 < -TOL:
        detail = (
            "M² < 0: the NS ground state, which the GSO projection removes"
            if sup
            else "M² < 0: the bosonic string's unstable ground state"
        )
        return _state("Tachyon", "T", detail, **base)
    if sup:
        return _classify_super(cfg, base)

    if is_open:
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

    if N == 1 and Nt == 1:
        parts = _closed_tensor(cfg["left"]["pol"], cfg["right"]["pol"], "α₋₁ α̃₋₁")
        return _combine(parts, base) if base["massless"] else _massive_copies(parts, cfg, base)
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
    out = {**cfg, "k": cfg["w"], "w": cfg["k"], "R": 1 / cfg["R"]}
    if is_super(cfg):
        out["type"] = "IIB" if cfg["type"] == "IIA" else "IIA"
    return out
