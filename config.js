/**
 * Public Storefront, 4 Flagship 3D CAD Assemblies, 8 Resource Packs & Global Contact Configuration
 */
window.STUDIO_CONFIG = {
  brand: {
    phoneLocal: '096 166 6180',
    phoneIntl: '+593 96 166 6180',
    whatsappNumber: '593961666180',
  },

  cadModels: [
    { id: 'bionic_hand', tag: '129 parts', standard: 'ISO 2768-f' },
    { id: 'bionic_prosthesis', tag: '196 parts', standard: 'ISO 2768-f' },
    { id: 'differential_wrist', tag: '16 parts', standard: 'ISO 23509' },
    { id: 'punch_press', tag: '26 parts', standard: 'DIN 55101' },
  ],

  impactStats: [
    { id: 'stat_1', target: 140, decimals: 0, suffix: '+' },
    { id: 'stat_2', target: 99.4, decimals: 1, suffix: '%' },
    { id: 'stat_3', text: '0.000 cm³' },
    { id: 'stat_4', text: '< 2 h' },
  ],

  services: [
    { id: 'cad_pro', icon: 'cad', fromUsd: 10 },
    { id: 'reports_papers', icon: 'paper', fromUsd: 6 },
    { id: 'cae_sim', icon: 'cae', fromUsd: 8 },
    { id: 'cfd_fluids', icon: 'cfd', fromUsd: 9 },
    { id: 'code_py_mat', icon: 'code', fromUsd: 8 },
    { id: 'latex_pub', icon: 'latex', fromUsd: 5 },
    { id: 'robotics_3d', icon: 'mech', fromUsd: 12 },
    { id: 'urgent_all', icon: 'bolt', fromUsd: 15 },
  ],

  socialProof: [
    { id: 'rev_1', rating: 5 },
    { id: 'rev_2', rating: 5 },
    { id: 'rev_3', rating: 5 },
    { id: 'rev_4', rating: 5 },
    { id: 'rev_5', rating: 5 },
    { id: 'rev_6', rating: 5 },
  ],

  products: [
    {
      id: 'cad_kit',
      priceUsd: 7,
      totalFiles: 4,
      featured: false,
      previewImage: './assets/previews/preview_cad_kit.png',
      downloadUrl: './packs/01_cad_elements_kit.zip',
      equationTex: 'L_{10h} = \\frac{10^6}{60\\,n}\\left(\\frac{C}{P_{\\mathrm{eq}}}\\right)^3, \\quad d = m\\,z',
      files: [
        'iso_fits_calculator.py',
        'involute_gear_iso53.py',
        'shafts_keys_bearings_skf.py',
        'README_CAD_KIT.md',
      ],
      sampleFile: 'involute_gear_iso53.py',
      sampleCode: `def calculate_spur_gear(module_m: float, teeth_z: int, pressure_angle_deg: float = 20.0):
    m = float(module_m)
    z = int(teeth_z)
    alpha = math.radians(pressure_angle_deg)
    d = m * z
    db = d * math.cos(alpha)
    da = d + 2.0 * m
    df = d - 2.5 * m
    return d, db, da, df`,
    },
    {
      id: 'beams_kit',
      priceUsd: 6,
      totalFiles: 2,
      featured: false,
      previewImage: './assets/previews/preview_beams_kit.png',
      downloadUrl: './packs/02_structural_beams_kit.zip',
      equationTex: 'EI\\frac{d^4 v}{dx^4} = q(x), \\qquad M_{\\max} = \\frac{P\\,a\\,b}{L}',
      files: ['vigas_euler_bernoulli.py', 'README_CAE_SUITE.md'],
      sampleFile: 'vigas_euler_bernoulli.py',
      sampleCode: `def solve_simply_supported_beam(L=6.0, point_loads=None, w_udl=4.0):
    loads = point_loads or [(24.0, 2.4), (12.0, 4.5)]
    sum_m_a = 0.5 * w_udl * (L ** 2) + sum(P * a for P, a in loads)
    RB = sum_m_a / L
    RA = w_udl * L + sum(P for P, _ in loads) - RB
    x = np.linspace(0.0, L, 400)
    V = RA - w_udl * x
    M = RA * x - 0.5 * w_udl * (x ** 2)
    return x, V, M`,
    },
    {
      id: 'tmd_kit',
      priceUsd: 6,
      totalFiles: 2,
      featured: false,
      previewImage: './assets/previews/preview_tmd_kit.png',
      downloadUrl: './packs/03_seismic_tmd_kit.zip',
      equationTex: 'm_1\\ddot{x}_1 + c_1\\dot{x}_1 + k_1 x_1 = F_{\\mathrm{TMD}}(t) - m_1\\ddot{x}_g',
      files: ['vibraciones_sismicas_tmd.py', 'README_CAE_SUITE.md'],
      sampleFile: 'vibraciones_sismicas_tmd.py',
      sampleCode: `def simulate_seismic_tmd(m1=12000.0, k1=4.8e6, mu_tmd=0.04, zeta_tmd=0.12):
    w1 = np.sqrt(k1 / m1)
    m2 = mu_tmd * m1
    w2 = (1.0 / (1.0 + mu_tmd)) * w1
    k2 = m2 * (w2 ** 2)
    c2 = 2.0 * zeta_tmd * m2 * w2
    return solve_ivp(ode_2dof, (0.0, 15.0), [0, 0, 0, 0], method="RK45")`,
    },
    {
      id: 'cfd_kit',
      priceUsd: 6,
      totalFiles: 2,
      featured: false,
      previewImage: './assets/previews/preview_cfd_kit.png',
      downloadUrl: './packs/04_cfd_lbm_kit.zip',
      equationTex: 'f_i(\\mathbf{x}+\\mathbf{c}_i\\Delta t, t+\\Delta t) - f_i = -\\frac{f_i - f_i^{\\mathrm{eq}}}{\\tau}',
      files: ['cfd_von_karman_lbm.m', 'README_CAE_SUITE.md'],
      sampleFile: 'cfd_von_karman_lbm.m',
      sampleCode: `% Lattice Boltzmann D2Q9 BGK - Von Karman Vortex Street (Re = 180)
omega = 1.0 / (3.0 * nu + 0.5);
for q = 1:9
    cu = ex(q)*ux + ey(q)*uy;
    feq = w(q) * rho .* (1 + 3*cu + 4.5*cu.^2 - 1.5*(ux.^2 + uy.^2));
    f(:,:,q) = f(:,:,q) - omega * (f(:,:,q) - feq);
end`,
    },
    {
      id: 'turning_kit',
      priceUsd: 5,
      totalFiles: 2,
      featured: false,
      previewImage: './assets/previews/preview_turning_kit.png',
      downloadUrl: './packs/05_turning_lathe_kit.zip',
      equationTex: 'F_c = \\frac{\\tau_s\\,A_c\\,\\cos(\\beta - \\alpha)}{\\sin\\phi\\,\\cos(\\phi + \\beta - \\alpha)}',
      files: ['dinamica_corte_torno.py', 'README_CAE_SUITE.md'],
      sampleFile: 'dinamica_corte_torno.py',
      sampleCode: `def analyze_turning_operation(workpiece_dia_mm=60.0, spindle_rpm=850.0, depth_of_cut_mm=1.8, feed_mm_rev=0.22):
    phi = math.radians(45.0) + 0.5 * (alpha - beta)
    Ac = depth_of_cut_mm * feed_mm_rev
    Fs = (shear_strength_mpa * Ac) / math.sin(phi)
    Fc = (Fs / math.cos(phi + beta - alpha)) * math.cos(beta - alpha)
    return Fc`,
    },
    {
      id: 'latex_kit',
      priceUsd: 4,
      totalFiles: 8,
      featured: false,
      previewImage: './assets/previews/preview_latex_kit.png',
      downloadUrl: './packs/03_latex_scientific_kit.zip',
      equationTex: '\\sigma_{\\max} = \\frac{M_{\\max}\\,c}{I}, \\quad R_a = \\frac{f^2}{32\\,r_\\varepsilon}',
      files: [
        'plantilla_informe_ingenieria.pdf',
        'plantilla_informe_ingenieria.tex',
        'engineering_report.cls',
        'engineering_theme.sty',
        'scientific_figure_style.py',
        'demo_figuras_editorial.py',
        'logo_studio.png',
        'README_LATEX_KIT.md',
      ],
      sampleFile: 'plantilla_informe_ingenieria.tex',
      sampleCode: `\\documentclass[11pt,a4paper]{engineering_report}
\\titulo{Structural Design & Gearbox Transmission Report}
\\begin{document}
\\makeengineeringcover
\\begin{sciformula}{ISO 281 Bearing Fatigue Life}
\\[ L_{10h} = \\frac{10^6}{60\\,n}\\left(\\frac{C}{P_{\\mathrm{eq}}}\\right)^p \\]
\\end{sciformula}
\\end{document}`,
    },
    {
      id: 'fourier_kit',
      priceUsd: 5,
      totalFiles: 2,
      featured: false,
      previewImage: './assets/previews/preview_fourier_kit.png',
      downloadUrl: './packs/07_chaos_fourier_kit.zip',
      equationTex: 'z(t) = \\sum_{k=-N}^{N} c_k\\,e^{i k \\omega t}, \\quad \\|\\Delta \\mathbf{x}(t)\\| \\approx \\delta_0 e^{\\lambda t}',
      files: ['07_chaos_fourier_sims.py'],
      sampleFile: '07_chaos_fourier_sims.py',
      sampleCode: `def dft_epicycles(points_complex: np.ndarray):
    N = len(points_complex)
    coeffs = []
    for k in range(N):
        freq = k if k <= N // 2 else k - N
        c = np.sum(points_complex * np.exp(-2j * np.pi * freq * np.arange(N) / N)) / N
        coeffs.append((freq, float(np.abs(c)), float(np.angle(c))))
    return sorted(coeffs, key=lambda x: x[1], reverse=True)`,
    },
    {
      id: 'master_vault',
      priceUsd: 14,
      totalFiles: 18,
      featured: true,
      previewImage: './assets/previews/preview_cae_suite.png',
      downloadUrl: './packs/08_all_access_vault.zip',
      equationTex: '\\sum_{k=1}^{7} \\text{Kits} \\;\\Rightarrow\\; \\text{CAD + CAE + CFD + LaTeX}',
      files: [
        '01_cad_elements_kit/ (4 files)',
        '02_cae_structural_suite/ (5 files)',
        '03_latex_scientific_kit/ (8 files incl. PDF)',
        'bonus_chaos_fourier_sims.py',
      ],
      sampleFile: 'All-Access Vault',
      sampleCode: `# Complete All-Access Bundle (18 verified files)
# Includes: ISO/SKF Calculators + Euler-Bernoulli Beams + 2-DOF Seismic TMD
#          + D2Q9 LBM CFD + Merchant Turning + Compiled LaTeX PDF Kit + Chaos/Fourier.`,
    },
  ],

  pricing: {
    baseUsd: { cad: 10, report: 7, solver: 8, cfd: 9, latex: 5, video: 10 },
    complexityMultiplier: { standard: 1.0, advanced: 1.5, production: 2.2 },
    deliveryDays: {
      cad: [2, 4, 7],
      report: [2, 3, 5],
      solver: [2, 3, 5],
      cfd: [2, 4, 6],
      latex: [1, 2, 4],
      video: [3, 5, 8],
    },
    rushMultiplier: 1.35,
  },

  paymentMethods: [
    { id: 'card_paypal', badgeKey: 'pay_card_badge' },
    { id: 'bank_ecuador', badgeKey: 'pay_ec_badge' },
    { id: 'whatsapp_direct', badgeKey: 'pay_ws_badge' },
  ],
};

(function freezeStudioConfig(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  Object.keys(obj).forEach((k) => {
    const val = obj[k];
    if (val && typeof val === 'object' && !Object.isFrozen(val)) {
      freezeStudioConfig(val);
    }
  });
})(window.STUDIO_CONFIG);
