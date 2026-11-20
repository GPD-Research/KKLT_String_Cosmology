// Clifford algebra for the spinor panel: Euclidean gamma matrices built from Pauli tensor products.
// gammas(d) returns d matrices of size 2^floor(d/2) with {γ_a, γ_b} = 2δ_ab; a Lorentzian time
// direction is γ⁰ = i·γ_d. Matrices and spinors are arrays of complex numbers [re, im].
(function (root) {
  const C = (re, im = 0) => [re, im];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const PAULI = {
    1: [[C(1), C(0)], [C(0), C(1)]],
    x: [[C(0), C(1)], [C(1), C(0)]],
    y: [[C(0), C(0, -1)], [C(0, 1), C(0)]],
    z: [[C(1), C(0)], [C(0), C(-1)]],
  };
  function kron(A, B) {
    const n = A.length, m = B.length, out = [];
    for (let i = 0; i < n * m; i++) {
      out.push([]);
      for (let j = 0; j < n * m; j++) out[i].push(mul(A[Math.floor(i / m)][Math.floor(j / m)], B[i % m][j % m]));
    }
    return out;
  }
  function gammas(d) {
    const k = Math.floor(d / 2), out = [];
    for (let j = 0; j < k; j++)
      for (const s of ["x", "y"]) {
        let M = [[C(1)]];
        for (let i = 0; i < k; i++) M = kron(M, PAULI[i < j ? "z" : i === j ? s : 1]);
        out.push(M);
      }
    if (d % 2) {
      let M = [[C(1)]];
      for (let i = 0; i < k; i++) M = kron(M, PAULI.z);
      out.push(M);
    }
    return out;
  }
  const apply = (M, v) => M.map((row) => row.reduce((s, m, j) => add(s, mul(m, v[j])), C(0)));
  const matmul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => add(s, mul(a, B[k][j])), C(0))));
  // Spin lift of a rotation by θ in the (a, b) plane: S = cos(θ/2) + sin(θ/2) γ_a γ_b. S(2π) = −1.
  function rotate(G, a, b, theta, v) {
    const w = apply(G[a], apply(G[b], v)), c = Math.cos(theta / 2), s = Math.sin(theta / 2);
    return v.map((x, i) => [c * x[0] + s * w[i][0], c * x[1] + s * w[i][1]]);
  }
  const norm = (v) => Math.sqrt(v.reduce((s, x) => s + x[0] * x[0] + x[1] * x[1], 0));
  const api = { gammas, apply, matmul, rotate, norm, kron };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Spinors = api;
})(this);
