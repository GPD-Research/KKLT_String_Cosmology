import itertools
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src" / "analysis"))

import string_spectrum as ss


def bank(n=1, q=0, pol="x1"):
    return {"n": n, "q": q, "pol": pol}


def closed(left=None, right=None, k=0, w=0, R=1.5):
    return {"mode": "closed", "left": left or bank(), "right": right or bank(), "k": k, "w": w, "R": R, "L": 0}


def open_(b=None, L=0.0, R=1.5):
    return {"mode": "open", "left": b or bank(), "right": bank(), "k": 0, "w": 0, "R": R, "L": L}


def test_closed_ground_state_is_tachyon():
    s = ss.classify(closed())
    assert s["name"] == "Tachyon" and s["m2"] == -4


def test_massless_closed_states():
    assert ss.classify(closed(bank(1, 1, "x1"), bank(1, 1, "x1")))["name"] == "Graviton"
    mixed = ss.classify(closed(bank(1, 1, "x1"), bank(1, 1, "x2")))
    assert [p["symbol"] for p in mixed["parts"]] == ["g_μν", "B_μν"]
    assert ss.classify(closed(bank(1, 1, "y"), bank(1, 1, "y")))["name"] == "Radion"
    assert ss.classify(closed(bank(1, 1, "x1"), bank(1, 1, "y")))["parts"][0]["symbol"] == "A_μ"
    for s in (mixed, ss.classify(closed(bank(1, 1, "y"), bank(1, 1, "y")))):
        assert s["massless"]


def test_level_matching():
    s = ss.classify(closed(bank(1, 1), bank(1, 0)))
    assert not s["physical"] and s["name"] == "Not a physical state"
    assert ss.classify(closed(bank(1, 1), bank(1, 0), k=1, w=1))["physical"]


def test_self_dual_radius_gauge_bosons():
    s = ss.classify(closed(bank(1, 1, "x1"), bank(1, 0), k=1, w=1, R=1.0))
    assert s["massless"] and s["symbol"] == "W±"
    assert not ss.classify(closed(bank(1, 1, "x1"), bank(1, 0), k=1, w=1, R=1.2))["massless"]


def test_kk_tower():
    s = ss.classify(closed(bank(1, 1), bank(1, 1), k=2, R=2.0))
    assert s["m2"] == pytest.approx(1.0) and s["name"] == "Graviton, Kaluza–Klein mode"


def test_t_duality_preserves_spectrum():
    for k, w, R in itertools.product(range(-2, 3), range(-2, 3), (0.5, 0.7, 1.3, 2.5)):
        cfg = closed(bank(1, 1), bank(1, 1), k=k, w=w, R=R)
        assert ss.mass_squared(cfg) == pytest.approx(ss.mass_squared(ss.t_dual(cfg)))


def test_open_string_states():
    assert ss.classify(open_())["name"] == "Tachyon"
    assert ss.classify(open_(bank(1, 1, "x1")))["symbol"] == "γ"
    assert ss.classify(open_(bank(1, 1, "y")))["name"] == "Brane-position scalar"
    w1, w2 = (ss.classify(open_(bank(1, 1, "x2"), L=L)) for L in (2.0, 4.0))
    assert w1["symbol"] == "W±" and 0 < w1["m2"] < w2["m2"]


def test_shape_boundary_conditions():
    c = closed(bank(2, 1, "x1"), bank(3, 2, "x2"), k=1, w=2, R=1.3)
    pts = ss.shape(c, 0.7, 64)
    assert pts[0]["x1"] == pytest.approx(pts[-1]["x1"]) and pts[0]["x2"] == pytest.approx(pts[-1]["x2"])
    assert pts[-1]["y"] - pts[0]["y"] == pytest.approx(2 * math.pi * c["w"] * c["R"])
    o = open_(bank(2, 1, "y"), L=3.0)
    pts = ss.shape(o, 0.4, 64)
    assert pts[0]["y"] == pytest.approx(0) and pts[-1]["y"] == pytest.approx(3.0)


def sbank(sector="NS", r=0.5, fpol="x1", n=1, q=0, pol="x1"):
    return {"n": n, "q": q, "pol": pol, "sector": sector, "r": r, "fpol": fpol}


def sup(cfg, type_="IIB", gso=True):
    return {**cfg, "theory": "super", "type": type_, "gso": gso}


def test_superstring_gso_removes_tachyon():
    s = ss.classify(sup(closed(sbank(r=0), sbank(r=0))))
    assert s["name"] == "Removed by the GSO projection" and not s["physical"]
    s = ss.classify(sup(closed(sbank(r=0), sbank(r=0)), gso=False))
    assert s["name"] == "Tachyon" and s["m2"] == pytest.approx(-2)
    assert ss.classify(sup(open_(sbank(r=0)), gso=False))["m2"] == pytest.approx(-0.5)


def test_superstring_massless_closed_states():
    g = ss.classify(sup(closed(sbank(), sbank())))
    assert g["name"] == "Graviton" and g["massless"] and not g["fermion"]
    a = ss.classify(sup(closed(sbank("R", 0), sbank("R", 0)), "IIA"))
    b = ss.classify(sup(closed(sbank("R", 0), sbank("R", 0)), "IIB"))
    assert [p["symbol"] for p in a["parts"]] == ["C_1", "C_3"]
    assert [p["symbol"] for p in b["parts"]] == ["C_0", "C_2", "C_4"]
    assert sum(p["share"] for p in a["parts"]) == sum(p["share"] for p in b["parts"]) == 64
    f = ss.classify(sup(closed(sbank(), sbank("R", 0))))
    assert f["fermion"] and f["massless"] and [p["symbol"] for p in f["parts"]] == ["ψ_μ", "λ"]


