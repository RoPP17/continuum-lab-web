# Kit CAD & Calculo de Elementos de Maquinas (ISO / DIN / SKF)

Paquete educativo y profesional en Python puro (sin dependencias externas obligatorias) listo para dimensionar piezas mecanicas antes de modelar en SolidWorks, Inventor o Fusion 360.

## Contenido
1. `iso_fits_calculator.py` — Ajustes normalizados **ISO 286** (`H7/g6`, `H7/h6`, `H7/k6`, `H7/p6`, `H7/s6`), limites en mm y juego/apriete en micrometros.
2. `involute_gear_iso53.py` — Geometria de engranes rectos **ISO 53 / DIN 867**, helicoidales y conicos, con alerta automatica de socavado (*undercut*).
3. `shafts_keys_bearings_skf.py` — Chavetas **DIN 6885-1** con par torsor admisible por corte/aplastamiento y vida nominal **ISO 281 ($L_{10h}$)** para rodamientos SKF.

## Ejecucion rapida
```bash
python iso_fits_calculator.py
python involute_gear_iso53.py
python shafts_keys_bearings_skf.py
```
