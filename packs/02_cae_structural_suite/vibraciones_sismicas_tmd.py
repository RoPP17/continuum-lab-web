"""
Seismic Structural Dynamics: SDOF Building vs 2DOF Tuned Mass Damper (TMD).
Integrates the non-homogeneous equations of motion using SciPy RK45.
"""

import numpy as np
from scipy.integrate import solve_ivp


def simulate_seismic_tmd(
    m1: float = 12000.0,
    k1: float = 4.8e6,
    zeta1: float = 0.02,
    mu_tmd: float = 0.04,
    zeta_tmd: float = 0.12,
    t_end: float = 15.0,
) -> dict:
    w1 = np.sqrt(k1 / m1)
    c1 = 2.0 * zeta1 * m1 * w1

    # Optimal Den Hartog tuning for TMD
    m2 = mu_tmd * m1
    f_opt = 1.0 / (1.0 + mu_tmd)
    w2 = f_opt * w1
    k2 = m2 * (w2 ** 2)
    c2 = 2.0 * zeta_tmd * m2 * w2

    def ground_acc(t: float) -> float:
        # Synthetic modulated seismic pulse (m/s^2)
        env = np.exp(-0.22 * (t - 3.0) ** 2)
        return 2.8 * env * np.sin(w1 * 0.98 * t)

    def ode_sdof(t: float, y: np.ndarray) -> list[float]:
        x1, v1 = y
        a1 = (-c1 * v1 - k1 * x1) / m1 - ground_acc(t)
        return [v1, a1]

    def ode_2dof(t: float, y: np.ndarray) -> list[float]:
        x1, v1, x2, v2 = y
        ag = ground_acc(t)
        f_tmd = k2 * (x2 - x1) + c2 * (v2 - v1)
        a1 = (-c1 * v1 - k1 * x1 + f_tmd) / m1 - ag
        a2 = (-f_tmd) / m2 - ag
        return [v1, a1, v2, a2]

    t_eval = np.linspace(0.0, t_end, 1200)
    sol_uncontrolled = solve_ivp(ode_sdof, (0.0, t_end), [0.0, 0.0], t_eval=t_eval, method="RK45")
    sol_tmd = solve_ivp(ode_2dof, (0.0, t_end), [0.0, 0.0, 0.0, 0.0], t_eval=t_eval, method="RK45")

    peak_no_tmd = float(np.max(np.abs(sol_uncontrolled.y[0]))) * 1000.0
    peak_with_tmd = float(np.max(np.abs(sol_tmd.y[0]))) * 1000.0
    reduction_pct = 100.0 * (1.0 - peak_with_tmd / max(peak_no_tmd, 1e-9))

    return {
        "t": t_eval,
        "x1_no_tmd_mm": sol_uncontrolled.y[0] * 1000.0,
        "x1_with_tmd_mm": sol_tmd.y[0] * 1000.0,
        "x2_tmd_mm": sol_tmd.y[2] * 1000.0,
        "peak_no_tmd_mm": peak_no_tmd,
        "peak_with_tmd_mm": peak_with_tmd,
        "reduction_pct": reduction_pct,
    }


if __name__ == "__main__":
    out = simulate_seismic_tmd()
    print(f"Pico sin TMD: {out['peak_no_tmd_mm']:.2f} mm")
    print(f"Pico con TMD: {out['peak_with_tmd_mm']:.2f} mm (Reduccion: {out['reduction_pct']:.1f}%)")