def test_superstring_without_gso_keeps_both_chiralities():
    rr = ss.classify(sup(closed(sbank("R", 0), sbank("R", 0)), gso=False))
    assert [p["symbol"] for p in rr["parts"]] == ["C_0", "C_1", "C_2", "C_3", "C_4"]
    assert sum(p["share"] for p in rr["parts"]) == 256
    f = ss.classify(sup(closed(sbank(), sbank("R", 0)), gso=False))
    assert sum(p["share"] for p in f["parts"]) == 128
    y = ss.classify(sup(closed(sbank(fpol="y"), sbank("R", 0)), gso=False))
    assert y["symbol"] == "ψ_y" and "both chiralities" in y["detail"]


def test_superstring_has_no_self_dual_gauge_bosons():
    for left, right in [(sbank(q=1, r=0.5), sbank()), (sbank("R", 1), sbank("R", 0))]:
        s = ss.classify(sup(closed(left, right, k=1, w=1, R=1.0)))
        assert s["physical"] and s["m2"] > 1


def test_superstring_level_matching_with_half_integers():
    c = sup(closed(sbank(q=1, r=0.5), sbank()))
    assert not ss.level_matched(c)
    assert ss.level_matched({**c, "k": 1, "w": 1})


def test_superstring_t_duality_swaps_iia_and_iib():
    for k, w, R in itertools.product(range(-2, 3), range(-2, 3), (0.5, 1.3, 2.5)):
        cfg = sup(closed(sbank("R", 0), sbank("R", 0), k=k, w=w, R=R), "IIA")
        d = ss.t_dual(cfg)
        assert d["type"] == "IIB" and ss.mass_squared(cfg) == pytest.approx(ss.mass_squared(d))
    rr = sup(closed(sbank("R", 0), sbank("R", 0)), "IIA")
    assert ss.classify(ss.t_dual(ss.t_dual(rr)))["symbol"] == ss.classify(rr)["symbol"]


def test_superstring_open_states():
    assert ss.classify(sup(open_(sbank())))["symbol"] == "γ"
    lam = ss.classify(sup(open_(sbank("R", 0))))
    assert lam["name"] == "Photino" and lam["massless"] and lam["fermion"]
    assert ss.classify(sup(open_(sbank("R", 0), L=4.0)))["symbol"] == "W̃±"
    assert ss.classify(sup(open_(sbank(fpol="y"))))["name"] == "Brane-position scalar"


def _configs():
    pols = ("x1", "x2", "y")
    for (nl, ql, pl), (nr, qr, pr) in itertools.product(
        [(1, 0, "x1"), (1, 1, "x1"), (1, 1, "y"), (2, 1, "x2"), (1, 2, "y")],
        [(1, 0, "x2"), (1, 1, "x2"), (1, 1, "x1"), (1, 1, "y"), (2, 1, "x1")],
    ):
        for k, w, R in [(0, 0, 1.0), (1, 1, 1.0), (1, 0, 0.6), (0, 2, 1.7), (-1, 1, 1.0)]:
            yield closed(bank(nl, ql, pl), bank(nr, qr, pr), k=k, w=w, R=R)
    for (n, q), pol, L in itertools.product([(1, 0), (1, 1), (2, 1), (3, 2)], pols, (0, 2.5, 2 * math.pi)):
        yield open_(bank(n, q, pol), L=L)
    sides = [("NS", 0), ("NS", 0.5), ("NS", 1.5), ("R", 0), ("R", 1)]
    for (sl, rl), (sr, rr), (ql, fl), type_, gso in itertools.product(
        sides, sides, [(0, "x1"), (1, "y")], ("IIA", "IIB"), (True, False)
    ):
        for k, w, R in [(0, 0, 1.5), (1, 0, 0.6), (1, 1, 1.0), (0, 1, 1.7)]:
            left, right = sbank(sl, rl, fl, q=ql), sbank(sr, rr, "x2")
            yield sup(closed(left, right, k=k, w=w, R=R), type_, gso)
        yield sup(open_(sbank(sl, rl, fl, q=ql), L=2.5 * ql), type_, gso)


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_js_matches_python():
    cfgs = list(_configs())
    script = (
        "const S = require(process.argv[1]); const cfgs = JSON.parse(require('fs').readFileSync(0));"
        "console.log(JSON.stringify(cfgs.map(c => ({c: S.classify(c), s: S.shape(c, 0.9, 16)}))));"
    )
    res = subprocess.run(
        ["node", "-e", script, str(ROOT / "src" / "UI" / "strings.js")],
        input=json.dumps(cfgs),
        capture_output=True,
        text=True,
        check=True,
    )
    for cfg, js in zip(cfgs, json.loads(res.stdout), strict=True):
        py = ss.classify(cfg)
        for key in ("name", "symbol", "detail", "massless", "physical", "N", "Nt", "gso", "fermion"):
            assert js["c"][key] == py[key], (cfg, key)
        assert js["c"]["m2"] == pytest.approx(py["m2"])
        js_shares = [p.get("share") for p in js["c"].get("parts", [])]
        assert js_shares == [p.get("share") for p in py.get("parts", [])], cfg
        for a, b in zip(js["s"], ss.shape(cfg, 0.9, 16), strict=True):
            for key in ("x1", "x2", "y"):
                assert a[key] == pytest.approx(b[key], abs=1e-9)
