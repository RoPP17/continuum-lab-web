"""
DIN 6885-1 Parallel Keys, DIN 471 Retaining Rings, and ISO 281 SKF Bearing L10h Life Engine.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass(frozen=True)
class KeywayStandard:
    shaft_dia_mm: float
    key_width_b_mm: float
    key_height_h_mm: float
    shaft_depth_t1_mm: float
    hub_depth_t2_mm: float
    corner_radius_r_mm: float
    permissible_shear_mpa: float
    permissible_bearing_mpa: float


DIN_6885_TABLE: List[Tuple[float, float, float, float, float, float, float]] = [
    (6.0, 8.0, 2.0, 2.0, 1.2, 1.0, 0.16),
    (8.0, 10.0, 3.0, 3.0, 1.8, 1.4, 0.16),
    (10.0, 12.0, 4.0, 4.0, 2.5, 1.8, 0.16),
    (12.0, 17.0, 5.0, 5.0, 3.0, 2.3, 0.25),
    (17.0, 22.0, 6.0, 6.0, 3.5, 2.8, 0.25),
    (22.0, 30.0, 8.0, 7.0, 4.0, 3.3, 0.25),
    (30.0, 38.0, 10.0, 8.0, 5.0, 3.3, 0.40),
    (38.0, 44.0, 12.0, 8.0, 5.0, 3.3, 0.40),
    (44.0, 50.0, 14.0, 9.0, 5.5, 3.8, 0.40),
    (50.0, 58.0, 16.0, 10.0, 6.0, 4.3, 0.40),
    (58.0, 65.0, 18.0, 11.0, 7.0, 4.4, 0.40),
]


def get_din6885_keyway(shaft_dia_mm: float, key_yield_mpa: float = 350.0) -> KeywayStandard:
    d = float(shaft_dia_mm)
    if d < 6.0:
        raise ValueError("DIN 6885-1 applies from d >= 6 mm.")
    entry = next((row for row in DIN_6885_TABLE if row[0] < d <= row[1]), DIN_6885_TABLE[-1])
    _, _, b, h, t1, t2, r = entry
    return KeywayStandard(
        shaft_dia_mm=d,
        key_width_b_mm=b,
        key_height_h_mm=h,
        shaft_depth_t1_mm=t1,
        hub_depth_t2_mm=t2,
        corner_radius_r_mm=r,
        permissible_shear_mpa=round((0.577 * key_yield_mpa) / 2.0, 1),
        permissible_bearing_mpa=round(key_yield_mpa / 1.5, 1),
    )


def calculate_key_torque_capacity(shaft_dia_mm: float, key_length_mm: float, key_yield_mpa: float = 350.0) -> dict:
    kw = get_din6885_keyway(shaft_dia_mm, key_yield_mpa)
    d_m = shaft_dia_mm / 1000.0
    L_m = key_length_mm / 1000.0
    t_shear = (kw.key_width_b_mm / 1000.0) * L_m * (kw.permissible_shear_mpa * 1e6) * (d_m / 2.0)
    t_bear = (kw.hub_depth_t2_mm / 1000.0) * L_m * (kw.permissible_bearing_mpa * 1e6) * (d_m / 2.0)
    return {
        "key_section_mm": f"{kw.key_width_b_mm}x{kw.key_height_h_mm}",
        "shaft_depth_t1_mm": kw.shaft_depth_t1_mm,
        "hub_depth_t2_mm": kw.hub_depth_t2_mm,
        "torque_shear_limit_Nm": round(t_shear, 2),
        "torque_bearing_limit_Nm": round(t_bear, 2),
        "allowable_torque_Nm": round(min(t_shear, t_bear), 2),
    }


@dataclass(frozen=True)
class BearingData:
    designation: str
    series: str
    bore_d_mm: float
    outer_D_mm: float
    width_B_mm: float
    dynamic_C_kN: float
    static_C0_kN: float
    limiting_speed_rpm: float


SKF_BEARINGS: Dict[str, BearingData] = {
    "6004": BearingData("6004", "60", 20.0, 42.0, 12.0, 9.95, 5.0, 24000),
    "6005": BearingData("6005", "60", 25.0, 47.0, 12.0, 11.9, 6.55, 20000),
    "6204": BearingData("6204", "62", 20.0, 47.0, 14.0, 13.5, 6.55, 22000),
    "6205": BearingData("6205", "62", 25.0, 52.0, 15.0, 14.8, 7.8, 18000),
    "6206": BearingData("6206", "62", 30.0, 62.0, 16.0, 20.3, 11.2, 15000),
    "6305": BearingData("6305", "63", 25.0, 62.0, 17.0, 23.4, 11.6, 16000),
    "6306": BearingData("6306", "63", 30.0, 72.0, 19.0, 29.6, 16.0, 13000),
}


def compute_bearing_l10h(designation: str, radial_kN: float, axial_kN: float, rpm: float) -> dict:
    b = SKF_BEARINGS[designation]
    Fr = max(radial_kN, 0.01)
    Fa = max(axial_kN, 0.0)
    f0 = 14.0
    rel = (f0 * Fa) / b.static_C0_kN
    e_val = 0.22 if rel <= 0.357 else (0.30 if rel <= 1.43 else 0.38)
    y_val = 1.99 if rel <= 0.357 else (1.45 if rel <= 1.43 else 1.15)
    P_eq = Fr if (Fa / Fr) <= e_val else (0.56 * Fr + y_val * Fa)
    L10_mrev = (b.dynamic_C_kN / P_eq) ** 3.0
    L10h = (1e6 / (60.0 * max(rpm, 1.0))) * L10_mrev
    return {
        "bearing": b.designation,
        "dimensions_d_D_B_mm": (b.bore_d_mm, b.outer_D_mm, b.width_B_mm),
        "equivalent_load_P_kN": round(P_eq, 3),
        "L10_million_revs": round(L10_mrev, 2),
        "L10h_hours": round(L10h, 1),
    }


if __name__ == "__main__":
    print("Chaveta d=25mm, L=32mm:", calculate_key_torque_capacity(25.0, 32.0))
    print("Rodamiento 6205 (Fr=2.4kN, Fa=0.5kN, 1450rpm):", compute_bearing_l10h("6205", 2.4, 0.5, 1450))
