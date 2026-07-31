//! KKLT String Cosmology Module for physics-ide
//!
//! Calculates the scalar potential V(T) for a volume modulus T = t + i*theta
//! in Type IIB string compactification following the KKLT mechanism:
//!
//! K = -3 * ln(T + T_bar)
//! W = W_0 + A * exp(-a * T)
//! V_total = V_F + V_uplift

use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Parameters defining a specific KKLT vacuum configuration.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct KkltParameters {
    /// Constant flux superpotential (W_0 < 0 typically required for SUSY AdS minimum)
    pub w0: f64,
    /// Non-perturbative coefficient (e.g., A = 1)
    pub a_coeff: f64,
    /// Non-perturbative exponent parameter (a = 2*pi / N for gaugino condensation on N D7-branes)
    pub a_param: f64,
    /// String coupling constant (g_s)
    pub g_s: f64,
    /// Uplift parameter scaling anti-D3 brane tension (D-term / warped uplift)
    #[serde(rename = "c_uplift", alias = "C_uplift", alias = "cUplift")]
    pub c_uplift: f64,
}

impl Default for KkltParameters {
    fn default() -> Self {
        Self {
            w0: -1.0e-4,
            a_coeff: 1.0,
            a_param: 2.0 * PI / 10.0, // N = 10 D7 branes
            g_s: 0.1,
            c_uplift: 3.0e-9,
        }
    }
}

/// Computes the Kähler potential: K = -3 * ln(2 * t)
/// where t = Re(T) is the real volume modulus.
pub fn kahler_potential(t: f64) -> Result<f64, &'static str> {
    if t <= 0.0 {
        return Err("Volume modulus t must be strictly positive (t > 0).");
    }
    Ok(-3.0 * (2.0 * t).ln())
}

/// Computes the Superpotential: W(t) = W_0 + A * exp(-a * t)
/// (Assumes axion phase theta = 0 at the minimum).
pub fn superpotential(t: f64, params: &KkltParameters) -> f64 {
    params.w0 + params.a_coeff * (-params.a_param * t).exp()
}

/// Computes the derivative of the Superpotential with respect to T:
/// dW/dT = -a * A * exp(-a * t)
pub fn d_w_dt(t: f64, params: &KkltParameters) -> f64 {
    -params.a_param * params.a_coeff * (-params.a_param * t).exp()
}

/// Backwards-compatible alias for existing callers.
#[allow(non_snake_case)]
pub fn dW_dt(t: f64, params: &KkltParameters) -> f64 {
    d_w_dt(t, params)
}

/// Computes the Kähler covariant derivative: D_T W = dW/dT + (dK/dT) * W
/// where dK/dT = -3 / (2 * t).
pub fn covariant_derivative_w(t: f64, params: &KkltParameters) -> Result<f64, &'static str> {
    if t <= 0.0 {
        return Err("Volume modulus t must be strictly positive.");
    }
    let w = superpotential(t, params);
    let dw = d_w_dt(t, params);
    let dk_dt = -3.0 / (2.0 * t);
    
    Ok(dw + dk_dt * w)
}

/// Computes the standard N=1 Supergravity F-term scalar potential:
/// V_F = e^K * [ K^{T T_bar} |D_T W|^2 - 3 |W|^2 ]
///
/// In 1-modulus KKLT: K^{T T_bar} = (2 * t^2) / 3
pub fn f_term_potential(t: f64, params: &KkltParameters) -> Result<f64, &'static str> {
    if t <= 0.0 {
        return Err("Volume modulus t must be strictly positive.");
    }

    let k = kahler_potential(t)?;
    let exp_k = k.exp(); // Equivalent to 1 / (2t)^3
    let w = superpotential(t, params);
    let d_w = covariant_derivative_w(t, params)?;

    let inverse_k_metric = (2.0 * t * t) / 3.0;
    
    let v_f = exp_k * (inverse_k_metric * d_w * d_w - 3.0 * w * w);
    Ok(v_f)
}

/// Computes the Anti-D3 Brane Uplift Potential:
/// V_uplift = C / (2 * t)^2   (or C / (2 * t)^3 depending on warped geometry conventions)
pub fn uplift_potential(t: f64, params: &KkltParameters) -> Result<f64, &'static str> {
    if t <= 0.0 {
        return Err("Volume modulus t must be strictly positive.");
    }
    // Using standard warped anti-D3 uplift scaling: C / (2t)^2
    Ok(params.c_uplift / (2.0 * t).powi(2))
}

