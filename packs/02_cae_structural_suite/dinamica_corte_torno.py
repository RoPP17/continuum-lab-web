"""
Lathe Turning Mechanics: Merchant Shear Plane Model, Cutting Forces,
Spindle Torque, Power Consumption, and Theoretical Surface Roughness (Ra).
"""

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class LatheTurningResult:
    cutting_speed_m_min: float
    shear_angle_deg: float
    cutting_force_Fc_N: float
    feed_force_Ff_N: float
    spindle_torque_Nm: float
    cutting_power_kW: float
    motor_power_kW: float
    theoretical_Ra_um: float


def analyze_turning_operation(
    workpiece_dia_mm: float = 60.0,
    spindle_rpm: float = 850.0,
    depth_of_cut_mm: float = 1.8,
    feed_mm_rev: float = 0.22,
    rake_angle_deg: float = 8.0,
    friction_coeff: float = 0.58,
    shear_strength_mpa: float = 420.0,
    tool_nose_radius_mm: float = 0.8,
    machine_efficiency: float = 0.82,
) -> LatheTurningResult:
    Vc = math.pi * workpiece_dia_mm * spindle_rpm / 1000.0
    alpha = math.radians(rake_angle_deg)
    beta = math.atan(friction_coeff)
    phi = math.radians(45.0) + 0.5 * (alpha - beta)

    Ac = depth_of_cut_mm * feed_mm_rev  # mm^2
    Fs = (shear_strength_mpa * Ac) / math.sin(phi)
    R = Fs / math.cos(phi + beta - alpha)
    Fc = R * math.cos(beta - alpha)
    Ff = R * math.sin(beta - alpha)

    torque = Fc * (workpiece_dia_mm / 2000.0)
    P_cut = (Fc * (Vc / 60.0)) / 1000.0
    P_motor = P_cut / machine_efficiency
    Ra_um = ((feed_mm_rev ** 2) / (32.0 * tool_nose_radius_mm)) * 1000.0

    return LatheTurningResult(
        cutting_speed_m_min=round(Vc, 2),
        shear_angle_deg=round(math.degrees(phi), 2),
        cutting_force_Fc_N=round(Fc, 1),
        feed_force_Ff_N=round(Ff, 1),
        spindle_torque_Nm=round(torque, 2),
        cutting_power_kW=round(P_cut, 3),
        motor_power_kW=round(P_motor, 3),
        theoretical_Ra_um=round(Ra_um, 2),
    )


if __name__ == "__main__":
    print(analyze_turning_operation())
