// String on a circle of radius R, in units alpha' = 1. Bosonic (26-D) or Type II superstring (10-D, RNS).
// Closed: alpha'M^2 = k^2/R^2 + w^2 R^2 + 2(N - a + Nt - at), with (N - a) - (Nt - at) = k w.
// Open (Dirichlet along the circle, ends on two branes a distance L apart):
//   alpha'M^2 = (L / 2pi)^2 + N - a.
// Intercept a = 1 (bosonic), 1/2 (NS sector), 0 (R sector). Superstring levels N = n q + r include
// one worldsheet fermion psi_{-r}: r in Z + 1/2 (NS) or Z (R); r = 0 means no fermion quantum.
// GSO: NS states need an odd number of psi quanta; R states keep one chirality (16 of 32 components).
// Mirrored in src/analysis/string_spectrum.py; keep the two in sync.
(function (root) {
  const TOL = 1e-9;
  const TAU = 2 * Math.PI;

  const level = (bank) => bank.n * bank.q;
  const amplitude = (bank) => (bank.q > 0 ? Math.sqrt((2 * bank.q) / bank.n) : 0);
  const isSuper = (cfg) => cfg.theory === "super";
  const levelOf = (cfg, b) => level(b) + (isSuper(cfg) ? b.r : 0);
  const intercept = (cfg, b) => (isSuper(cfg) ? (b.sector === "NS" ? 0.5 : 0) : 1);
  const gsoKept = (cfg, b) => !isSuper(cfg) || !cfg.gso || b.sector === "R" || b.r > 0;
  const excess = (cfg, b) => levelOf(cfg, b) - intercept(cfg, b);

  function massSquared(cfg) {
    if (cfg.mode === "open") return (cfg.L / TAU) ** 2 + excess(cfg, cfg.left);
    const { k, w, R } = cfg;
    return (k / R) ** 2 + (w * R) ** 2 + 2 * (excess(cfg, cfg.left) + excess(cfg, cfg.right));
  }

  const levelMatched = (cfg) =>
    cfg.mode === "open" || Math.abs(excess(cfg, cfg.left) - excess(cfg, cfg.right) - cfg.k * cfg.w) < TOL;

  const state = (name, symbol, detail, extra = {}) => ({ name, symbol, detail, ...extra });
  const compact = (pol) => pol === "y";

  function closedTensor(pl, pr, osc) {
    if (!compact(pl) && !compact(pr)) {
      if (pl === pr)
        return [state("Graviton", "g_μν", `symmetric tensor ${osc}; its trace part is the Dilaton Φ`)];
      return [
        state("Graviton", "g_μν", `symmetric half of ${osc}`),
        state("Kalb–Ramond field", "B_μν", `antisymmetric half of ${osc}`),
      ];
    }
    if (compact(pl) && compact(pr))
      return [state("Radion", "σ", "size of the extra dimension, the 1-D analogue of KKLT's volume modulus t")];
    return [
      state("Graviphoton", "A_μ", "Kaluza–Klein photon from g_μy"),
      state("Winding photon", "B_μ", "vector from B_μy"),
    ];
  }

  // Massless Type II closed states, named by their 10-D fields.
  function superMassless(cfg) {
    const L = cfg.left, Rb = cfg.right, A = cfg.type === "IIA";
    if (L.sector === "NS" && Rb.sector === "NS") return closedTensor(L.fpol, Rb.fpol, "ψ₋½ ψ̃₋½");
    // Without GSO, the R ground state keeps both chiralities: 16 ⊗ 16 = 256 R–R states holding every form.
    if (L.sector === "R" && Rb.sector === "R" && !cfg.gso)
      return [["axions", "C_0", 2], ["1-forms", "C_1", 16], ["2-forms", "C_2", 56], ["3-forms", "C_3", 112], ["4-forms", "C_4", 70]].map(
        ([n, sym, k]) => state(`Ramond–Ramond ${n}`, sym, `${k} of the 256 unprojected R–R states (both chiralities)`, { share: k }));
    if (L.sector === "R" && Rb.sector === "R")
      return A
        ? [
            state("Ramond–Ramond 1-form", "C_1", "8 of the 64 R–R states; couples to D0-branes", { share: 8 }),
            state("Ramond–Ramond 3-form", "C_3", "56 of the 64 R–R states; couples to D2-branes", { share: 56 }),
          ]
        : [
            state("Ramond–Ramond axion", "C_0", "1 of the 64 R–R states; couples to D-instantons", { share: 1 }),
            state("Ramond–Ramond 2-form", "C_2", "28 of the 64 R–R states; F₃ = dC₂ is one of KKLT's fluxes", { share: 28 }),
            state("Ramond–Ramond 4-form", "C_4", "35 of the 64 R–R states, self-dual; couples to D3-branes like KKLT's anti-D3", { share: 35 }),
          ];
    const ns = L.sector === "NS" ? L : Rb;
    const chir = !cfg.gso ? "both chiralities without GSO" : A ? "opposite chirality to its mirror (Type IIA)" : "same chirality as its mirror (Type IIB)";
    if (compact(ns.fpol)) return [state("Spin-½ fermion", "ψ_y", `the gravitino's part along the circle, spin ½ in 9-D; ${chir}`)];
    if (!cfg.gso) return [
      state("Gravitini", "ψ_μ", "spin 3/2, both chiralities without GSO; 112 of 128 states", { share: 112 }),
      state("Dilatini", "λ", "spin ½, both chiralities; 16 of 128 states", { share: 16 }),
    ];
    return [
      state("Gravitino", "ψ_μ", `spin 3/2, the graviton's superpartner; 56 of 64 states; ${chir}`, { share: 56 }),
      state("Dilatino", "λ", "spin ½, the dilaton's superpartner; 8 of 64 states", { share: 8 }),
    ];
  }

  function combine(parts, extra) {
    return state(
      parts.map((p) => p.name).join(" + "),
      parts.map((p) => p.symbol).join(" + "),
      parts.map((p) => p.detail).join("; "),
      { parts, ...extra }
    );
  }

  function massiveCopies(parts, cfg, base) {
    const kind = cfg.k !== 0 ? "Kaluza–Klein" : "winding";
    const tag = cfg.k !== 0 ? `(k=${cfg.k})` : `(w=${cfg.w})`;
    return combine(
      parts.map((p) => state(`${p.name}, ${kind} mode`, `${p.symbol}${tag}`, `massive copy: ${p.detail}`, p.share ? { share: p.share } : {})),
      base
    );
  }

  function classifySuper(cfg, base) {
    const lowest = (b) => b.q === 0 && b.r === (b.sector === "NS" ? 0.5 : 0);
    const massive = state("Massive string state", "—", "no named particle; one level of a massive supermultiplet", base);
    if (cfg.mode === "open") {
      const b = cfg.left;
      if (!lowest(b)) return massive;
      if (b.sector === "R")
        return cfg.L === 0
          ? state("Photino", "λ", `massless spin-½ superpartner of the photon (a gaugino), a ${cfg.gso ? "16" : "32"}-component spinor`, base)
          : state("W-ino", "W̃±", "massive spin-½ superpartner of the stretched-string W boson", base);
      if (!compact(b.fpol))
        return cfg.L === 0
          ? state("Photon", "γ", "massless U(1) gauge field A_μ living on the brane", base)
          : state("W boson", "W±", "string stretched between separated branes: a massive gauge boson (Higgs mechanism)", base);
      return cfg.L === 0
        ? state("Brane-position scalar", "φ", "fermion quantum along the Dirichlet direction moves the brane", base)
        : state("Massive scalar", "φ", "stretched-string mode along the Dirichlet direction", base);
    }
    if (lowest(cfg.left) && lowest(cfg.right)) {
      const parts = superMassless(cfg);
      return base.massless ? combine(parts, base) : massiveCopies(parts, cfg, base);
    }
    if (base.massless) return state("Massless scalar", "φ", "extra massless state at a special radius", base);
    return massive;
  }

  function classify(cfg) {
    const sup = isSuper(cfg), open = cfg.mode === "open";
    const m2 = massSquared(cfg);
    const N = levelOf(cfg, cfg.left);
    const Nt = open ? 0 : levelOf(cfg, cfg.right);
    const gso = gsoKept(cfg, cfg.left) && (open || gsoKept(cfg, cfg.right));
    const lm = levelMatched(cfg);
    const fermion = sup && (open ? cfg.left.sector === "R" : (cfg.left.sector === "R") !== (cfg.right.sector === "R"));
    const base = { m2, N, Nt, massless: Math.abs(m2) < TOL, physical: lm && gso, gso, fermion };

    if (!gso)
      return state("Removed by the GSO projection", "—", "NS states need an odd number of ψ quanta; this one has none", base);
    if (!lm)
      return state("Not a physical state", "—", sup ? "level matching N − a = Ñ − ã + kw fails" : "level matching N − Ñ = kw fails", base);
    if (m2 < -TOL)
      return state("Tachyon", "T", sup ? "M² < 0: the NS ground state, which the GSO projection removes" : "M² < 0: the bosonic string's unstable ground state", base);
    if (sup) return classifySuper(cfg, base);

    if (open) {
      const pol = cfg.left.pol;
      if (N === 1 && cfg.left.n === 1) {
        if (!compact(pol))
          return cfg.L === 0
            ? state("Photon", "γ", "massless U(1) gauge field A_μ living on the brane", base)
            : state("W boson", "W±", "string stretched between separated branes: a massive gauge boson (Higgs mechanism)", base);
        return cfg.L === 0
          ? state("Brane-position scalar", "φ", "oscillation along the Dirichlet direction moves the brane", base)
          : state("Massive scalar", "φ", "stretched-string mode along the Dirichlet direction", base);
      }
      if (base.massless) return state("Massless scalar", "φ", "stretched ground state at L = 2π√α′", base);
      return state("Massive string state", "—", `no named particle; spin up to ${N}`, base);
    }

    if (N === 1 && Nt === 1) {
      const parts = closedTensor(cfg.left.pol, cfg.right.pol, "α₋₁ α̃₋₁");
      return base.massless ? combine(parts, base) : massiveCopies(parts, cfg, base);
    }
    if (base.massless) {
      const bank = N === 1 ? cfg.left : Nt === 1 ? cfg.right : null;
      if (bank && !compact(bank.pol))
        return state("W gauge boson", "W±", "extra massless vector at the self-dual radius R = √α′ (SU(2) symmetry)", base);
      return state("Massless scalar", "φ", "extra massless scalar at a special radius", base);
    }
    return state("Massive string state", "—", `no named particle; spin up to ${N + Nt}`, base);
  }

  // Classical coherent-state picture of one excited bosonic mode per bank (fermions do not move X).
  function shape(cfg, tau, points = 256) {
    const open = cfg.mode === "open";
    const span = open ? Math.PI : TAU;
    const out = [];
    for (let i = 0; i <= points; i++) {
      const s = (span * i) / points;
      const p = { s, x1: 0, x2: 0, y: 0 };
      if (open) {
        const b = cfg.left;
        const a = amplitude(b) * Math.cos(b.n * tau);
        p.y = (cfg.L * s) / Math.PI;
        if (compact(b.pol)) p.y += a * Math.sin(b.n * s);
        else p[b.pol] += a * Math.cos(b.n * s);
      } else {
        p.y = (cfg.k / cfg.R) * tau + cfg.w * cfg.R * s;
        const L = cfg.left, Rb = cfg.right;
        p[L.pol] += amplitude(L) * Math.cos(L.n * (tau + s));
        p[Rb.pol] += amplitude(Rb) * Math.cos(Rb.n * (tau - s));
      }
      out.push(p);
    }
    return out;
  }

  // On a circle, T-duality also maps Type IIA to Type IIB.
  const tDual = (cfg) => ({
    ...cfg, k: cfg.w, w: cfg.k, R: 1 / cfg.R,
    ...(isSuper(cfg) ? { type: cfg.type === "IIA" ? "IIB" : "IIA" } : {}),
  });

  const api = { massSquared, levelMatched, classify, shape, tDual, level, levelOf, intercept, gsoKept, amplitude };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Strings = api;
})(this);
