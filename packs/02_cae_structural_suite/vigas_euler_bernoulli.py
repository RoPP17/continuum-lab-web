"""
Analytical Euler-Bernoulli Simply Supported Beam Solver.
Supports multiple point loads P_i at x = a_i and uniform distributed load w (kN/m).
Computes reactions RA, RB, shear V(x), bending moment M(x), and deflection v(x).
"""

import numpy as np
import matplotlib.pyplot as plt


def solve_simply_supported_beam(
    L: float = 6.0,
    point_loads: list[tuple[float, float]] | None = None,
    w_udl: float = 4.0,
    EI_kNm2: float = 12000.0,
    n_pts: int = 400,
) -> dict:
    """
    point_loads: list of (P_kN_downward, position_a_m)
    w_udl: downward uniform distributed load (kN/m)
    """
    loads = point_loads if point_loads is not None else [(24.0, 2.4), (12.0, 4.5)]
    sum_m_a = 0.5 * w_udl * (L ** 2) + sum(P * a for P, a in loads)
    RB = sum_m_a / L
    RA = w_udl * L + sum(P for P, _ in loads) - RB

    x = np.linspace(0.0, L, n_pts)
    V = RA - w_udl * x
    M = RA * x - 0.5 * w_udl * (x ** 2)

    for P, a in loads:
        mask = x >= a
        V[mask] -= P
        M[mask] -= P * (x[mask] - a)

    # Numerical integration of M(x) / EI with v(0) = v(L) = 0
    dx = x[1] - x[0]
    theta0 = np.cumsum(M / EI_kNm2) * dx
    v_raw = np.cumsum(theta0) * dx
    v = v_raw - (v_raw[-1] / L) * x  # Enforce v(L) = 0

    return {
        "x": x,
        "V": V,
        "M": M,
        "v_mm": v * 1000.0,
        "RA": RA,
        "RB": RB,
        "M_max": float(np.max(np.abs(M))),
        "V_max": float(np.max(np.abs(V))),
        "v_max_mm": float(np.max(np.abs(v * 1000.0))),
    }


if __name__ == "__main__":
    res = solve_simply_supported_beam()
    print(f"RA = {res['RA']:.2f} kN | RB = {res['RB']:.2f} kN | Mmax = {res['M_max']:.2f} kN*m | vmax = {res['v_max_mm']:.2f} mm")
    fig, axes = plt.subplots(3, 1, figsize=(7.5, 6.5), sharex=True)
    axes[0].plot(res["x"], res["V"], color="#1F4E79", lw=1.8)
    axes[0].fill_between(res["x"], 0, res["V"], color="#1F4E79", alpha=0.14)
    axes[0].set_ylabel("Cortante $V(x)$ [kN]")
    axes[0].grid(True, ls="--", alpha=0.5)

    axes[1].plot(res["x"], res["M"], color="#990000", lw=1.8)
    axes[1].fill_between(res["x"], 0, res["M"], color="#990000", alpha=0.14)
    axes[1].set_ylabel(r"Momento $M(x)$ [kN$\cdot$m]")
    axes[1].grid(True, ls="--", alpha=0.5)

    axes[2].plot(res["x"], res["v_mm"], color="#1A1A1A", lw=1.8)
    axes[2].set_ylabel("Deflexion $v(x)$ [mm]")
    axes[2].set_xlabel("Posicion $x$ [m]")
    axes[2].grid(True, ls="--", alpha=0.5)
    plt.tight_layout()
    plt.show()
