"""
ISO 286-1:2010 / ISO 286-2:2010 System of Limits and Fits Calculator.
Computes exact hole/shaft limits, fundamental deviations, and fit type
(Clearance, Transition, or Interference) for standard H7-based shaft fits.
"""

from dataclasses import dataclass
from typing import List, Tuple


@dataclass(frozen=True)
class ISOFitResult:
    nominal_dia_mm: float
    fit_designation: str
    fit_type: str
    hole_min_mm: float
    hole_max_mm: float
    shaft_min_mm: float
    shaft_max_mm: float
    clearance_min_um: float
    clearance_max_um: float
    recommended_application: str


# ISO 286 fundamental tolerances in micrometers: (D_low, D_high, IT6, IT7, IT8)
IT_STEPS: List[Tuple[float, float, int, int, int]] = [
    (0.0, 3.0, 6, 10, 14),
    (3.0, 6.0, 8, 12, 18),
    (6.0, 10.0, 9, 15, 22),
    (10.0, 18.0, 11, 18, 27),
    (18.0, 30.0, 13, 21, 33),
    (30.0, 50.0, 16, 25, 39),
    (50.0, 80.0, 19, 30, 46),
    (80.0, 120.0, 22, 35, 54),
    (120.0, 180.0, 25, 40, 63),
    (180.0, 250.0, 29, 46, 72),
]

# Fundamental shaft deviations in micrometers: (D_low, D_high, g_es, h_es, k_ei, p_ei, s_ei)
SHAFT_DEVIATIONS: List[Tuple[float, float, int, int, int, int, int]] = [
    (0.0, 3.0, -2, 0, 0, +6, +14),
    (3.0, 6.0, -4, 0, +1, +12, +19),
    (6.0, 10.0, -5, 0, +1, +15, +23),
    (10.0, 18.0, -6, 0, +1, +18, +28),
    (18.0, 30.0, -7, 0, +2, +22, +35),
    (30.0, 50.0, -9, 0, +2, +26, +43),
    (50.0, 80.0, -10, 0, +2, +32, +53),
    (80.0, 120.0, -12, 0, +3, +37, +71),
    (120.0, 180.0, -14, 0, +3, +43, +92),
    (180.0, 250.0, -15, 0, +4, +50, +122),
]


def calculate_iso_fit(nominal_dia_mm: float, fit_designation: str = "H7/g6") -> ISOFitResult:
    """Compute exact dimensional limits for H7/g6, H7/h6, H7/k6, H7/p6, or H7/s6."""
    nom = float(nominal_dia_mm)
    if nom <= 0 or nom > 250:
        raise ValueError("Nominal diameter must be in (0, 250] mm.")

    it_entry = next((row for row in IT_STEPS if row[0] < nom <= row[1]), IT_STEPS[-1])
    it6_um, it7_um = it_entry[2], it_entry[3]

    dev = next((row for row in SHAFT_DEVIATIONS if row[0] < nom <= row[1]), SHAFT_DEVIATIONS[-1])
    _, _, g_es, h_es, k_ei, p_ei, s_ei = dev

    hole_min = nom
    hole_max = nom + it7_um / 1000.0
    fit_upper = fit_designation.upper().strip()

    if "G6" in fit_upper:
        es_um = g_es
        ei_um = es_um - it6_um
        fit_type = "Ajuste con Juego (Deslizamiento de Precision)"
        app = "Guias deslizantes, correderas, pistones y acoplamientos de giro suave (H7/g6)"
    elif "K6" in fit_upper:
        ei_um = k_ei
        es_um = ei_um + it6_um
        fit_type = "Ajuste de Transicion (Indeterminado)"
        app = "Ruedas dentadas, poleas y rodamientos con desmontaje eventual (H7/k6)"
    elif "P6" in fit_upper:
        ei_um = p_ei
        es_um = ei_um + it6_um
        fit_type = "Ajuste con Apriete (Prensado Ligero)"
        app = "Bujes de bronce, coronas y anillos prensados sin chaveta auxiliar (H7/p6)"
    elif "S6" in fit_upper:
        ei_um = s_ei
        es_um = ei_um + it6_um
        fit_type = "Ajuste con Apriete Fuerte (Permanente)"
        app = "Ensamblajes permanentes por contraccion termica o prensa hidraulica (H7/s6)"
    else:
        es_um = h_es
        ei_um = es_um - it6_um
        fit_type = "Ajuste con Juego Minimo (Posicionamiento)"
        app = "Centrado preciso de tapas, bridas, poleas y acoples desmontables (H7/h6)"

    shaft_max = nom + es_um / 1000.0
    shaft_min = nom + ei_um / 1000.0
    c_min = round((hole_min - shaft_max) * 1000.0, 1)
    c_max = round((hole_max - shaft_min) * 1000.0, 1)

    return ISOFitResult(
        nominal_dia_mm=nom,
        fit_designation=fit_upper,
        fit_type=fit_type,
        hole_min_mm=round(hole_min, 4),
        hole_max_mm=round(hole_max, 4),
        shaft_min_mm=round(shaft_min, 4),
        shaft_max_mm=round(shaft_max, 4),
        clearance_min_um=c_min,
        clearance_max_um=c_max,
        recommended_application=app,
    )


if __name__ == "__main__":
    print("=== CALCULADORA DE AJUSTES ISO 286 (d = 25 mm) ===")
    for code in ("H7/g6", "H7/h6", "H7/k6", "H7/p6", "H7/s6"):
        r = calculate_iso_fit(25.0, code)
        print(
            f"{r.fit_designation:6s} | Agujero [{r.hole_min_mm:.3f}, {r.hole_max_mm:.3f}] mm | "
            f"Eje [{r.shaft_min_mm:.3f}, {r.shaft_max_mm:.3f}] mm | "
            f"Juego [min={r.clearance_min_um:+.0f}, max={r.clearance_max_um:+.0f}] um -> {r.fit_type}"
        )
