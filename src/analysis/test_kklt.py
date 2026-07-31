#!/usr/bin/env python3
"""
test_kklt.py - Exploratory testing and visualization for KKLT potential V(t).

Mirrors the mathematical formulation in src/lib.rs:
    K = -3 * ln(2t)
    W = W_0 + A * exp(-a * t)
    V_total = V_F + V_uplift
"""

import numpy as np
import matplotlib.pyplot as plt
from dataclasses import dataclass

@dataclass
class KKLTParameters:
    w0: float = -1.0e-4        # Flux superpotential constant
    a_coeff: float = 1.0       # Non-perturbative prefactor A
    a_param: float = 2 * np.pi / 10.0  # a = 2pi / N (N=10 D7 branes)
    g_s: float = 0.1           # String coupling constant
    c_uplift: float = 3.0e-9   # Anti-D3 brane uplift scaling factor

def kahler_potential(t: np.ndarray) -> np.ndarray:
    """K = -3 * ln(2t)"""
    return -3.0 * np.log(2.0 * t)

def superpotential(t: np.ndarray, p: KKLTParameters) -> np.ndarray:
    """W(t) = W_0 + A * exp(-a * t)"""
    return p.w0 + p.a_coeff * np.exp(-p.a_param * t)

def dW_dt(t: np.ndarray, p: KKLTParameters) -> np.ndarray:
    """dW/dt = -a * A * exp(-a * t)"""
    return -p.a_param * p.a_coeff * np.exp(-p.a_param * t)

def covariant_derivative_w(t: np.ndarray, p: KKLTParameters) -> np.ndarray:
    """D_t W = dW/dt + (dK/dt) * W"""
    w = superpotential(t, p)
    dw = dW_dt(t, p)
    dk_dt = -3.0 / (2.0 * t)
    return dw + dk_dt * w

def f_term_potential(t: np.ndarray, p: KKLTParameters) -> np.ndarray:
    """V_F = e^K * [ K^{TT_bar} |D_t W|^2 - 3|W|^2 ]"""
    k = kahler_potential(t)
    exp_k = np.exp(k)  # 1 / (2t)^3
    w = superpotential(t, p)
    d_w = covariant_derivative_w(t, p)
    
    inv_k_metric = (2.0 * t**2) / 3.0
    return exp_k * (inv_k_metric * (d_w**2) - 3.0 * (w**2))

def uplift_potential(t: np.ndarray, p: KKLTParameters) -> np.ndarray:
    """V_uplift = C / (2t)^2"""
    return p.c_uplift / ((2.0 * t)**2)

def total_potential(t: np.ndarray, p: KKLTParameters) -> np.ndarray:
    """V_total = V_F + V_uplift"""
    return f_term_potential(t, p) + uplift_potential(t, p)

def run_test():
    params = KKLTParameters()
    t = np.linspace(5.0, 100.0, 1000)

    v_f = f_term_potential(t, params)
    v_uplift = uplift_potential(t, params)
    v_tot = total_potential(t, params)

    # Locate minimum of total potential
    min_idx = np.argmin(v_tot)
    t_min = t[min_idx]
    v_min = v_tot[min_idx]

    print("=== KKLT Python Test Diagnostic ===")
    print(f"Parameters: W0={params.w0}, a={params.a_param:.4f}, C_uplift={params.c_uplift}")
    print(f"Minimum found at t = {t_min:.2f}")
    print(f"Vacuum Energy V(t_min) = {v_min:.4e}")
    if v_min > 0:
        print("Status: Successfully achieved de Sitter (dS) vacuum (Positive Dark Energy)!")
    elif v_min < 0:
        print("Status: Anti-de Sitter (AdS) vacuum (Uplift parameter C too small).")
    else:
        print("Status: Minkowski vacuum.")

    # Plot curves
    plt.figure(figsize=(10, 6))
    plt.plot(t, v_f, '--', label=r'$V_F$ (Un-uplifted AdS)', color='tab:blue')
    plt.plot(t, v_uplift, ':', label=r'$V_{\mathrm{uplift}}$ ($\bar{D3}$ Brane)', color='tab:orange')
    plt.plot(t, v_tot, '-', label=r'$V_{\mathrm{total}}$ (dS Minimum)', color='tab:green', linewidth=2)
    
    plt.axhline(0, color='gray', linewidth=0.8, linestyle='--')
    plt.plot(t_min, v_min, 'ro', label=f'dS Minimum (t={t_min:.1f})')

    plt.title("KKLT Scalar Potential Uplift Curve", fontsize=14)
    plt.xlabel(r'Volume Modulus $t = \mathrm{Re}(T)$', fontsize=12)
    plt.ylabel(r'Scalar Potential $V(t)$', fontsize=12)
    plt.ylim(-1e-11, 2e-11)
    plt.grid(True, alpha=0.3)
    plt.legend(fontsize=11)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    run_test()
