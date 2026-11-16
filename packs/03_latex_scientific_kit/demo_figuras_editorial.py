"""Demo de generacion de figura editorial sin solapamientos usando scientific_figure_style."""
import numpy as np
import matplotlib.pyplot as plt
from scientific_figure_style import (
    apply_scientific_report_style,
    apply_clean_legend,
    annotate_protected,
    get_series_style,
    save_scientific_figure,
    style_axes_editorial,
)

apply_scientific_report_style()
x = np.linspace(0.0, 6.0, 200)
y1 = np.exp(-0.35 * x) * np.cos(3.0 * x)
y2 = np.exp(-0.15 * x) * np.cos(3.0 * x)

fig, ax = plt.subplots(figsize=(6.4, 3.6))
style_axes_editorial(ax)
ax.plot(x, y2, label=r"Sin amortiguador ($\zeta = 0.02$)", **get_series_style(1))
ax.plot(x, y1, label=r"Con TMD ($\zeta_{\mathrm{eq}} = 0.14$)", **get_series_style(0))
ax.set_xlabel(r"Tiempo $t$ [s]")
ax.set_ylabel(r"Desplazamiento normalizado $x/x_0$")
ax.set_title("Atenuacion de Respuesta Sismica con TMD")
annotate_protected(ax, "Decaimiento rapido", xy=(2.1, 0.48), xytext=(2.8, 0.72))
apply_clean_legend(ax, loc="upper right")
save_scientific_figure(fig, "figura_demo_editorial.png", verify_overlaps=True)
