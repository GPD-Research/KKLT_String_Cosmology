"""Checks of the Clifford algebra behind StringScope's spinor panel (src/UI/spinors.js)."""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

JS = Path(__file__).resolve().parents[1] / "src" / "UI" / "spinors.js"

SCRIPT = """
const S = require(%s);
const G = S.gammas(10), n = G[0].length, out = {n, count: G.length};
let worst = 0;
for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) {
  const P = S.matmul(G[a], G[b]), Q = S.matmul(G[b], G[a]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const t = a === b && i === j ? 2 : 0;
    worst = Math.max(worst, Math.abs(P[i][j][0] + Q[i][j][0] - t), Math.abs(P[i][j][1] + Q[i][j][1]));
  }
}
out.clifford = worst;
const psi = Array.from({length: n}, (_, i) => [Math.cos(i), Math.sin(2 * i)]);
const diff = (u, v, s) => Math.max(...u.map((x, i) => Math.hypot(x[0] - s * v[i][0], x[1] - s * v[i][1])));
out.turn2 = diff(S.rotate(G, 0, 3, 2 * Math.PI, psi), psi, -1);
out.turn4 = diff(S.rotate(G, 0, 3, 4 * Math.PI, psi), psi, 1);
out.norm = Math.abs(S.norm(S.rotate(G, 2, 7, 1.234, psi)) - S.norm(psi));
const ab = S.apply(G[1], S.apply(G[4], psi)), ba = S.apply(G[4], S.apply(G[1], psi));
out.antipodal = diff(ab, ba, -1);
const th = 0.8, lhs = S.rotate(G, 2, 6, th, S.apply(G[2], S.rotate(G, 2, 6, -th, psi)));
const rhs = S.apply(G[2], psi).map((x, i) => {
  const y = S.apply(G[6], psi)[i];
  return [Math.cos(th) * x[0] + Math.sin(th) * y[0], Math.cos(th) * x[1] + Math.sin(th) * y[1]];
});
out.covariant = diff(lhs, rhs, 1);
const parity = (i) => { let c = 0; for (; i; i >>= 1) c ^= i & 1; return c; };
const weyl = psi.map((x, i) => (parity(i) ? [0, 0] : x));
const turned = S.rotate(G, 5, 8, 0.7, weyl);
out.chiral = Math.max(...turned.map((x, i) => (parity(i) ? Math.hypot(...x) : 0)));
console.log(JSON.stringify(out));
"""


@pytest.fixture(scope="module")
def result():
    node = shutil.which("node")
    if not node:
        pytest.skip("node not installed")
    run = subprocess.run([node, "-e", SCRIPT % json.dumps(str(JS))], capture_output=True, text=True, check=True)
    return json.loads(run.stdout)


def test_ten_gamma_matrices_of_size_32(result):
    assert result["count"] == 10 and result["n"] == 32


def test_clifford_relation(result):
    assert result["clifford"] < 1e-12


def test_spinor_needs_two_turns(result):
    assert result["turn2"] < 1e-12 and result["turn4"] < 1e-12


def test_rotations_are_unitary(result):
    assert result["norm"] < 1e-12


def test_anticommuting_orders_land_antipodal(result):
    assert result["antipodal"] < 1e-12


def test_spinor_turns_the_same_way_as_vectors(result):
    assert result["covariant"] < 1e-12


def test_spatial_rotations_keep_chirality(result):
    assert result["chiral"] < 1e-12