/// Computes the Total KKLT Scalar Potential: V_total(t) = V_F(t) + V_uplift(t)
pub fn total_kklt_potential(t: f64, params: &KkltParameters) -> Result<f64, &'static str> {
    let v_f = f_term_potential(t, params)?;
    let v_uplift = uplift_potential(t, params)?;
    Ok(v_f + v_uplift)
}

/// Data structure for passing computed curve points back to Tauri / UI.
#[derive(Debug, Serialize, Deserialize)]
pub struct PotentialPoint {
    pub t: f64,
    pub v_f: f64,
    pub v_uplift: f64,
    pub v_total: f64,
}

/// Sweeps volume modulus t across a range [t_min, t_max] to generate potential curve data.
pub fn generate_kklt_curve(
    t_min: f64,
    t_max: f64,
    steps: usize,
    params: &KkltParameters,
) -> Result<Vec<PotentialPoint>, &'static str> {
    if t_min <= 0.0 || t_max <= t_min || steps < 2 {
        return Err("Invalid range or step count for parameter sweep.");
    }

    let step_size = (t_max - t_min) / (steps as f64 - 1.0);
    let mut points = Vec::with_capacity(steps);

    for i in 0..steps {
        let t = t_min + (i as f64) * step_size;
        let v_f = f_term_potential(t, params)?;
        let v_uplift = uplift_potential(t, params)?;
        let v_total = v_f + v_uplift;

        points.push(PotentialPoint {
            t,
            v_f,
            v_uplift,
            v_total,
        });
    }

    Ok(points)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() <= tol
    }

    #[test]
    fn test_kahler_validity() {
        let k = kahler_potential(1.0).unwrap();
        assert!((k - (-3.0 * (2.0_f64).ln())).abs() < 1e-10);
    }

    #[test]
    fn test_curve_generation() {
        let params = KkltParameters::default();
        let curve = generate_kklt_curve(10.0, 100.0, 50, &params).unwrap();
        assert_eq!(curve.len(), 50);
        assert!(curve[0].t == 10.0);
    }

    #[test]
    fn test_deserialize_legacy_c_uplift_key() {
        let raw = r#"{
            "w0": -0.0001,
            "a_coeff": 1.0,
            "a_param": 0.6283185307179586,
            "g_s": 0.1,
            "C_uplift": 3.0e-9
        }"#;

        let params: KkltParameters = serde_json::from_str(raw).unwrap();
        assert!((params.c_uplift - 3.0e-9).abs() < 1e-18);
    }

    #[test]
    fn test_unphysical_domain_guard() {
        let params = KkltParameters::default();
        for &t in &[0.0_f64, -5.0_f64] {
            assert!(kahler_potential(t).is_err());
            assert!(f_term_potential(t, &params).is_err());
            assert!(total_kklt_potential(t, &params).is_err());
        }
    }

    #[test]
    fn test_covariant_derivative_zero_crossing_ads() {
        let params = KkltParameters::default();

        // Bracket a sign change and use bisection to find D_T W ~= 0.
        let mut lo = 10.0_f64;
        let mut hi = 30.0_f64;
        let mut f_lo = covariant_derivative_w(lo, &params).unwrap();
        let f_hi = covariant_derivative_w(hi, &params).unwrap();
        assert!(f_lo * f_hi < 0.0);

        for _ in 0..120 {
            let mid = 0.5 * (lo + hi);
            let f_mid = covariant_derivative_w(mid, &params).unwrap();
            if f_lo * f_mid <= 0.0 {
                hi = mid;
            } else {
                lo = mid;
                f_lo = f_mid;
            }
        }

        let t_root = 0.5 * (lo + hi);
        let d_w = covariant_derivative_w(t_root, &params).unwrap();
        assert!(d_w.abs() < 1e-7, "Expected D_TW close to zero, got {d_w:e}");
    }

    #[test]
    fn test_pure_uplift_isolation() {
        let params = KkltParameters {
            w0: 0.0,
            a_coeff: 0.0,
            a_param: 2.0 * PI / 10.0,
            g_s: 0.1,
            c_uplift: 3.0e-9,
        };
        let t = 12.0_f64;

        let v_f = f_term_potential(t, &params).unwrap();
        let v_up = uplift_potential(t, &params).unwrap();
        let v_tot = total_kklt_potential(t, &params).unwrap();

        assert!(approx_eq(v_f, 0.0, 1e-18));
        assert!(approx_eq(v_tot, v_up, 1e-18));
    }

    #[test]
    fn test_curve_dimension_and_monotonicity() {
        let params = KkltParameters::default();
        let curve = generate_kklt_curve(10.0, 50.0, 100, &params).unwrap();
        assert_eq!(curve.len(), 100);

        for i in 1..curve.len() {
            assert!(curve[i].t > curve[i - 1].t);
        }
    }
}
