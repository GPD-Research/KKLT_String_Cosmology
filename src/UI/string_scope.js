(() => {
  const S = window.Strings;
  const $ = (id) => document.getElementById(id);
  const POLS = [["x1", "x¹"], ["x2", "x²"], ["y", "y (compact)"]];
  const bank = (n, q, pol, sector = "NS", r = 0, fpol = "x1") => ({ n, q, pol, sector, r, fpol });
  // Superstring bank: worldsheet fermion psi_{-r} in sector NS or R, plus an optional X oscillator.
  const sb = (sector, r, fpol, n = 1, q = 0, pol = "x1") => bank(n, q, pol, sector, r, fpol);
  const FERMION_MODES = { NS: [[0, "none"], [0.5, "ψ₋½"], [1.5, "ψ₋3/2"]], R: [[0, "none (spinor)"], [1, "ψ₋₁"]] };

  const PRESETS = {
    "Graviton g_μν": { mode: "closed", left: bank(1, 1, "x1"), right: bank(1, 1, "x1"), k: 0, w: 0, R: 1.5 },
    "Graviton + Kalb–Ramond B_μν": { mode: "closed", left: bank(1, 1, "x1"), right: bank(1, 1, "x2"), k: 0, w: 0, R: 1.5 },
    "Radion σ": { mode: "closed", left: bank(1, 1, "y"), right: bank(1, 1, "y"), k: 0, w: 0, R: 1.5 },
    "Graviphoton A_μ": { mode: "closed", left: bank(1, 1, "x1"), right: bank(1, 1, "y"), k: 0, w: 0, R: 1.5 },
    "Closed tachyon T": { mode: "closed", left: bank(1, 0, "x1"), right: bank(1, 0, "x1"), k: 0, w: 0, R: 1.5 },
    "Kaluza–Klein graviton (k = 1)": { mode: "closed", left: bank(1, 1, "x1"), right: bank(1, 1, "x1"), k: 1, w: 0, R: 1.5 },
    "Winding graviton (w = 1)": { mode: "closed", left: bank(1, 1, "x1"), right: bank(1, 1, "x2"), k: 0, w: 1, R: 1.5 },
    "W± at self-dual radius": { mode: "closed", left: bank(1, 1, "x1"), right: bank(1, 0, "x1"), k: 1, w: 1, R: 1 },
    "Massive level (2, 2)": { mode: "closed", left: bank(2, 1, "x1"), right: bank(1, 2, "x2"), k: 0, w: 0, R: 1.5 },
    "Open: photon γ": { mode: "open", left: bank(1, 1, "x1"), L: 0, R: 1.5 },
    "Open: W± boson (stretched)": { mode: "open", left: bank(1, 1, "x1"), L: 4, R: 1.5 },
    "Open: brane-position scalar φ": { mode: "open", left: bank(1, 1, "y"), L: 0, R: 1.5 },
    "Open: tachyon T": { mode: "open", left: bank(1, 0, "x1"), L: 0, R: 1.5 },
  };

  const SUPER_PRESETS = {
    "Graviton g_μν (NS–NS)": { mode: "closed", left: sb("NS", 0.5, "x1"), right: sb("NS", 0.5, "x1"), k: 0, w: 0, R: 1.5 },
    "Graviton + Kalb–Ramond B_μν": { mode: "closed", left: sb("NS", 0.5, "x1"), right: sb("NS", 0.5, "x2"), k: 0, w: 0, R: 1.5 },
    "Radion σ": { mode: "closed", left: sb("NS", 0.5, "y"), right: sb("NS", 0.5, "y"), k: 0, w: 0, R: 1.5 },
    "Graviphoton A_μ": { mode: "closed", left: sb("NS", 0.5, "x1"), right: sb("NS", 0.5, "y"), k: 0, w: 0, R: 1.5 },
    "Gravitino ψ_μ + dilatino λ (NS–R)": { mode: "closed", left: sb("NS", 0.5, "x1"), right: sb("R", 0, "x1"), k: 0, w: 0, R: 1.5 },
    "Ramond–Ramond forms (R–R)": { mode: "closed", left: sb("R", 0, "x1"), right: sb("R", 0, "x1"), k: 0, w: 0, R: 1.5 },
    "Tachyon, removed by GSO": { mode: "closed", left: sb("NS", 0, "x1"), right: sb("NS", 0, "x1"), k: 0, w: 0, R: 1.5 },
    "Kaluza–Klein graviton (k = 1)": { mode: "closed", left: sb("NS", 0.5, "x1"), right: sb("NS", 0.5, "x1"), k: 1, w: 0, R: 1.5 },
    "Winding graviton (w = 1)": { mode: "closed", left: sb("NS", 0.5, "x1"), right: sb("NS", 0.5, "x2"), k: 0, w: 1, R: 1.5 },
    "Massive level α₋₁ψ₋½ ⊗ α̃₋₁ψ̃₋½": { mode: "closed", left: sb("NS", 0.5, "x1", 1, 1, "x1"), right: sb("NS", 0.5, "x2", 1, 1, "x2"), k: 0, w: 0, R: 1.5 },
    "Open: photon γ": { mode: "open", left: sb("NS", 0.5, "x1"), L: 0, R: 1.5 },
    "Open: photino λ": { mode: "open", left: sb("R", 0, "x1"), L: 0, R: 1.5 },
    "Open: W± boson (stretched)": { mode: "open", left: sb("NS", 0.5, "x1"), L: 4, R: 1.5 },
    "Open: W-ino W̃± (stretched)": { mode: "open", left: sb("R", 0, "x1"), L: 4, R: 1.5 },
    "Open: brane-position scalar φ": { mode: "open", left: sb("NS", 0.5, "y"), L: 0, R: 1.5 },
    "Open: tachyon, removed by GSO": { mode: "open", left: sb("NS", 0, "x1"), L: 0, R: 1.5 },
  };
  const presets = () => (cfg.theory === "super" ? SUPER_PRESETS : PRESETS);

  let cfg = { theory: "bosonic", type: "IIB", gso: true, mode: "closed", left: bank(1, 1, "x1"), right: bank(1, 1, "x1"), k: 0, w: 0, R: 1.5, L: 0 };
  let tau = 0, playing = true, lastT = performance.now(), dirty = true;

  // ---------- controls ----------
  function bankHTML(id, title) {
    const opts = POLS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
    return `<div class="bank" id="${id}"><h2 style="margin:.3rem 0">${title}</h2>
      <div class="ctl"><label>Mode number n <b id="${id}-n-v"></b></label><input type="range" id="${id}-n" min="1" max="4" step="1"></div>
      <div class="ctl"><label>Quanta q <b id="${id}-q-v"></b></label><input type="range" id="${id}-q" min="0" max="3" step="1"></div>
      <div class="ctl row"><label style="flex:1">Polarization</label><select id="${id}-pol">${opts}</select></div>
      <div class="super-only">
        <div class="ctl row"><label style="flex:1">Fermion sector</label><select id="${id}-sec"><option value="NS">NS (antiperiodic)</option><option value="R">R (periodic)</option></select></div>
        <div class="ctl row"><label style="flex:1">Fermion ψ</label><select id="${id}-r"></select></div>
        <div class="ctl row"><label style="flex:1">ψ polarization</label><select id="${id}-fpol">${opts}</select></div>
      </div></div>`;
  }
  $("banks").innerHTML = bankHTML("left", "Left movers α") + bankHTML("right", "Right movers α̃");

  function fillPresets() {
    $("preset").innerHTML = `<option value="" disabled>(choose a state)</option>` +
      Object.keys(presets()).map((k) => `<option>${k}</option>`).join("");
  }
  fillPresets();

  function syncControls() {
    for (const id of ["R", "k", "w", "L"]) $(id).value = cfg[id];
    for (const b of ["left", "right"]) {
      $(`${b}-n`).value = cfg[b].n; $(`${b}-q`).value = cfg[b].q; $(`${b}-pol`).value = cfg[b].pol;
      $(`${b}-sec`).value = cfg[b].sector; $(`${b}-fpol`).value = cfg[b].fpol;
      $(`${b}-r`).innerHTML = FERMION_MODES[cfg[b].sector].map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
      $(`${b}-r`).value = cfg[b].r;
    }
    const open = cfg.mode === "open", sup = cfg.theory === "super";
    $("m-closed").classList.toggle("on", !open); $("m-open").classList.toggle("on", open);
    $("t-bos").classList.toggle("on", !sup); $("t-sup").classList.toggle("on", sup);
    $("ty-IIA").classList.toggle("on", cfg.type === "IIA"); $("ty-IIB").classList.toggle("on", cfg.type === "IIB");
    $("gso").checked = cfg.gso;
    document.querySelectorAll(".closed-only, .open-only, .super-only").forEach((e) => {
      const c = e.classList;
      const hide = (c.contains("closed-only") && open) || (c.contains("open-only") && !open) || (c.contains("super-only") && !sup);
      e.style.display = hide ? "none" : "";
    });
    $("right").style.display = open ? "none" : "";
    const ab = sup ? "α, ψ" : "α";
    $("left").querySelector("h2").textContent = open ? `Oscillators ${ab} (ends tie left and right movers together)` : `Left movers ${ab}`;
    $("right").querySelector("h2").textContent = sup ? "Right movers α̃, ψ̃" : "Right movers α̃";
    $("tdual").textContent = sup ? "T-duality: R → 1/R, k ↔ w, IIA ↔ IIB" : "T-duality: R → 1/R, k ↔ w";
    $("subtitle").textContent = sup
      ? `Type ${cfg.type} superstring on a circle of radius R, in units α′ = 1. Each knob setting is one quantum state.`
      : "Bosonic string on a circle of radius R, in units α′ = 1. Each knob setting is one quantum state.";
    $("note").textContent = sup ? SUPER_NOTE : BOSONIC_NOTE;
    $("R-v").textContent = Number(cfg.R.toFixed(2)) + (Math.abs(cfg.R - 1) < 1e-9 ? " (self-dual)" : "");
    $("k-v").textContent = cfg.k; $("w-v").textContent = cfg.w; $("L-v").textContent = cfg.L.toFixed(1);
    for (const b of ["left", "right"]) { $(`${b}-n-v`).textContent = cfg[b].n; $(`${b}-q-v`).textContent = cfg[b].q; }
    $("spd-v").textContent = Number($("spd").value).toFixed(1);
    dirty = true;
  }

  // Read only the control that moved: after T-duality R = 1/R may sit between slider steps, and
  // re-reading every slider would snap it and change the spectrum.
  function readControls(el) {
    if (["R", "k", "w", "L"].includes(el.id)) cfg[el.id] = Number(el.value);
    for (const b of ["left", "right"]) {
      if (!el.id.startsWith(`${b}-`)) continue;
      const sector = $(`${b}-sec`).value;
      // A new sector starts at its lowest fermion mode: psi_{-1/2} in NS, the spinor ground state in R.
      const r = el.id === `${b}-sec` ? (sector === "NS" ? 0.5 : 0) : Number($(`${b}-r`).value);
      cfg[b] = bank(Number($(`${b}-n`).value), Number($(`${b}-q`).value), $(`${b}-pol`).value, sector, r, $(`${b}-fpol`).value);
    }
    $("preset").value = "";
    syncControls(); updatePanel();
  }
  document.querySelectorAll("#controls input[type=range], #controls select:not(#preset):not(#persist)").forEach((el) =>
    el.addEventListener("input", () => (el.id === "spd" ? syncControls() : readControls(el)))
  );
  $("preset").addEventListener("change", (e) => {
    const p = presets()[e.target.value];
    cfg = { ...cfg, k: 0, w: 0, L: 0, right: cfg.theory === "super" ? sb("NS", 0.5, "x1") : bank(1, 0, "x1"), ...structuredClone(p) };
    syncControls(); updatePanel(); $("preset").value = e.target.value;
  });
  function setTheory(theory) {
    cfg.theory = theory; fillPresets();
    $("preset").value = Object.keys(presets())[0];
    $("preset").dispatchEvent(new Event("change"));
  }
  $("t-bos").onclick = () => setTheory("bosonic");
  $("t-sup").onclick = () => setTheory("super");
  for (const t of ["IIA", "IIB"]) $(`ty-${t}`).onclick = () => { cfg.type = t; syncControls(); updatePanel(); };
  $("gso").onchange = () => { cfg.gso = $("gso").checked; syncControls(); updatePanel(); };
  $("m-closed").onclick = () => { cfg.mode = "closed"; syncControls(); updatePanel(); };
  $("m-open").onclick = () => { cfg.mode = "open"; syncControls(); updatePanel(); };
  $("tdual").onclick = () => {
    cfg = S.tDual(cfg);
    syncControls(); updatePanel();
  };
  $("play").onclick = () => { playing = !playing; $("play").textContent = playing ? "Pause" : "Play"; };

  // ---------- readouts & equations ----------
  const sub = (s) => s.replace(/_([^\s(+]+)/g, "<sub>$1</sub>");
  // Halves print as fractions (½, 3/2); anything else as a decimal.
  const hf = (x) => {
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x)).replace("-", "−");
    const t = Math.round(2 * x);
    if (Math.abs(2 * x - t) > 1e-9) return f(x, 3);
    return (t < 0 ? "−" : "") + (Math.abs(t) === 1 ? "½" : `${Math.abs(t)}/2`);
  };
  const BOSONIC_NOTE = $("note").textContent;
  const SUPER_NOTE = "This is the Type II superstring in the RNS formalism (10-D; the GSO projection removes the tachyon) with one dimension curled into a circle. KKLT is built on Type IIB, on a 6-D Calabi–Yau rather than one circle. The massless states are fermion ψ quanta with X at rest, so CH 1 shows a point for them and CH 5 shows ψ. ψ is Grassmann-valued, so CH 5 draws it as a turning phase, an analogy; the twist it shows (NS antiperiodic, R periodic) is exact. T-duality on the circle maps Type IIA on radius R to Type IIB on α′/R.";
  const f = (x, d = 2) => (Math.abs(x) < 5e-13 ? "0" : Number(x.toFixed(d)).toString());
  const sgn = (x, d = 2) => (x < 0 ? `− ${f(-x, d)}` : `+ ${f(x, d)}`);
  let prevTerms = {};

  function renderEq(lines) {
    const terms = {};
    $("eq").innerHTML = lines.map((ln) => `<div class="ln">${ln.map(([id, h]) => {
      if (!id) return h;
      terms[id] = h;
      return `<span class="t" data-id="${id}">${h}</span>`;
    }).join(" ")}</div>`).join("");
    $("eq").querySelectorAll("span.t").forEach((el) => {
      if (prevTerms[el.dataset.id] !== undefined && prevTerms[el.dataset.id] !== terms[el.dataset.id]) {
        el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 700);
      }
    });
    prevTerms = terms;
  }

  const polSym = (p) => ({ x1: "x<sup>1</sup>", x2: "x<sup>2</sup>", y: "δy" })[p];
  const oscTerm = (b, arg, trig) =>
    b.q === 0 ? "0" : `${f(S.amplitude(b))} ${trig} ${b.n === 1 ? "" : b.n}(${arg})`;

  const fSym = (p) => ({ x1: "ψ<sup>1</sup>", x2: "ψ<sup>2</sup>", y: "ψ<sup>y</sup>" })[p];
  const fermTerm = (b, arg) =>
    b.r > 0 ? `ψ<sub>−${hf(b.r)}</sub> e<sup>−i${hf(b.r)}(${arg})</sup>` : b.sector === "R" ? "ψ<sub>0</sub> (zero mode: spinor)" : "0";
  const secNote = (b) => `<span class="num">(${b.sector}: r ∈ ${b.sector === "NS" ? "ℤ + ½" : "ℤ"})</span>`;
  const gsoMark = (b) => (S.gsoKept(cfg, b) ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>');

  function superEquations(st) {
    const L = cfg.left, Rb = cfg.right, a = S.intercept(cfg, L), at = S.intercept(cfg, Rb);
    const gsoLine = (sides) => [["", "GSO:"], ["gso", sides.map(([lab, b]) => `${lab} ${b.sector} ${gsoMark(b)}`).join(", ")],
      ["", `<span class="num">${cfg.gso ? "NS needs odd ψ number; R keeps one chirality" : "projection off"}</span>`]];
    if (cfg.mode === "open") {
      return renderEq([
        [["", "<i>y</i>(σ,τ) = <i>y</i><sub>A</sub> +"], ["L", `(${f(cfg.L, 1)}/π)σ`], ["", "+ δy,"], ["", '<span class="num">Dirichlet: both ends fixed on branes</span>']],
        [["", `${polSym(L.pol)} ⊃`], ["osc", L.pol === "y" ? `${oscTerm(L, "τ", "cos")}·sin ${L.n === 1 ? "" : L.n}σ` : `${oscTerm(L, "τ", "cos")}·cos ${L.n === 1 ? "" : L.n}σ`]],
        [["", `${fSym(L.fpol)} ⊃`], ["fL", fermTerm(L, "τ+σ")], ["", secNote(L)]],
        [["", "α′M² = (<i>L</i>/2π)² + <i>N</i> − <i>a</i> ="], ["Lm", f((cfg.L / (2 * Math.PI)) ** 2, 3)], ["", "+"], ["N", hf(st.N)], ["", "−"], ["a", hf(a)], ["", "="], ["m2", `<b>${f(st.m2, 3)}</b>`]],
        [["", "<i>N</i> = <i>nq</i> + <i>r</i> ="], ["Nn", `${L.n}·${L.q} + ${hf(L.r)}`], ["", `, <i>a</i> = ½ (NS), 0 (R)`]],
        gsoLine([["", L]]),
      ]);
    }
    const ex = st.N - a - (st.Nt - at), lm = Math.abs(ex - cfg.k * cfg.w) < 1e-9;
    renderEq([
      [["", "<i>y</i>(σ,τ) = <i>y</i><sub>0</sub> + α′(<i>k</i>/<i>R</i>)τ + <i>wR</i>σ + δy ="], ["kR", `${f(cfg.k / cfg.R)}τ`], ["wR", sgn(cfg.w * cfg.R) + "σ"], ["", "+ δy"]],
      [["", `${polSym(L.pol)} ⊃`], ["oL", oscTerm(L, "τ+σ", "cos")], ["", `&nbsp; ${polSym(Rb.pol)} ⊃`], ["oR", oscTerm(Rb, "τ−σ", "cos")]],
      [["", `${fSym(L.fpol)} ⊃`], ["fL", fermTerm(L, "τ+σ")], ["", secNote(L)]],
      [["", `${fSym(Rb.fpol).replace("ψ", "ψ̃")} ⊃`], ["fR", fermTerm(Rb, "τ−σ")], ["", secNote(Rb)]],
      [["", "α′M² = <i>k</i>²/<i>R</i>² + <i>w</i>²<i>R</i>² + 2(<i>N</i> − <i>a</i> + <i>Ñ</i> − <i>ã</i>), <span class=\"num\">a = ½ (NS), 0 (R)</span>"]],
      [["", "&nbsp;&nbsp;="], ["k2", f((cfg.k / cfg.R) ** 2, 3)], ["", "+"], ["w2", f((cfg.w * cfg.R) ** 2, 3)], ["", "+ 2("],
        ["N", hf(st.N)], ["", "−"], ["a", hf(a)], ["", "+"], ["Nt", hf(st.Nt)], ["", "−"], ["at", hf(at)], ["", ") ="], ["m2", `<b>${f(st.m2, 3)}</b>`]],
      [["", "<i>N</i> = <i>nq</i> + <i>r</i> ="], ["Nn", `${L.n}·${L.q} + ${hf(L.r)}`], ["", ", <i>Ñ</i> ="], ["Ntn", `${Rb.n}·${Rb.q} + ${hf(Rb.r)}`]],
      [["", "(<i>N</i> − <i>a</i>) − (<i>Ñ</i> − <i>ã</i>) ="], ["lm", `${hf(ex)} ${lm ? "=" : "≠"} ${cfg.k * cfg.w} = kw <span class="${lm ? "ok" : "bad"}">${lm ? "✓" : "✗"}</span>`]],
      gsoLine([["left", L], ["right", Rb]]),
    ]);
  }

  function ladder(st) {
    const sides = cfg.mode === "open" ? [["ψ", cfg.left, st.N]] : [["left", cfg.left, st.N], ["right", cfg.right, st.Nt]];
    $("ladder").innerHTML = "<h2>GSO mask: levels N on each side</h2>" + sides.map(([lab, b, N]) => {
      const levels = b.sector === "NS" ? [0, 0.5, 1, 1.5, 2, 2.5] : [0, 1, 2, 3];
      const chips = levels.map((n) => {
        const kept = !cfg.gso || b.sector === "R" || n % 1 !== 0;
        return `<span class="chip ${kept ? "keep" : "drop"}${Math.abs(n - N) < 1e-9 ? " cur" : ""}">${hf(n)}</span>`;
      }).join("");
      const note = b.sector === "R"
        ? cfg.gso ? "R: every level kept, with one spinor chirality (16 of 32 components)" : "R: projection off, both chiralities (32 components)"
        : cfg.gso ? "NS: half-integer N kept (odd ψ number); integer N removed" : "NS: projection off, all kept";
      const here = levels.some((n) => Math.abs(n - N) < 1e-9) ? "" : ` · this state: N = ${hf(N)}`;
      return `<div class="lad"><span class="lab">${lab} ${b.sector}</span>${chips}<span class="lnote">${note}${here}</span></div>`;
    }).join("");
  }

  function equations(st) {
    if (cfg.theory === "super") return superEquations(st);
    const L = cfg.left, Rb = cfg.right;
    if (cfg.mode === "open") {
      const lines = [
        [["", "<i>y</i>(σ,τ) = <i>y</i><sub>A</sub> +"], ["L", `(${f(cfg.L, 1)}/π)σ`], ["", "+ δy,"], ["", '<span class="num">Dirichlet: both ends fixed on branes</span>']],
        [["", `${polSym(L.pol)}(σ,τ) ⊃`], ["osc", L.pol === "y" ? `${oscTerm(L, "τ", "cos")}·sin ${L.n === 1 ? "" : L.n}σ` : `${oscTerm(L, "τ", "cos")}·cos ${L.n === 1 ? "" : L.n}σ`],
          ["", `<span class="num">a = √(2q/n) = √(2·${L.q}/${L.n})</span>`]],
        [["", "α′M² = (<i>L</i>/2π)² + <i>N</i> − 1 ="], ["Lm", f((cfg.L / (2 * Math.PI)) ** 2, 3)], ["", "+"], ["N", `${st.N}`], ["", "− 1 ="], ["m2", `<b>${f(st.m2, 3)}</b>`]],
        [["", "<i>N</i> = <i>n</i>·<i>q</i> ="], ["Nn", `${L.n}·${L.q} = ${st.N}`]],
      ];
      return renderEq(lines);
    }
    const lm = st.N - st.Nt === cfg.k * cfg.w;
    renderEq([
      [["", "<i>y</i>(σ,τ) = <i>y</i><sub>0</sub> + α′(<i>k</i>/<i>R</i>)τ + <i>wR</i>σ + δy ="], ["kR", `${f(cfg.k / cfg.R)}τ`], ["wR", sgn(cfg.w * cfg.R) + "σ"], ["", "+ δy"]],
      [["", `${polSym(L.pol)} ⊃`], ["oL", oscTerm(L, "τ+σ", "cos")], ["", '<span class="num">(left)</span>'],
        ["", `&nbsp; ${polSym(Rb.pol)} ⊃`], ["oR", oscTerm(Rb, "τ−σ", "cos")], ["", '<span class="num">(right)</span>']],
      [["", "α′M² = <i>k</i>²/<i>R</i>² + <i>w</i>²<i>R</i>² + 2(<i>N</i> + <i>Ñ</i> − 2)"]],
      [["", "&nbsp;&nbsp;="], ["k2", f((cfg.k / cfg.R) ** 2, 3)], ["", "+"], ["w2", f((cfg.w * cfg.R) ** 2, 3)], ["", "+ 2("],
        ["N", `${st.N}`], ["", "+"], ["Nt", `${st.Nt}`], ["", "− 2) ="], ["m2", `<b>${f(st.m2, 3)}</b>`]],
      [["", "<i>N</i> = <i>n</i>·<i>q</i> ="], ["Nn", `${L.n}·${L.q}`], ["", ", <i>Ñ</i> ="], ["Ntn", `${Rb.n}·${Rb.q}`],
        ["", "; <i>N</i> − <i>Ñ</i> ="], ["lm", `${st.N - st.Nt} ${lm ? "=" : "≠"} ${cfg.k * cfg.w} <span class="${lm ? "ok" : "bad"}">${lm ? "✓" : "✗"}</span>`]],
    ]);
  }

  function updatePanel() {
    if (cfg.theory === "super") spSync();
    const st = S.classify(cfg);
    $("p-sym").innerHTML = sub(st.symbol);
    $("p-sym").style.fontSize = st.symbol.length > 12 ? "2rem" : "";
    $("p-sym").classList.toggle("bad", !st.physical || st.m2 < -1e-9);
    $("p-name").textContent = st.name;
    $("p-detail").textContent = st.parts && st.parts.length > 1 ? (st.parts[0].share ? `${st.parts.reduce((t, q) => t + q.share, 0)} states at this level, split into:` : "superposition, split into:") : st.detail;
    $("p-parts").innerHTML = st.parts && st.parts.length > 1
      ? st.parts.map((p) => `<li><span>${p.name}<br><span style="color:var(--dim);font-size:.75rem">${p.detail}</span></span><span class="s">${sub(p.symbol)} · ${p.share ? `${p.share} states` : "50%"}</span></li>`).join("")
      : "";
    $("r-m2").textContent = f(st.m2, 3);
    $("r-m").textContent = st.m2 < -1e-9 ? `${f(Math.sqrt(-st.m2), 3)} i (imaginary)` : f(Math.sqrt(Math.max(0, st.m2)), 3);
    $("r-n").textContent = cfg.mode === "open" ? hf(st.N) : `${hf(st.N)}, ${hf(st.Nt)}`;
    const sup = cfg.theory === "super";
    $("r-lm-l").textContent = sup ? "Level matching N − a = Ñ − ã + kw" : "Level matching N − Ñ = kw";
    $("r-stat").textContent = `${cfg.mode === "open" ? cfg.left.sector : `${cfg.left.sector}–${cfg.right.sector}`} · ${st.fermion ? "fermion" : "boson"}`;
    $("r-dim").textContent = `${sup ? 10 : 26} (3 drawn: x¹, x², y)`;
    $("r-dual").textContent = `${f(cfg.R, 3)} · ${f(1 / cfg.R, 3)}`;
    if (sup) ladder(st);
    const lm = S.levelMatched(cfg);
    $("r-lm").innerHTML = `<span class="${lm ? "ok" : "bad"}">${lm ? "satisfied" : "violated"}</span>`;
    equations(st);
  }

  // ---------- scope drawing ----------
  const bg = $("bg"), fg = $("fg"), tr = $("trace"), fe = $("ferm"), spc = $("spin");
  function fit(c) {
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    return [r.width, r.height];
  }
  function graticule(ctx, W, H, nx, ny) {
    ctx.strokeStyle = "#13261f"; ctx.lineWidth = 1;
    for (let i = 0; i <= nx; i++) { ctx.beginPath(); ctx.moveTo((W * i) / nx, 0); ctx.lineTo((W * i) / nx, H); ctx.stroke(); }
    for (let j = 0; j <= ny; j++) { ctx.beginPath(); ctx.moveTo(0, (H * j) / ny); ctx.lineTo(W, (H * j) / ny); ctx.stroke(); }
    ctx.strokeStyle = "#1f3a33"; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  }
  let geo = {};
  function drawBackground() {
    const [W, H] = fit(bg); fit(fg);
    const ctx = bg.getContext("2d");
    ctx.fillStyle = "#05080a"; ctx.fillRect(0, 0, W, H);
    graticule(ctx, W, H, 10, 8);
    const rho = 0.3 * Math.min(W, H);
    geo = { W, H, cx: W / 2, cy: H / 2, rho, ux: rho * 0.35 };
    ctx.setLineDash([5, 6]); ctx.strokeStyle = "#2f6b57"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) { const [x, y] = proj(ring(i / 120 * 2 * Math.PI, 0, 0)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#6b8f84"; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText(`compact y, circumference 2πR = ${(2 * Math.PI * cfg.R).toFixed(2)}`, 10, H - 10);
    ctx.fillText("x¹: out from the circle · x²: up · y: around it · drag to rotate", 10, 16);
    if (cfg.mode === "open") {
      for (const [y, lab] of [[0, "brane A"], [cfg.L, "brane B"]]) {
        const th = y / cfg.R - Math.PI / 2, [x0, y0] = proj(ring(th, -0.4 * rho, 0)), [x1, y1] = proj(ring(th, 0.4 * rho, 0));
        ctx.strokeStyle = "#ffcf4a"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const [lx, ly] = proj(ring(th, 0.55 * rho, 0));
        ctx.fillStyle = "#ffcf4a"; ctx.fillText(lab, lx - 22, ly + (lab === "brane A" ? -4 : 12));
      }
    }
    trace.dims = fit(tr); trace.fdims = fit(fe); trace.sdims = fit(spc);
    fg.getContext("2d").clearRect(0, 0, W, H);
    dirty = false;
  }
  const trace = {};

  // 3-D view: the compact circle lies flat, x¹ points out from it and x² points up. Drag turns it.
  const view = { yaw: 0.9, pitch: 0.55, drag: null };
  const ring = (th, out, up) => { const r = geo.rho + out; return [r * Math.cos(th), up, r * Math.sin(th)]; };
  function rot([X, Y, Z]) {
    const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    const x = X * cy - Z * sy, z = X * sy + Z * cy;
    return [x, -(Y * cp - z * sp), Y * sp + z * cp];
  }
  const proj = (P) => { const [x, y, d] = rot(P); return [geo.cx + x, geo.cy + y, d]; };
  // A loop with no winding and no x² oscillator folds flat onto a doubled line; only then is it
  // drawn slightly opened (OPEN · sin σ along x²) so it still reads as a closed loop.
  const OPEN = 0.35;
  function toXY(p) {
    const flat = cfg.mode === "closed" && cfg.w === 0 && cfg.left.pol !== "x2" && cfg.right.pol !== "x2";
    const th = p.y / cfg.R - Math.PI / 2, opened = flat ? OPEN * Math.sin(p.s) : 0;
    return proj(ring(th, Math.max(4 - geo.rho, p.x1 * geo.ux), (p.x2 + opened) * geo.ux));
  }
  const onScope = (ev) => { const r = fg.getBoundingClientRect(); return Math.hypot(ev.clientX - r.left - geo.cx, ev.clientY - r.top - geo.cy) < geo.rho * 1.6; };
  fg.style.touchAction = "pan-y";
  fg.addEventListener("pointerdown", (ev) => {
    if (!onScope(ev)) return;
    view.drag = { x: ev.clientX, y: ev.clientY, yaw: view.yaw, pitch: view.pitch };
    fg.setPointerCapture(ev.pointerId); ev.preventDefault();
  });
  fg.addEventListener("pointermove", (ev) => {
    fg.style.cursor = view.drag ? "grabbing" : onScope(ev) ? "grab" : "";
    if (!view.drag) return;
    const k = 1 / Math.max(geo.rho, 60);
    view.yaw = view.drag.yaw - (ev.clientX - view.drag.x) * k;
    view.pitch = Math.max(-1.5, Math.min(1.5, view.drag.pitch + (ev.clientY - view.drag.y) * k));
    dirty = true;
  });
  const endDrag = () => (view.drag = null);
  fg.addEventListener("pointerup", endDrag); fg.addEventListener("pointercancel", endDrag);
  fg.addEventListener("touchstart", (ev) => { if (onScope(ev.touches[0])) ev.preventDefault(); }, { passive: false });

  function drawFrame() {
    const ctx = fg.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${$("persist").value})`;
    ctx.fillRect(0, 0, geo.W, geo.H);
    ctx.globalCompositeOperation = "source-over";
    const pts = S.shape(cfg, tau, 360);
    const extent = pts.reduce((m, p) => Math.max(m, Math.abs(p.x1), Math.abs(p.x2), Math.abs(p.y - pts[0].y)), 0);
    ctx.shadowColor = "#39ff9c"; ctx.shadowBlur = 10;
    if (extent < 1e-9) {
      const [x, y] = toXY(pts[0]);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = "rgba(57,255,156,0.5)";
        ctx.beginPath(); ctx.arc(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, 1.6, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.fillStyle = "#39ff9c"; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 2 * Math.PI); ctx.fill();
      if (cfg.theory === "super") {
        ctx.shadowBlur = 0; ctx.fillStyle = "#ff7ad9"; ctx.font = "11px ui-monospace, monospace";
        ctx.fillText("X at rest: this state vibrates only in ψ (CH 5)", 10, 32);
      }
    } else {
      ctx.strokeStyle = "#39ff9c"; ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((p, i) => { const [x, y] = toXY(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      if (cfg.mode === "closed") ctx.closePath();
      ctx.stroke();
      if (cfg.mode === "closed") {
        const [x, y] = toXY(pts[0]);
        ctx.fillStyle = "#ffcf4a"; ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
    drawTrace(pts);
    if (cfg.theory === "super") { drawFermions(); drawSpin(); }
  }

  // CH 6 (internal space). Vector mode: the RNS field ψ^μ carries a vector index, so a rotation by θ
  // in the (a, b) plane turns it by θ and it closes at 2π. Spinor mode: the R ground state turns by
  // S(θ) = cos(θ/2) + sin(θ/2) γ_a γ_b, lands on −ψ at 2π and closes at 4π. Directions 1–9 are spatial.
  const G10 = window.Spinors.gammas(10);
  const parity = (i) => { let c = 0; for (; i; i >>= 1) c ^= i & 1; return c; };
  const sp = { mode: "vec", a: 1, b: 2, axes: { vec: [1, 2, 3], spin: null }, link: false, cliff: false, yaw0: view.yaw };
  const PSI_INDEX = { x1: 1, x2: 2, y: 9 };
  // The R ground state's chirality: one Weyl half under GSO (IIA's two sides are opposite), both without it.
  function spinChirality() {
    if (!cfg.gso) return null;
    const rSide = cfg.left.sector === "R" ? "left" : cfg.mode === "closed" && cfg.right.sector === "R" ? "right" : "left";
    return rSide === "right" && cfg.type === "IIA" ? 1 : 0;
  }
  function groundSpinor() {
    const ch = spinChirality();
    const v = Array.from({ length: 32 }, (_, i) =>
      ch === null || parity(i) === ch ? [(1 + 0.6 * Math.cos(1.7 * i)) * Math.cos(0.9 * i), (1 + 0.6 * Math.cos(1.7 * i)) * Math.sin(0.9 * i)] : [0, 0]);
    const n = window.Spinors.norm(v);
    return v.map(([a, b]) => [a / n, b / n]);
  }
  const allowed = () => [...Array(32).keys()].filter((i) => spinChirality() === null || parity(i) === spinChirality());
  function spSync() {
    const vec = sp.mode === "vec";
    $("sp-vec").classList.toggle("on", vec); $("sp-spin").classList.toggle("on", !vec);
    $("sp-cliff").style.display = vec ? "none" : ""; $("sp-cliff").classList.toggle("on", sp.cliff);
    const dirs = [...Array(9).keys()].map((i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
    $("sp-a").innerHTML = dirs; $("sp-b").innerHTML = dirs; $("sp-a").value = sp.a; $("sp-b").value = sp.b;
    const comps = vec
      ? [...Array(9).keys()].map((i) => [i + 1, `ψ${"¹²³⁴⁵⁶⁷⁸⁹"[i]}`])
      : allowed().flatMap((i) => [[2 * i, `Re s${i + 1}`], [2 * i + 1, `Im s${i + 1}`]]);
    if (!vec && (!sp.axes.spin || !sp.axes.spin.every((c) => comps.some(([v]) => v === c)))) {
      const [i0, i1] = allowed(); sp.axes.spin = [2 * i0, 2 * i0 + 1, 2 * i1];
    }
    ["x", "y", "z"].forEach((k, j) => {
      $(`sp-${k}`).innerHTML = comps.map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
      $(`sp-${k}`).value = sp.axes[sp.mode][j];
    });
    const feat = vec ? [
      ["Closes after one turn (2π)", "topological: true for any 3 axes"],
      ["Circle shape and size", "projection-dependent: change the axes"],
      ["ψ^μ has a vector index, so it turns exactly like X^μ; it lives in ℝ¹⁰, not in a spinor space", ""],
    ] : [
      [`Lands on −ψ at 2π and closes only at 4π`, "topological: true for any 3 axes"],
      ["γᵃγᵇψ and γᵇγᵃψ end at opposite points (their sum is 0)", "topological: any linear slice keeps antipodes"],
      ["Curve shape, the Lissajous look", "projection-dependent"],
      [spinChirality() === null ? "GSO off: both chiralities, 32 components (dot half solid)" : `Chirality: ${spinChirality() ? "outline" : "solid"} dot = this Weyl half (16 of 32), kept by GSO`, "invariant under rotations"],
    ];
    $("sp-feat").innerHTML = feat.map(([a, b]) => `<li><b>${a}</b>${b ? ` · ${b}` : ""}</li>`).join("") +
      "<li>Analogy, not space: these axes are components of a representation. A 3-D slice cannot hold the 16- or 32-component structure; it shows what the operations do. " +
      (vec ? "" : "Drawn as a complex Weyl spinor; the Majorana condition (16 real components) is not drawn.") + "</li>";
  }
  $("sp-vec").onclick = () => { sp.mode = "vec"; spSync(); };
  $("sp-spin").onclick = () => { sp.mode = "spin"; spSync(); };
  $("sp-cliff").onclick = () => { sp.cliff = !sp.cliff; spSync(); };
  $("sp-link").onchange = () => { sp.link = $("sp-link").checked; sp.yaw0 = view.yaw; };
  for (const k of ["a", "b"]) $(`sp-${k}`).onchange = () => {
    sp[k] = Number($(`sp-${k}`).value);
    if (sp.a === sp.b) sp[k === "a" ? "b" : "a"] = (sp[k] % 9) + 1;
    spSync();
  };
  ["x", "y", "z"].forEach((k, j) => ($(`sp-${k}`).onchange = () => { sp.axes[sp.mode][j] = Number($(`sp-${k}`).value); }));

  function drawSpin() {
    const [W, H] = trace.sdims, ctx = spc.getContext("2d"), vec = sp.mode === "vec";
    ctx.fillStyle = "#05080a"; ctx.fillRect(0, 0, W, H);
    const theta = sp.link ? 2 * (view.yaw - sp.yaw0) : (0.5 * tau) % (4 * Math.PI);
    const ax = sp.axes[sp.mode], a = sp.a - 1, b = sp.b - 1;
    const nsBank = cfg.left.sector === "NS" || cfg.mode === "open" ? cfg.left : cfg.right;
    let state, at, note;
    if (vec) {
      const e = Array(10).fill(0); e[PSI_INDEX[nsBank.fpol]] = 1;
      at = (th) => { const v = e.slice(), c = Math.cos(th), s = Math.sin(th); v[sp.a] = c * e[sp.a] - s * e[sp.b]; v[sp.b] = s * e[sp.a] + c * e[sp.b]; return v; };
      state = at;
      note = nsBank.sector === "NS" && nsBank.r > 0 ? `ψ${"¹²³⁴⁵⁶⁷⁸⁹"[PSI_INDEX[nsBank.fpol] - 1]}₋${hf(nsBank.r)} polarization` : "no ψ quantum in this state: its polarization direction is shown";
    } else {
      const psi0 = groundSpinor();
      state = (th) => window.Spinors.rotate(G10, a, b, th, psi0);
      at = (th) => state(th).flat();
      note = cfg.left.sector === "R" || (cfg.mode === "closed" && cfg.right.sector === "R") ? "R ground state" : "no R sector in this state: an R ground spinor is shown for reference";
    }
    const pick = (v) => ax.map((k) => v[k]);
    const M = 240, pts = [];
    for (let i = 0; i <= M; i++) pts.push(pick(at((4 * Math.PI * i) / M)));
    let extra = [];
    if (!vec && sp.cliff) {
      const S = window.Spinors, psi = state(theta);
      const gb = S.apply(G10[b], psi), gab = S.apply(G10[a], gb), ga = S.apply(G10[a], psi), gba = S.apply(G10[b], ga);
      extra = [[psi, gb, gab].map((v) => pick(v.flat())), [psi, ga, gba].map((v) => pick(v.flat()))];
    }
    const big = Math.max(1e-6, ...pts.flat().map(Math.abs), ...extra.flat(2).map(Math.abs));
    const sc = (0.36 * Math.min(W, H)) / big, cx = W / 2, cy = H / 2 + 8;
    const P = (q) => { const [x, y] = rot([q[0] * sc, q[2] * sc, q[1] * sc]); return [cx + x, cy + y]; };
    ctx.font = "11px ui-monospace, monospace";
    const labels = ax.map((k) => $(`sp-x`).querySelector(`option[value="${k}"]`)?.textContent || "");
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((u, j) => {
      const [x0, y0] = P(u.map((c) => -c * big)), [x1, y1] = P(u.map((c) => c * big));
      ctx.strokeStyle = "#1f3a33"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = "#6b8f84"; ctx.fillText(labels[j], x1 + 3, y1);
    });
    const done = Math.max(0, Math.min(M, Math.round((((theta % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI)) / (4 * Math.PI) * M)));
    ctx.lineWidth = 1.6;
    for (let i = 0; i < M; i++) {
      const [x0, y0] = P(pts[i]), [x1, y1] = P(pts[i + 1]);
      ctx.strokeStyle = i < M / 2 ? (i < done ? "#ffcf4a" : "#5c4a1c") : (i < done ? "#4ad8ff" : "#1c4a5c");
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    const dot = (q, color, label, solid = true, dy = -6) => {
      const [x, y] = P(q); ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2; solid ? ctx.fill() : ctx.stroke();
      if (label) { ctx.fillStyle = color; ctx.fillText(label, x + 8, y + dy); }
    };
    dot(pts[0], "#d8f5ea", "θ = 0: ψ");
    dot(pts[M / 2], "#ff7ad9", vec ? "θ = 2π: back to ψ" : "θ = 2π: −ψ", true, vec ? 10 : -6);
    for (const [path, color, lab] of extra.map((e, i) => [e, i ? "#4ad8ff" : "#ffcf4a", i ? "γᵇγᵃψ" : "γᵃγᵇψ"])) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath();
      path.forEach((q, i) => { const [x, y] = P(q); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]);
      dot(path[2], color, lab, true, 16);
    }
    const ch = vec ? 0 : spinChirality();
    const cur = pick(at(theta));
    if (ch === null) { dot(cur, "#39ff9c", ""); const [x, y] = P(cur); ctx.fillStyle = "#05080a"; ctx.fillRect(x - 6, y, 12, 6); ctx.strokeStyle = "#39ff9c"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.stroke(); }
    else dot(cur, "#39ff9c", "", ch === 0);
    ctx.fillStyle = "#d8f5ea"; ctx.fillText(`θ = ${(theta / Math.PI).toFixed(2)}π in the (${sp.a}, ${sp.b}) plane${sp.link ? " · from the CH 1 drag" : ""}`, 8, 14);
    ctx.fillStyle = "#6b8f84"; ctx.fillText(note, 8, 28);
    ctx.fillText(vec ? "amber 0–2π, cyan 2π–4π: the second turn retraces the first" : "amber 0–2π ends at −ψ; cyan 2π–4π brings it back", 8, H - 8);
  }
  spc.style.touchAction = "pan-y";
  spc.addEventListener("pointerdown", (ev) => { view.drag = { x: ev.clientX, y: ev.clientY, yaw: view.yaw, pitch: view.pitch }; spc.setPointerCapture(ev.pointerId); ev.preventDefault(); });
  spc.addEventListener("pointermove", (ev) => {
    if (!view.drag) return;
    const k = 1 / Math.max(geo.rho, 60);
    view.yaw = view.drag.yaw - (ev.clientX - view.drag.x) * k;
    view.pitch = Math.max(-1.5, Math.min(1.5, view.drag.pitch + (ev.clientY - view.drag.y) * k));
    dirty = true;
  });
  spc.addEventListener("pointerup", () => (view.drag = null)); spc.addEventListener("pointercancel", () => (view.drag = null));

  // Each fermion field is drawn as a band around the worldsheet circle σ whose cross-bar turns by
  // the phase r(τ ± σ). Over one loop it turns by 2πr: a half-turn (Möbius) for NS, whole turns for R.
  function drawFermions() {
    const [W, H] = trace.fdims, ctx = fe.getContext("2d");
    ctx.fillStyle = "#05080a"; ctx.fillRect(0, 0, W, H);
    const open = cfg.mode === "open";
    const sides = open ? [["ψ, open string (σ doubled to 2π)", cfg.left, 1]] : [["ψ, left movers", cfg.left, 1], ["ψ̃, right movers", cfg.right, -1]];
    sides.forEach(([title, b, dir], i) => {
      const cx = (W * (i + 0.5)) / sides.length, cy = H * 0.45;
      const rho = Math.min(W / sides.length / 2, H / 2) * 0.62, h = rho * 0.3;
      const empty = b.r === 0, r = empty && b.sector === "NS" ? 0.5 : b.r;
      const alpha = empty && b.sector === "NS" ? 0.25 : 0.85;
      const at = (sg) => {
        const th = dir > 0 ? r * (tau + sg) : r * (tau - sg), c = Math.cos(sg), sn = Math.sin(sg);
        const C = [rho * c, 0, rho * sn], u = [Math.sin(th) * c, Math.cos(th), Math.sin(th) * sn];
        return [C, u];
      };
      const P = (V) => { const [x, y, d] = rot(V); return [cx + x, cy + y, d]; };
      const quads = [], M = 96;
      for (let j = 0; j < M; j++) {
        const [C0, u0] = at((2 * Math.PI * j) / M), [C1, u1] = at((2 * Math.PI * (j + 1)) / M);
        for (const sgn of [1, -1]) {
          const pts = [C0, C0.map((v, k) => v + sgn * h * u0[k]), C1.map((v, k) => v + sgn * h * u1[k]), C1].map(P);
          quads.push({ pts, d: pts.reduce((m, q) => m + q[2], 0) / 4, color: sgn > 0 ? "255,207,74" : "74,216,255" });
        }
      }
      quads.sort((a, b2) => a.d - b2.d);
      for (const q of quads) {
        ctx.fillStyle = `rgba(${q.color},${alpha})`;
        ctx.beginPath(); q.pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
      }
      const [C, u] = at(0), a0 = P(C.map((v, k) => v - h * 1.25 * u[k])), a1 = P(C.map((v, k) => v + h * 1.25 * u[k]));
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
      ctx.fillStyle = "#d8f5ea"; ctx.font = "11px ui-monospace, monospace"; ctx.textAlign = "center";
      ctx.fillText(title, cx, 13);
      const ns = b.sector === "NS";
      const mode = empty ? (ns ? "empty: lowest mode r = ½ shown faint" : "zero mode: the spinor ground state")
        : `mode ψ₋${hf(b.r)}: ${hf(b.r)} turn per loop`;
      ctx.fillStyle = ns ? "#ff7ad9" : "#39ff9c";
      ctx.fillText(ns ? "NS: ψ(σ+2π) = −ψ(σ), colours swap at the seam" : "R: ψ(σ+2π) = +ψ(σ), colours match at the seam", cx, H - 22);
      ctx.fillStyle = "#6b8f84"; ctx.fillText(mode, cx, H - 8);
      ctx.textAlign = "left";
    });
  }

  function drawTrace(pts) {
    const [W, H] = trace.dims, ctx = tr.getContext("2d");
    ctx.fillStyle = "#05080a"; ctx.fillRect(0, 0, W, H);
    graticule(ctx, W, H, 12, 4);
    const span = pts[pts.length - 1].s, scale = H / 2 / 3.2;
    const zero = cfg.mode === "open" ? (p) => (cfg.L * p.s) / Math.PI : (p) => (cfg.k / cfg.R) * tau + cfg.w * cfg.R * p.s;
    const series = [["x1", "#39ff9c", (p) => p.x1], ["x2", "#ffcf4a", (p) => p.x2], ["y", "#4ad8ff", (p) => p.y - zero(p)]];
    if (cfg.theory === "super") {
      const L = cfg.left, Rb = cfg.right;
      if (L.r > 0) series.push(["psi", "#ff7ad9", (p) => 1.5 * Math.cos(L.r * (tau + p.s))]);
      if (cfg.mode === "closed" && Rb.r > 0) series.push(["psit", "#ff7ad9", (p) => 1.5 * Math.cos(Rb.r * (tau - p.s)), [5, 4]]);
    }
    for (const [, color, get, dash] of series) {
      ctx.setLineDash(dash || []);
      ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.beginPath();
      pts.forEach((p, i) => { const x = (p.s / span) * W, y = H / 2 - get(p) * scale; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.shadowBlur = 0; ctx.fillStyle = "#6b8f84"; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("σ = 0", 4, H - 6); ctx.fillText(cfg.mode === "open" ? "σ = π" : "σ = 2π", W - 44, H - 6);
    ctx.fillText(`τ = ${tau.toFixed(2)}`, W - 80, 14);
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    if (playing) tau += dt * Number($("spd").value);
    if (dirty) drawBackground();
    drawFrame();
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", () => (dirty = true));

  $("preset").value = "Graviton g_μν";
  syncControls(); updatePanel(); spSync();
  requestAnimationFrame(loop);
})();
