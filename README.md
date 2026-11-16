# Engineering Foundry — 3D CAD, Live Physics & Verified Resource Vault

Static, security-hardened web showcase offering multi-part 3D CAD assemblies, technical reports, IEEE/ASME manuscripts, Python/MATLAB numerical solvers, and interactive 60 FPS multi-physics simulators (English default with instant Spanish toggle).

## Architecture & Security Standards

- **Zero External CDNs / Zero Tracking**: All fonts (`Space Grotesk`, `Plus Jakarta Sans`, `JetBrains Mono` via OFL-1.1), mathematical typesetting (`KaTeX 0.16.11` MIT), and WebGL rendering engines (`Three.js r128` + `OrbitControls.js` MIT) are self-hosted cleanly in `vendor/` with open-source licenses in `vendor/licenses/`.
- **Strict Content Security Policy (CSP)**: Enforced both via `<meta http-equiv="Content-Security-Policy">` and deployment headers (`_headers`, `vercel.json`) with `default-src 'self'`, `script-src 'self'`, `font-src 'self'`, `object-src 'none'`, and `X-Frame-Options: DENY`.
- **DOM & Input Hardening**: Zero string-interpolated `innerHTML` sinks in `app.js`, frozen immutable runtime config dictionaries (`config.js`, `i18n.js`), sanitized quote/checkout fields, `rel="noopener noreferrer"` across external links, and offline/B-Rep preloaded meshes (`assets/meshes/cad_meshes_bundle.js`).
- **Clean Deliverables (`packs/`)**: 8 self-contained ZIP kits (`01` through `08`), free of bytecode artifacts (`__pycache__`, `.pyc`), with compiled PDFs (`plantilla_informe_ingenieria.pdf`) and monochrome engineering marks.
- **Structured Payment Flow**: Checkout modal supporting International Card / PayPal / Wise, zero-fee Ecuador local Bank Transfer / Deuna!, and 50% Milestone Escrow for custom engineering builds.

## Local Preview & Verification

Open `index.html` directly in any modern browser (`file:///`) or serve statically via:

```powershell
python -m http.server 8092
```
