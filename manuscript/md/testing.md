# KKLT String Cosmology: Module Test Suite Specification

To verify the numerical stability, physical validity, and interactive responsiveness of the **KKLT String Cosmology** module within `physics-ide`, tests are structured across three primary layers: **Mathematical & Unit Integrity** (Rust), **Physical Boundary Verification** (Python), and **UI State & Interoperability** (Web Interface).

---

## 1. Rust Unit & Boundary Tests (`src/lib.rs`)

Run via `cargo test` to verify numerical robustness and prevent physical impossibilities (e.g., negative volume moduli).

### Unphysical Domain Guard ($t \le 0$)
* **Procedure:** Pass $t = 0.0$ and $t = -5.0$ to `kahler_potential`, `f_term_potential`, and `total_kklt_potential`.
* **Expected Output:** Functions return `Err("Volume modulus t must be strictly positive...")` without panicking or returning `NaN`/`Inf`.

### Supersymmetric AdS Minimum Condition ($D_T W = 0$)
* **Procedure:** Evaluate `covariant_derivative_w(t, params)` at the theoretical minimum:
  $$t_{\text{min}} \approx -\frac{1}{a} \ln\left(\frac{3|W_0|}{2aA}\right)$$
* **Expected Output:** $D_T W \approx 0.0$ within floating-point tolerance ($< 10^{-7}$).

### Pure Uplift Isolation ($W_0 = 0, A = 0$)
* **Procedure:** Set flux constant $W_0 = 0$ and non-perturbative prefactor $A = 0$, leaving $C_{\text{uplift}} > 0$.
* **Expected Output:** `f_term_potential` evaluates to $0.0$, and `total_kklt_potential` equals $V_{\text{uplift}}(t) = \frac{C_{\text{uplift}}}{(2t)^2}$.

### Array Sweep Dimension Match
* **Procedure:** Call `generate_kklt_curve(10.0, 50.0, 100, &params)`.
* **Expected Output:** Returns a vector containing exactly 100 `PotentialPoint` elements with strictly monotonically increasing $t$ values.

---

## 2. Python Physical Verification Sweeps (`src/analysis/test_kklt.py`)

Run via Python parameter sweeps to verify that the mathematical engine produces the three fundamental cosmological phases of the String Theory Landscape.

### Test A: AdS Minimum Verification ($C_{\text{uplift}} = 0$)
* **Procedure:** Execute curve calculation with $W_0 = -10^{-4}$, $a = 0.628$, and $C_{\text{uplift}} = 0.0$.
* **Verification:** Locate the global minimum via $\min(V_{\text{total}})$. Confirm $V(t_{\text{min}}) < 0$ (Anti-de Sitter bound state).

### Test B: Metastable de Sitter Uplift ($C_{\text{uplift}} = 3.0 \times 10^{-9}$)
* **Procedure:** Apply the standard uplift parameter.
* **Verification:**
  1. Confirm a local minimum exists where $V(t_{\text{min}}) > 0$ (positive dark energy).
  2. Confirm a local potential barrier $V_{\text{max}} > V(t_{\text{min}})$ exists at $t_{\text{barrier}} > t_{\text{min}}$.

### Test C: Overlift Runaway Limit ($C_{\text{uplift}} \ge 1.0 \times 10^{-8}$)
* **Procedure:** Sweep $C_{\text{uplift}}$ upward from $10^{-9}$ to $10^{-7}$.
* **Verification:** Detect the critical threshold $C_{\text{crit}}$ where $\frac{dV}{dt} < 0$ for all $t > 5.0$. Confirm that the potential barrier vanishes completely (runaway decompactification).

### Test D: Asymptotic Zero Convergence ($t \to \infty$)
* **Procedure:** Evaluate scalar potential at $t = 1000.0$.
* **Verification:** Confirm $V_{\text{total}}(1000) \to 0^+$, ensuring the potential asymptotically approaches zero at infinite internal volume.

---

## 3. UI State & Interoperability Tests (`src/UI/index.html`)

Test dynamic rendering and parameter synchronization within the browser interface.

### Scenario Preset Deserialization
* **Procedure:** Trigger each dropdown selection (`Stable de Sitter`, `Un-uplifted AdS`, `Runaway Overlift`).
* **Expected Output:** Sliders, numerical value readouts, and Chart.js datasets update instantly to reflect the values in `data/flux_samples.json`.

### Dynamic Barrier Destruction
* **Procedure:** Drag the $C_{\text{uplift}}$ slider continuously from `0.0` to `10.0`.
* **Expected Output:** The total potential curve transitions smoothly from a negative dip ($\text{AdS}$), lifts into a positive local well ($\text{dS}$), and flattens into a monotonic slope while the status badge updates dynamically ($\text{AdS} \to \text{dS} \to \text{Overlifted / Runaway}$).

### Scale Bound Clipping
* **Procedure:** Maximize the flux magnitude ($W_0 = -0.0005$) with $C_{\text{uplift}} = 0.0$.
* **Expected Output:** Y-axis scale bounds on Chart.js adjust smoothly without clipping the trough of the deep Anti-de Sitter potential well.

---

## 4. Automation Commands

Use the following commands from the repository root:

1. **Rust integrity + boundary suite**
  * `cargo test`

2. **Python experiment sweep suite (Tests A-D)**
  * `make experiment-python`
  * Writes report to `src/analysis/results/experiment_report.json`

3. **Combined experiment run (Rust + Python)**
  * `make experiments`

4. **Baseline full checks**
  * `make all-checks`

5. **Metastable dS candidate search**
  * `make search-ds`
  * Writes ranked candidates to `src/analysis/results/ds_candidates.json` and `src/analysis/results/ds_candidates.csv`

6. **Small-positive-vacuum tuned search**
  * `make search-ds-tuned`
  * Prioritizes candidates near $V_{\min} \sim 10^{-13}$ while preserving a post-minimum barrier