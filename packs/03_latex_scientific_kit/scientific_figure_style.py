"""
Modulo editorial y geometrico para figuras cientificas en Python/Matplotlib.
- Base estructural monocromatica con acentos editoriales sobrios.
- Diferenciacion redundante (color + tipo de trazo + marcador).
- Tipografia serif con motor matematico Computer Modern (`cm`).
- Auditoria automatica de solapamientos de texto antes de guardar a 300 DPI.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

import matplotlib as mpl
from matplotlib.axes import Axes
from matplotlib.figure import Figure
from matplotlib.transforms import Bbox

SCI_COLORS: dict[str, str] = {
    "black": "#000000",
    "charcoal": "#1A1A1A",
    "slate_dark": "#333333",
    "slate": "#4D4D4D",
    "gray_mid": "#737373",
    "gray_border": "#B3B3B3",
    "grid_major": "#D9D9D9",
    "grid_minor": "#EBEBEB",
    "fill_soft": "#F2F2F2",
    "white": "#FFFFFF",
    "navy": "#1F4E79",
    "blue_tech": "#2F5597",
    "crimson": "#990000",
    "green_slate": "#2E5E4E",
    "ochre": "#8C510A",
}

SCI_HATCHES: tuple[str, ...] = ("", "///", "...", "\\\\\\", "xxx", "+++")


@dataclass(frozen=True)
class SeriesStyle:
    color: str
    linestyle: Any
    marker: str
    linewidth: float = 1.45


SCI_SERIES_CYCLE: tuple[SeriesStyle, ...] = (
    SeriesStyle(color=SCI_COLORS["charcoal"], linestyle="-", marker="o", linewidth=1.6),
    SeriesStyle(color=SCI_COLORS["navy"], linestyle="--", marker="s", linewidth=1.5),
    SeriesStyle(color=SCI_COLORS["crimson"], linestyle="-.", marker="^", linewidth=1.5),
    SeriesStyle(color=SCI_COLORS["slate"], linestyle=":", marker="D", linewidth=1.5),
    SeriesStyle(color=SCI_COLORS["green_slate"], linestyle=(0, (6, 2)), marker="v", linewidth=1.45),
    SeriesStyle(color=SCI_COLORS["ochre"], linestyle=(0, (3, 1, 1, 1)), marker="P", linewidth=1.45),
)

PROTECTED_LABEL_BBOX: dict[str, Any] = {
    "boxstyle": "round,pad=0.22",
    "facecolor": SCI_COLORS["white"],
    "edgecolor": SCI_COLORS["gray_border"],
    "linewidth": 0.55,
    "alpha": 0.96,
}

CLEAN_LABEL_BBOX: dict[str, Any] = {
    "boxstyle": "square,pad=0.16",
    "facecolor": SCI_COLORS["white"],
    "edgecolor": "none",
    "alpha": 0.96,
}


def apply_scientific_report_style(monochrome_only: bool = False) -> None:
    palette = (
        ["#000000", "#333333", "#595959", "#7F7F7F"]
        if monochrome_only
        else [s.color for s in SCI_SERIES_CYCLE]
    )
    mpl.rcParams.update(
        {
            "figure.facecolor": SCI_COLORS["white"],
            "axes.facecolor": SCI_COLORS["white"],
            "savefig.facecolor": SCI_COLORS["white"],
            "font.family": "serif",
            "font.serif": ["Computer Modern Roman", "CMU Serif", "Times New Roman", "DejaVu Serif"],
            "mathtext.fontset": "cm",
            "font.size": 9.0,
            "axes.titlesize": 10.2,
            "axes.titleweight": "bold",
            "axes.titlepad": 8.0,
            "axes.labelsize": 9.2,
            "axes.labelcolor": SCI_COLORS["charcoal"],
            "axes.edgecolor": SCI_COLORS["slate_dark"],
            "axes.linewidth": 0.85,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.grid": True,
            "axes.grid.axis": "both",
            "grid.color": SCI_COLORS["grid_major"],
            "grid.linestyle": "--",
            "grid.linewidth": 0.55,
            "axes.prop_cycle": mpl.cycler(color=palette),
            "xtick.color": SCI_COLORS["slate_dark"],
            "ytick.color": SCI_COLORS["slate_dark"],
            "xtick.labelsize": 8.3,
            "ytick.labelsize": 8.3,
            "legend.frameon": True,
            "legend.facecolor": SCI_COLORS["white"],
            "legend.edgecolor": SCI_COLORS["gray_border"],
            "legend.framealpha": 0.96,
            "legend.fontsize": 8.0,
            "figure.dpi": 150,
            "savefig.dpi": 300,
        }
    )


def get_series_style(index: int, monochrome_only: bool = False) -> dict[str, Any]:
    style = SCI_SERIES_CYCLE[index % len(SCI_SERIES_CYCLE)]
    mono = ("#000000", "#333333", "#4D4D4D", "#666666", "#808080", "#1A1A1A")
    return {
        "color": mono[index % len(mono)] if monochrome_only else style.color,
        "linestyle": style.linestyle,
        "linewidth": style.linewidth,
    }


def style_axes_editorial(ax: Axes, *, grid_minor: bool = False, box_spines: bool = False) -> Axes:
    ax.set_facecolor(SCI_COLORS["white"])
    ax.spines["top"].set_visible(box_spines)
    ax.spines["right"].set_visible(box_spines)
    for side in ("left", "bottom", "top", "right"):
        if ax.spines[side].get_visible():
            ax.spines[side].set_color(SCI_COLORS["slate_dark"])
            ax.spines[side].set_linewidth(0.85)
    ax.grid(True, which="major", color=SCI_COLORS["grid_major"], linestyle="--", linewidth=0.55)
    if grid_minor:
        ax.minorticks_on()
        ax.grid(True, which="minor", color=SCI_COLORS["grid_minor"], linestyle=":", linewidth=0.4)
    return ax


def annotate_protected(
    ax: Axes,
    text: str,
    xy: tuple[float, float],
    xytext: tuple[float, float],
    *,
    framed: bool = True,
    fontsize: float = 8.0,
    ha: str = "left",
    va: str = "center",
    color: str | None = None,
) -> Any:
    bbox = dict(PROTECTED_LABEL_BBOX if framed else CLEAN_LABEL_BBOX)
    return ax.annotate(
        text,
        xy=xy,
        xytext=xytext,
        ha=ha,
        va=va,
        fontsize=fontsize,
        color=color or SCI_COLORS["charcoal"],
        bbox=bbox,
        arrowprops={
            "arrowstyle": "->,head_width=0.22,head_length=0.32",
            "color": SCI_COLORS["slate_dark"],
            "lw": 0.8,
            "shrinkA": 2,
            "shrinkB": 3,
        },
        zorder=10,
    )


def apply_clean_legend(ax: Axes, *, loc: str = "best", ncol: int = 1, fontsize: float = 8.0) -> Any:
    leg = ax.legend(
        loc=loc,
        ncol=ncol,
        fontsize=fontsize,
        frameon=True,
        facecolor=SCI_COLORS["white"],
        edgecolor=SCI_COLORS["gray_border"],
        framealpha=0.96,
        borderpad=0.45,
        handlelength=2.4,
    )
    leg.get_frame().set_linewidth(0.6)
    leg.set_zorder(11)
    return leg


def find_text_overlaps(fig: Figure, *, min_overlap_px: float = 2.0) -> list[tuple[str, str, float]]:
    fig.canvas.draw()
    renderer = fig.canvas.get_renderer()
    items: list[tuple[str, Bbox]] = []

    def _collect(label: str, artist: Any) -> None:
        if artist is None or not artist.get_visible():
            return
        txt = artist.get_text().strip() if hasattr(artist, "get_text") else ""
        if not txt:
            return
        bb = artist.get_window_extent(renderer=renderer)
        if bb.width > 0 and bb.height > 0:
            items.append((label, bb))

    if getattr(fig, "_suptitle", None) is not None:
        _collect("suptitle", fig._suptitle)
    for ax_idx, ax in enumerate(fig.axes):
        if not ax.get_visible():
            continue
        _collect(f"ax{ax_idx}.title", ax.title)
        _collect(f"ax{ax_idx}.xlabel", ax.xaxis.label)
        _collect(f"ax{ax_idx}.ylabel", ax.yaxis.label)
        for t_idx, txt in enumerate(ax.texts):
            _collect(f"ax{ax_idx}.text[{t_idx}]", txt)
        leg = ax.get_legend()
        if leg is not None and leg.get_visible():
            bb = leg.get_frame().get_window_extent(renderer=renderer)
            if bb.width > 0 and bb.height > 0:
                items.append((f"ax{ax_idx}.legend", bb))

    overlaps: list[tuple[str, str, float]] = []
    for i in range(len(items)):
        na, ba = items[i]
        for j in range(i + 1, len(items)):
            nb, bb = items[j]
            ix = min(ba.x1, bb.x1) - max(ba.x0, bb.x0)
            iy = min(ba.y1, bb.y1) - max(ba.y0, bb.y0)
            if ix > min_overlap_px and iy > min_overlap_px:
                overlaps.append((na, nb, float(ix * iy)))
    return overlaps


def save_scientific_figure(
    fig: Figure,
    output_path: str | Path,
    *,
    dpi: int = 300,
    verify_overlaps: bool = True,
    raise_on_overlap: bool = False,
    tight_layout: bool = True,
) -> Path:
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    if tight_layout and not fig.get_constrained_layout():
        fig.tight_layout(pad=0.9)
    if verify_overlaps:
        ov = find_text_overlaps(fig)
        if ov and raise_on_overlap:
            details = "; ".join(f"{a}<->{b} ({area:.1f}px^2)" for a, b, area in ov)
            raise RuntimeError(f"Text overlap detected: {details}")
    fig.savefig(out, dpi=dpi, bbox_inches="tight", pad_inches=0.14, facecolor=SCI_COLORS["white"])
    return out


__all__: Sequence[str] = (
    "CLEAN_LABEL_BBOX",
    "PROTECTED_LABEL_BBOX",
    "SCI_COLORS",
    "SCI_HATCHES",
    "SCI_SERIES_CYCLE",
    "annotate_protected",
    "apply_clean_legend",
    "apply_scientific_report_style",
    "find_text_overlaps",
    "get_series_style",
    "save_scientific_figure",
    "style_axes_editorial",
)
