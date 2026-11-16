"""
ISO 53 / DIN 867 / AGMA Involute Gear Geometry & Center Distance Sizing Engine.
Supports standard full-depth spur gears, helical gears, and bevel gear pairs.
"""

import math
from dataclasses import dataclass

PREFERRED_MODULES = [1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0]


@dataclass(frozen=True)
class SpurGearGeometry:
    module_m: float
    teeth_z: int
    pressure_angle_deg: float
    pitch_diameter_d_mm: float
    base_diameter_db_mm: float
    tip_diameter_da_mm: float
    root_diameter_df_mm: float
    circular_pitch_p_mm: float
    tooth_thickness_s_mm: float
    recommended_face_width_mm: float
    undercut_warning: bool


def calculate_spur_gear(module_m: float, teeth_z: int, pressure_angle_deg: float = 20.0) -> SpurGearGeometry:
    """Compute ISO 53 full-depth involute spur gear parameters."""
    m = float(module_m)
    z = int(teeth_z)
    alpha = math.radians(pressure_angle_deg)
    d = m * z
    db = d * math.cos(alpha)
    da = d + 2.0 * m
    df = d - 2.5 * m
    p = math.pi * m
    s = p / 2.0
    z_min = 2.0 / (math.sin(alpha) ** 2)
    return SpurGearGeometry(
        module_m=m,
        teeth_z=z,
        pressure_angle_deg=pressure_angle_deg,
        pitch_diameter_d_mm=round(d, 3),
        base_diameter_db_mm=round(db, 3),
        tip_diameter_da_mm=round(da, 3),
        root_diameter_df_mm=round(df, 3),
        circular_pitch_p_mm=round(p, 3),
        tooth_thickness_s_mm=round(s, 3),
        recommended_face_width_mm=round(10.0 * m, 1),
        undercut_warning=z < math.ceil(z_min),
    )


def calculate_helical_gear_pair(
    normal_module_mn: float,
    z_pinion: int,
    z_gear: int,
    helix_angle_beta_deg: float = 15.0,
    normal_pressure_angle_deg: float = 20.0,
) -> dict:
    """Compute transverse module, pitch diameters, and center distance for helical gears."""
    beta = math.radians(helix_angle_beta_deg)
    alpha_n = math.radians(normal_pressure_angle_deg)
    mt = normal_module_mn / math.cos(beta)
    alpha_t = math.degrees(math.atan(math.tan(alpha_n) / math.cos(beta)))
    d1 = mt * z_pinion
    d2 = mt * z_gear
    a = 0.5 * (d1 + d2)
    return {
        "normal_module_mn": normal_module_mn,
        "transverse_module_mt": round(mt, 4),
        "transverse_pressure_angle_deg": round(alpha_t, 3),
        "helix_angle_deg": helix_angle_beta_deg,
        "pinion_pitch_d1_mm": round(d1, 3),
        "gear_pitch_d2_mm": round(d2, 3),
        "center_distance_a_mm": round(a, 3),
        "transmission_ratio": round(z_gear / z_pinion, 3),
    }


def calculate_bevel_gear_pair(module_m: float, z_pinion: int, z_gear: int, shaft_angle_deg: float = 90.0) -> dict:
    """Compute pitch cone angles and outer cone distance for straight bevel gears."""
    sigma = math.radians(shaft_angle_deg)
    delta1 = math.atan2(math.sin(sigma), (z_gear / z_pinion) + math.cos(sigma))
    delta2 = sigma - delta1
    d1 = module_m * z_pinion
    d2 = module_m * z_gear
    cone_dist = d2 / (2.0 * math.sin(delta2))
    return {
        "module_m": module_m,
        "pinion_pitch_cone_deg": round(math.degrees(delta1), 3),
        "gear_pitch_cone_deg": round(math.degrees(delta2), 3),
        "pinion_pitch_d1_mm": round(d1, 3),
        "gear_pitch_d2_mm": round(d2, 3),
        "outer_cone_distance_R_mm": round(cone_dist, 3),
    }


if __name__ == "__main__":
    p = calculate_spur_gear(2.0, 20)
    g = calculate_spur_gear(2.0, 45)
    print(f"Pinon z={p.teeth_z}: d={p.pitch_diameter_d_mm} mm, da={p.tip_diameter_da_mm} mm, df={p.root_diameter_df_mm} mm")
    print(f"Corona z={g.teeth_z}: d={g.pitch_diameter_d_mm} mm, a={(p.pitch_diameter_d_mm + g.pitch_diameter_d_mm)/2:.2f} mm")
    print("Helicoidal:", calculate_helical_gear_pair(2.0, 20, 45, 18.0))
    print("Conico 90 deg:", calculate_bevel_gear_pair(2.5, 18, 36))
