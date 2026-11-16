# Suite CAE Mecanica y Estructural (Python + MATLAB)

Solvers numericos listos para tareas, laboratorios y validacion de proyectos universitarios de mecanica, estructuras y fluidos.

## Modulos Incluidos
1. `vigas_euler_bernoulli.py` — Reacciones, fuerza cortante $V(x)$, momento flector $M(x)$ y deflexion elastica $v(x)$.
2. `vibraciones_sismicas_tmd.py` — Integracion RK45 de edificio SDOF vs 2DOF con amortiguador de masa sintonizada (TMD).
3. `dinamica_corte_torno.py` — Fuerzas de corte (modelo de Merchant), par en husillo, potencia y rugosidad $R_a$.
4. `cfd_von_karman_lbm.m` — Solver Lattice Boltzmann D2Q9 en MATLAB para calle de vortices de von Karman ($Re = 180$).
