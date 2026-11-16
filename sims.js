/**
 * Continuum Studio — Real-Time Interactive Physics & Engineering Solvers
 * 1) DoublePendulumSim: Coupled Lagrangian ODEs integrated with 4th-order Runge-Kutta
 * 2) FourierEpicyclesSim: Real DFT decomposition of user drawings or geometric presets
 * 3) BeamSolverSim: Analytical Euler-Bernoulli simply-supported beam V(x) & M(x) solver
 */

(function () {
  "use strict";

  const PALETTE = {
    bg: "#070C12",
    grid: "rgba(139, 155, 180, 0.08)",
    gridStrong: "rgba(139, 155, 180, 0.18)",
    cyan: "#4CC9F0",
    cyanDim: "rgba(76, 201, 240, 0.22)",
    amber: "#E5A93C",
    amberDim: "rgba(229, 169, 60, 0.22)",
    ink: "#E6EDF3",
    muted: "#8B9BB4",
    border: "#1E2D3D"
  };

  function drawTechnicalGrid(ctx, w, h, step = 32) {
    ctx.save();
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* =========================================================================
   * 1. DOUBLE PENDULUM CHAOS (RK4)
   * ========================================================================= */
  class DoublePendulumSim {
    constructor() {
      this.g = 9.81;
      this.l1 = 1.0;
      this.l2 = 1.0;
      this.m1 = 1.0;
      this.m2 = 1.0;
      this.delta0 = 0.005;
      this.reset();
    }

    setDelta(val) {
      this.delta0 = val;
      this.reset();
    }

    reset() {
      this.s1 = [2.15, 2.38, 0.0, 0.0];
      this.s2 = [2.15 + this.delta0, 2.38, 0.0, 0.0];
      this.trail1 = [];
      this.trail2 = [];
      this.divHistory = [];
      this.simTime = 0;
    }

    deriv(state) {
      const [t1, t2, w1, w2] = state;
      const { g, l1, l2, m1, m2 } = this;
      const d = t1 - t2;
      const sinD = Math.sin(d);
      const cosD = Math.cos(d);
      const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);

      const a1 =
        (-g * (2 * m1 + m2) * Math.sin(t1) -
          m2 * g * Math.sin(t1 - 2 * t2) -
          2 * sinD * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cosD)) /
        (l1 * den);

      const a2 =
        (2 *
          sinD *
          (w1 * w1 * l1 * (m1 + m2) +
            g * (m1 + m2) * Math.cos(t1) +
            w2 * w2 * l2 * m2 * cosD)) /
        (l2 * den);

      return [w1, w2, a1, a2];
    }

    rk4Step(state, dt) {
      const k1 = this.deriv(state);
      const k2 = this.deriv(state.map((v, i) => v + 0.5 * dt * k1[i]));
      const k3 = this.deriv(state.map((v, i) => v + 0.5 * dt * k2[i]));
      const k4 = this.deriv(state.map((v, i) => v + dt * k3[i]));
      return state.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    }

    energy(state) {
      const [t1, t2, w1, w2] = state;
      const { g, l1, l2, m1, m2 } = this;
      const y1 = -l1 * Math.cos(t1);
      const y2 = y1 - l2 * Math.cos(t2);
      const v1sq = (l1 * w1) ** 2;
      const v2sq = v1sq + (l2 * w2) ** 2 + 2 * l1 * l2 * w1 * w2 * Math.cos(t1 - t2);
      const ke = 0.5 * m1 * v1sq + 0.5 * m2 * v2sq;
      const pe = m1 * g * y1 + m2 * g * y2 + (m1 + m2) * g * (l1 + l2);
      return ke + pe;
    }

    stepAndDraw(ctx, w, h, dtFrame) {
      const substeps = 4;
      const hStep = Math.min(dtFrame, 0.033) / substeps;
      for (let i = 0; i < substeps; i++) {
        this.s1 = this.rk4Step(this.s1, hStep);
        this.s2 = this.rk4Step(this.s2, hStep);
        this.simTime += hStep;
      }

      const cx = w * 0.5;
      const cy = h * 0.37;
      const scale = Math.min(w, h) * 0.21;

      const coords = (s) => {
        const x1 = cx + scale * this.l1 * Math.sin(s[0]);
        const y1 = cy + scale * this.l1 * Math.cos(s[0]);
        const x2 = x1 + scale * this.l2 * Math.sin(s[1]);
        const y2 = y1 + scale * this.l2 * Math.cos(s[1]);
        return { x1, y1, x2, y2 };
      };

      const p1 = coords(this.s1);
      const p2 = coords(this.s2);

      this.trail1.push([p1.x2, p1.y2]);
      this.trail2.push([p2.x2, p2.y2]);
      if (this.trail1.length > 140) this.trail1.shift();
      if (this.trail2.length > 140) this.trail2.shift();

      const dTheta = Math.hypot(this.s1[0] - this.s2[0], this.s1[1] - this.s2[1]);
      this.divHistory.push(Math.min(dTheta, 6.5));
      if (this.divHistory.length > 160) this.divHistory.shift();

      // Background & Grid
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, w, h);
      drawTechnicalGrid(ctx, w, h, 34);

      // Trails
      const drawTrail = (pts, rgb) => {
        if (pts.length < 2) return;
        for (let i = 1; i < pts.length; i++) {
          const alpha = (i / pts.length) * 0.72;
          ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
          ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
        }
      };
      drawTrail(this.trail2, "229, 169, 60");
      drawTrail(this.trail1, "76, 201, 240");

      // Arms & Masses
      const drawArm = (p, color, alpha) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x1, p.y1, 4.2, 0, Math.PI * 2);
        ctx.arc(p.x2, p.y2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawArm(p2, PALETTE.amber, 0.85);
      drawArm(p1, PALETTE.cyan, 1.0);

      // Pivot
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Bottom Mini-Oscilloscope: Divergence |Δθ(t)|
      const stripH = 54;
      const stripY = h - stripH - 12;
      const stripX = 16;
      const stripW = w - 32;
      ctx.fillStyle = "rgba(11, 18, 25, 0.88)";
      ctx.strokeStyle = PALETTE.border;
      ctx.lineWidth = 1;
      ctx.fillRect(stripX, stripY, stripW, stripH);
      ctx.strokeRect(stripX, stripY, stripW, stripH);

      if (this.divHistory.length > 1) {
        ctx.strokeStyle = PALETTE.amber;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < this.divHistory.length; i++) {
          const px = stripX + (i / 159) * stripW;
          const py = stripY + stripH - 8 - (this.divHistory[i] / 6.5) * (stripH - 22);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.fillStyle = PALETTE.muted;
      ctx.font = 'italic 600 12px "Georgia", "Times New Roman", serif';
      ctx.fillText(`Lyapunov |Δθ(t)| = ${dTheta.toFixed(4)} rad`, stripX + 10, stripY + 15);

      return {
        m1Label: "\\(t\\)",
        m1Val: `${this.simTime.toFixed(1)} s`,
        m2Label: "\\(E_{\\mathrm{mec}}\\)",
        m2Val: `${this.energy(this.s1).toFixed(2)} J`,
        m3Label: "\\(|\\Delta\\theta(t)|\\)",
        m3Val: `${dTheta.toFixed(3)} rad`
      };
    }
  }

  /* =========================================================================
   * 2. FOURIER EPICYCLES (REAL DFT + FREEHAND DRAWING)
   * ========================================================================= */
  class FourierEpicyclesSim {
    constructor() {
      this.harmonics = 42;
      this.t = 0;
      this.path = [];
      this.coeffs = [];
      this.isDrawing = false;
      this.rawDraw = [];
      this.preset = "gear";
      this.loadPreset("gear");
    }

    setHarmonics(n) {
      this.harmonics = Math.max(3, Math.min(n, this.coeffs.length || 120));
      this.path = [];
    }

    loadPreset(name) {
      this.preset = name;
      const pts = [];
      const N = 128;
      if (name === "star") {
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          const r = 82 + 46 * Math.cos(5 * a);
          pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
        }
      } else if (name === "gear") {
        const teeth = 10;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          const toothWave = Math.tanh(4.5 * Math.sin(teeth * a));
          const r = 98 + 20 * toothWave;
          pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
        }
      } else if (name === "airfoil") {
        // NACA 4-digit cambered airfoil section centered for crisp epicycle tracing
        const half = N / 2;
        const chord = 250;
        const t = 0.16;
        const m = 0.04;
        const p = 0.4;
        const upper = [];
        const lower = [];
        for (let i = 0; i <= half; i++) {
          const beta = (i / half) * Math.PI;
          const xc = 0.5 * (1 - Math.cos(beta));
          const yt = 5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1015 * xc ** 4);
          const yc = xc < p ? (m / (p * p)) * (2 * p * xc - xc * xc) : (m / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * xc - xc * xc);
          const xPos = (xc - 0.45) * chord;
          upper.push({ x: xPos, y: -(yc + yt) * chord });
          lower.push({ x: xPos, y: -(yc - yt) * chord });
        }
        for (let i = 0; i < upper.length; i++) pts.push(upper[i]);
        for (let i = lower.length - 2; i >= 1; i--) pts.push(lower[i]);
      } else {
        // Square contour
        const perSide = N / 4;
        const S = 105;
        for (let i = 0; i < perSide; i++) pts.push({ x: -S + (2 * S * i) / perSide, y: -S });
        for (let i = 0; i < perSide; i++) pts.push({ x: S, y: -S + (2 * S * i) / perSide });
        for (let i = 0; i < perSide; i++) pts.push({ x: S - (2 * S * i) / perSide, y: S });
        for (let i = 0; i < perSide; i++) pts.push({ x: -S, y: S - (2 * S * i) / perSide });
      }
      this.computeDFT(pts);
    }

    computeDFT(pts) {
      // Resample to fixed M=128 points for crisp epicycles
      const M = 128;
      const sampled = [];
      for (let i = 0; i < M; i++) {
        const idx = Math.floor((i / M) * pts.length) % pts.length;
        sampled.push(pts[idx]);
      }

      const X = [];
      for (let k = 0; k < M; k++) {
        let re = 0;
        let im = 0;
        const freq = k <= M / 2 ? k : k - M;
        for (let n = 0; n < M; n++) {
          const phi = (2 * Math.PI * freq * n) / M;
          re += sampled[n].x * Math.cos(phi) + sampled[n].y * Math.sin(phi);
          im += sampled[n].y * Math.cos(phi) - sampled[n].x * Math.sin(phi);
        }
        re /= M;
        im /= M;
        const amp = Math.hypot(re, im);
        const phase = Math.atan2(im, re);
        X.push({ re, im, freq, amp, phase });
      }
      X.sort((a, b) => b.amp - a.amp);
      this.coeffs = X;
      this.t = 0;
      this.path = [];
    }

    startDraw(x, y, w, h) {
      this.isDrawing = true;
      this.rawDraw = [{ x: x - w * 0.5, y: y - h * 0.48 }];
    }

    moveDraw(x, y, w, h) {
      if (!this.isDrawing) return;
      this.rawDraw.push({ x: x - w * 0.5, y: y - h * 0.48 });
    }

    endDraw() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.rawDraw.length > 10) {
        // Center drawing around centroid
        let sx = 0, sy = 0;
        for (const p of this.rawDraw) {
          sx += p.x;
          sy += p.y;
        }
        const mx = sx / this.rawDraw.length;
        const my = sy / this.rawDraw.length;
        const centered = this.rawDraw.map((p) => ({ x: p.x - mx, y: p.y - my }));
        this.computeDFT(centered);
      }
    }

    stepAndDraw(ctx, w, h, dtFrame) {
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, w, h);
      drawTechnicalGrid(ctx, w, h, 34);

      const cx = w * 0.5;
      const cy = h * 0.48;

      if (this.isDrawing) {
        ctx.strokeStyle = PALETTE.amber;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i < this.rawDraw.length; i++) {
          const px = cx + this.rawDraw[i].x;
          const py = cy + this.rawDraw[i].y;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        return {
          m1Label: "MODE",
          m1Val: "CAPTURE",
          m2Label: "SAMPLES",
          m2Val: `${this.rawDraw.length}`,
          m3Label: "HARMONICS",
          m3Val: `${this.harmonics}`
        };
      }

      let x = cx;
      let y = cy;
      const count = Math.min(this.harmonics, this.coeffs.length);
      for (let i = 0; i < count; i++) {
        const { freq, amp, phase } = this.coeffs[i];
        const prevX = x;
        const prevY = y;
        const angle = freq * this.t + phase;
        x += amp * Math.cos(angle);
        y += amp * Math.sin(angle);

        if (amp > 1.2) {
          ctx.strokeStyle = "rgba(139, 155, 180, 0.22)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(prevX, prevY, amp, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = i === 0 ? PALETTE.amber : "rgba(76, 201, 240, 0.68)";
          ctx.lineWidth = i < 4 ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }

      this.path.unshift({ x, y });
      if (this.path.length > 210) this.path.pop();

      if (this.path.length > 1) {
        ctx.strokeStyle = PALETTE.amber;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i < this.path.length; i++) {
          if (i === 0) ctx.moveTo(this.path[i].x, this.path[i].y);
          else ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
      }

      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      const dt = (Math.PI * 2) / 128;
      this.t += dt * Math.min(dtFrame * 42, 1.3);
      if (this.t > Math.PI * 2) {
        this.t -= Math.PI * 2;
      }

      const domFreq = this.coeffs[1] ? Math.abs(this.coeffs[1].freq) : 1;
      return {
        m1Label: "\\(N\\)",
        m1Val: `${count} / ${this.coeffs.length}`,
        m2Label: "\\(k_{\\mathrm{dom}}\\)",
        m2Val: `${domFreq}`,
        m3Label: "\\(\\omega t\\)",
        m3Val: `${this.t.toFixed(2)} rad`
      };
    }
  }

  /* =========================================================================
   * 3. SIMPLY-SUPPORTED BEAM SOLVER V(x) & M(x)
   * ========================================================================= */
  class BeamSolverSim {
    constructor() {
      this.P = 24; // kN
      this.L = 6.0; // m
      this.ratio = 0.4; // a / L
      this.dragging = false;
    }

    setParams({ P, L, ratio }) {
      if (P !== undefined) this.P = P;
      if (L !== undefined) this.L = L;
      if (ratio !== undefined) this.ratio = Math.max(0.08, Math.min(0.92, ratio));
    }

    updateDrag(x, w) {
      const pad = 54;
      const bw = w - pad * 2;
      const r = (x - pad) / bw;
      this.ratio = Math.max(0.08, Math.min(0.92, r));
      return this.ratio;
    }

    stepAndDraw(ctx, w, h) {
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, w, h);
      drawTechnicalGrid(ctx, w, h, 34);

      const pad = 54;
      const bw = w - pad * 2;
      const a = this.ratio * this.L;
      const b = this.L - a;
      const RA = (this.P * b) / this.L;
      const RB = (this.P * a) / this.L;
      const Mmax = (this.P * a * b) / this.L;
      const Vmax = Math.max(RA, RB);

      // 1) Beam Diagram + Live Stress Gradient & Elastic Deflection Curve (Top band)
      const beamY = 78;
      const loadX = pad + this.ratio * bw;
      const EI = 2800.0; // kN*m^2 (representative steel section)
      const cTerm = Math.max(this.L * this.L - b * b, 0.01);
      const xPeak = Math.sqrt(cTerm / 3.0);
      const deltaMaxM = (this.P * b * Math.pow(cTerm, 1.5)) / (9.0 * Math.sqrt(3.0) * this.L * EI);
      const deltaMm = deltaMaxM * 1000.0;

      // Load Arrow
      ctx.strokeStyle = PALETTE.amber;
      ctx.fillStyle = PALETTE.amber;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(loadX, beamY - 42);
      ctx.lineTo(loadX, beamY - 6);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(loadX, beamY - 2);
      ctx.lineTo(loadX - 6, beamY - 13);
      ctx.lineTo(loadX + 6, beamY - 13);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'italic 600 13px "Georgia", "Times New Roman", serif';
      ctx.textAlign = "center";
      ctx.fillText(`P = ${this.P.toFixed(0)} kN`, loadX, beamY - 48);

      // Bending stress gradient across undeformed beam bar
      const stressGrad = ctx.createLinearGradient(pad, 0, pad + bw, 0);
      stressGrad.addColorStop(0.0, "#4CC9F0");
      stressGrad.addColorStop(Math.max(0.05, Math.min(0.95, this.ratio)), "#FF6B6B");
      stressGrad.addColorStop(1.0, "#4CC9F0");
      ctx.strokeStyle = stressGrad;
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(pad, beamY);
      ctx.lineTo(pad + bw, beamY);
      ctx.stroke();

      // Elastic Deflection Curve v(x) under load
      const visualDefAmp = Math.min(34, 8 + (Mmax / 180) * 24);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "#38E5C0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const nPts = 70;
      const denomPeak = Math.max(1e-6, (this.P * b * Math.pow(cTerm, 1.5)) / (9.0 * Math.sqrt(3.0) * this.L));
      for (let i = 0; i <= nPts; i++) {
        const u = i / nPts;
        const xVal = u * this.L;
        let defEI = (this.P * b * xVal * (this.L * this.L - b * b - xVal * xVal)) / (6.0 * this.L);
        if (xVal > a) {
          defEI -= (this.P * Math.pow(xVal - a, 3)) / 6.0;
        }
        const px = pad + u * bw;
        const py = beamY + Math.max(0, (defEI / denomPeak) * visualDefAmp);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      const peakPx = pad + ((b > a ? this.L - xPeak : xPeak) / this.L) * bw;
      ctx.fillStyle = "#38E5C0";
      ctx.font = 'italic 600 11.5px "Georgia", "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.fillText(`v(x) max = ${deltaMm.toFixed(1)} mm`, Math.min(pad + bw - 120, peakPx + 8), beamY + visualDefAmp + 14);

      // Supports (Pin A & Roller B)
      const drawTri = (sx, sy) => {
        ctx.strokeStyle = PALETTE.cyan;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(sx, sy + 3);
        ctx.lineTo(sx - 9, sy + 18);
        ctx.lineTo(sx + 9, sy + 18);
        ctx.closePath();
        ctx.stroke();
      };
      drawTri(pad, beamY);
      drawTri(pad + bw, beamY);
      ctx.beginPath();
      ctx.moveTo(pad + bw - 10, beamY + 21);
      ctx.lineTo(pad + bw + 10, beamY + 21);
      ctx.stroke();

      ctx.fillStyle = PALETTE.cyan;
      ctx.font = 'italic 600 12px "Georgia", "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.fillText(`RA = ${RA.toFixed(1)} kN`, pad - 8, beamY + 36);
      ctx.textAlign = "right";
      ctx.fillText(`RB = ${RB.toFixed(1)} kN`, pad + bw + 8, beamY + 36);

      // 2) Shear Diagram V(x) (Middle band)
      const vZeroY = h * 0.56;
      const vAmp = 38;
      const scaleV = Vmax > 0 ? vAmp / Math.max(this.P, 1) : 1;

      ctx.strokeStyle = PALETTE.gridStrong;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, vZeroY);
      ctx.lineTo(pad + bw, vZeroY);
      ctx.stroke();

      const yRA = vZeroY - RA * scaleV;
      const yRB = vZeroY + RB * scaleV;

      ctx.fillStyle = PALETTE.cyanDim;
      ctx.fillRect(pad, yRA, loadX - pad, vZeroY - yRA);
      ctx.fillStyle = "rgba(229, 169, 60, 0.14)";
      ctx.fillRect(loadX, vZeroY, pad + bw - loadX, yRB - vZeroY);

      ctx.strokeStyle = PALETTE.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad, vZeroY);
      ctx.lineTo(pad, yRA);
      ctx.lineTo(loadX, yRA);
      ctx.lineTo(loadX, yRB);
      ctx.lineTo(pad + bw, yRB);
      ctx.lineTo(pad + bw, vZeroY);
      ctx.stroke();

      ctx.fillStyle = PALETTE.muted;
      ctx.textAlign = "left";
      ctx.fillText("Shear Force  V(x)", pad, vZeroY - vAmp - 6);

      // 3) Bending Moment Diagram M(x) (Bottom band)
      const mZeroY = h - 30;
      const mAmp = Math.min(68, h * 0.22);
      const maxTheoreticalM = Math.max((this.P * this.L) / 4, 1);
      const mPeakY = mZeroY - (Mmax / maxTheoreticalM) * mAmp;

      ctx.strokeStyle = PALETTE.gridStrong;
      ctx.beginPath();
      ctx.moveTo(pad, mZeroY);
      ctx.lineTo(pad + bw, mZeroY);
      ctx.stroke();

      ctx.fillStyle = PALETTE.amberDim;
      ctx.beginPath();
      ctx.moveTo(pad, mZeroY);
      ctx.lineTo(loadX, mPeakY);
      ctx.lineTo(pad + bw, mZeroY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = PALETTE.amber;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(pad, mZeroY);
      ctx.lineTo(loadX, mPeakY);
      ctx.lineTo(pad + bw, mZeroY);
      ctx.stroke();

      ctx.fillStyle = PALETTE.amber;
      ctx.textAlign = "center";
      ctx.fillText(`Mmax = ${Mmax.toFixed(2)} kN·m`, loadX, mPeakY - 8);
      ctx.fillStyle = PALETTE.muted;
      ctx.textAlign = "left";
      ctx.fillText("Bending Moment  M(x)", pad, mZeroY - mAmp - 8);

      return {
        m1Label: "\\(R_A\\; /\\; R_B\\)",
        m1Val: `${RA.toFixed(1)} / ${RB.toFixed(1)} kN`,
        m2Label: "\\(|V|_{\\max}\\; /\\; \\delta_{\\max}\\)",
        m2Val: `${Vmax.toFixed(1)} kN / ${deltaMm.toFixed(1)} mm`,
        m3Label: "\\(M_{\\max}\\)",
        m3Val: `${Mmax.toFixed(2)} kN·m`
      };
    }
  }

  /* =========================================================================
   * 4. CFD VON KÁRMÁN VORTEX STREET & CYLINDER TUNNEL (2D NAVIER-STOKES)
   * ========================================================================= */
  class CfdVortexSim {
    constructor() {
      this.re = 180;
      this.speed = 1.35;
      this.cyFrac = 0.5;
      this.time = 0;
      this.particles = [];
      for (let i = 0; i < 210; i++) {
        this.particles.push({
          x: Math.random(),
          y: Math.random(),
        });
      }
    }

    setParams({ re, speed }) {
      if (re !== undefined) this.re = re;
      if (speed !== undefined) this.speed = speed;
    }

    setCylinderY(y, h) {
      this.cyFrac = Math.max(0.24, Math.min(0.76, y / Math.max(h, 1)));
    }

    reset() {
      this.re = 180;
      this.speed = 1.35;
      this.cyFrac = 0.5;
      this.time = 0;
    }

    stepAndDraw(ctx, w, h, dtFrame) {
      const dt = Math.min(dtFrame || 0.016, 0.04);
      this.time += dt;

      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, w, h);
      drawTechnicalGrid(ctx, w, h, 34);

      const cx = w * 0.26;
      const cy = h * this.cyFrac;
      const rad = Math.max(18, Math.min(30, h * 0.075));

      const isUnsteady = this.re >= 47;
      const st = isUnsteady ? Math.max(0.11, 0.2684 - 1.0356 / Math.sqrt(this.re)) : 0.0;
      const cd = 1.18 + 6.8 / Math.pow(this.re, 0.85);
      const clRms = isUnsteady ? 0.26 * (1 - Math.exp(-(this.re - 47) / 65)) : 0.0;
      const freq = st * this.speed * 3.1;
      const ampRatio = isUnsteady ? Math.min(1.0, (this.re - 47) / 140) : 0.0;

      const vortSpacing = Math.max(54, w * 0.14);
      const uConv = this.speed * 135;
      const basePhase = (this.time * uConv) % vortSpacing;

      for (let i = 0; i < 8; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        const vx = cx + rad * 1.4 + i * (vortSpacing * 0.55) + basePhase * 0.55;
        if (vx > w + 50) continue;
        const age = (vx - cx) / w;
        const spread = rad * (0.68 + age * 1.15);
        const oscillation = Math.sin(this.time * freq * 2.0 - age * 5.0) * 6 * ampRatio;
        const vy = cy + sign * spread + oscillation;
        const alpha = Math.max(0, 0.34 * ampRatio * (1 - age * 0.72));

        if (alpha > 0.02) {
          const coreRadius = rad * (1.2 + age * 1.5);
          const grad = ctx.createRadialGradient(vx, vy, 2, vx, vy, coreRadius);
          if (sign > 0) {
            grad.addColorStop(0, `rgba(76, 201, 240, ${alpha.toFixed(3)})`);
            grad.addColorStop(1, "rgba(76, 201, 240, 0)");
          } else {
            grad.addColorStop(0, `rgba(229, 169, 60, ${alpha.toFixed(3)})`);
            grad.addColorStop(1, "rgba(229, 169, 60, 0)");
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(vx, vy, coreRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const velField = (px, py) => {
        const dx = px - cx;
        const dy = py - cy;
        const r2 = Math.max(rad * rad * 1.02, dx * dx + dy * dy);
        const r4 = r2 * r2;
        const factor = rad * rad;
        let u = this.speed * (1.0 - (factor * (dx * dx - dy * dy)) / r4);
        let v = -this.speed * ((2.0 * factor * dx * dy) / r4);

        if (dx > 0) {
          const wakeExp = Math.exp(-(dy * dy) / (2 * Math.pow(rad * (1.1 + (dx / w) * 2.6), 2)));
          u *= 1.0 - 0.36 * wakeExp * Math.exp(-dx / (w * 0.65));
          v +=
            ampRatio *
            this.speed *
            0.62 *
            wakeExp *
            Math.sin((dx / vortSpacing) * Math.PI * 2 - this.time * freq * 2.1);
        }
        return { u, v };
      };

      ctx.lineWidth = 1;
      for (let row = 1; row <= 9; row++) {
        let sx = 0;
        let sy = (row / 10) * h;
        ctx.strokeStyle = "rgba(139, 155, 180, 0.22)";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        for (let s = 0; s < 52; s++) {
          const { u, v } = velField(sx, sy);
          const stepLen = w / 52;
          sx += stepLen;
          sy += (v / Math.max(0.25, u)) * stepLen;
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      for (const p of this.particles) {
        const px = p.x * w;
        const py = p.y * h;
        const { u, v } = velField(px, py);
        const dtPx = dt * 115;
        const nx = px + u * dtPx;
        const ny = py + v * dtPx;

        const speedMag = Math.hypot(u, v) / Math.max(this.speed, 0.1);
        ctx.strokeStyle =
          speedMag > 1.28
            ? "rgba(56, 229, 192, 0.85)"
            : px > cx
            ? "rgba(76, 201, 240, 0.68)"
            : "rgba(230, 237, 243, 0.6)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx / w;
        p.y = ny / h;
        const dCyl = Math.hypot(nx - cx, ny - cy);
        if (p.x > 1.02 || p.x < -0.02 || p.y < 0.02 || p.y > 0.98 || dCyl < rad * 0.95) {
          p.x = 0.0;
          p.y = 0.08 + Math.random() * 0.84;
        }
      }

      const cylGrad = ctx.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
      cylGrad.addColorStop(0, "#E6F0FA");
      cylGrad.addColorStop(0.55, "#4E6882");
      cylGrad.addColorStop(1, "#162230");
      ctx.fillStyle = cylGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.cyan;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = PALETTE.ink;
      ctx.font = 'italic 600 12.5px "Georgia", "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.fillText(
        isUnsteady
          ? `Von Karman Vortex Shedding  (Re = ${this.re}, St = ${st.toFixed(2)})`
          : `Steady Laminar Wake  (Re = ${this.re} < 47)`,
        16,
        24
      );
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText(`Drag vertical cylinder position · U∞ = ${this.speed.toFixed(2)} m/s`, 16, h - 14);

      const vortMax = isUnsteady ? (this.speed * this.re) / 28.0 : 1.2;
      return {
        m1Label: "\\(\\mathrm{Re}\\; /\\; St\\)",
        m1Val: `${this.re} / ${st.toFixed(2)}`,
        m2Label: "\\(C_D\\; /\\; C_{L,\\mathrm{rms}}\\)",
        m2Val: `${cd.toFixed(2)} / ${clRms.toFixed(2)}`,
        m3Label: "\\(|\\omega|_{\\max}\\)",
        m3Val: `${vortMax.toFixed(1)} s⁻¹`,
      };
    }
  }

  /* =========================================================================
   * 5. 2-DOF SEISMIC FRAME WITH DEN HARTOG TUNED MASS DAMPER (TMD)
   * ========================================================================= */
  class SeismicTmdSim {
    constructor() {
      this.mu = 0.04;
      this.freqRatio = 1.0;
      this.reset();
    }

    setParams({ mu, freqRatio }) {
      if (mu !== undefined) this.mu = mu;
      if (freqRatio !== undefined) this.freqRatio = freqRatio;
    }

    impulse() {
      this.v0 += 1.45;
      this.v1 += 1.45;
    }

    reset() {
      this.t = 0;
      this.x0 = 0;
      this.v0 = 0;
      this.x1 = 0;
      this.v1 = 0;
      this.xd = 0;
      this.vd = 0;
      this.hist0 = [];
      this.hist1 = [];
      // Pre-integrate 3.6 s of excitation so resonant vs. TMD curves display immediately
      for (let i = 0; i < 120; i++) {
        this._advanceOde(0.03);
        this.hist0.push(this.x0);
        this.hist1.push(this.x1);
      }
    }

    _advanceOde(dtTotal) {
      const subSteps = 6;
      const dt = dtTotal / subSteps;
      const w1 = 6.2;
      const z1 = 0.025;
      const mu = this.mu;
      const fOpt = 1.0 / (1.0 + mu);
      const zOpt = Math.sqrt((3.0 * mu) / (8.0 * (1.0 + mu)));
      const wd = fOpt * w1;
      const wExcite = this.freqRatio * w1;

      for (let s = 0; s < subSteps; s++) {
        this.t += dt;
        const xgdd =
          6.8 * Math.sin(wExcite * this.t) +
          2.6 * Math.sin(w1 * 0.92 * this.t + 0.7) * Math.exp(-0.08 * (this.t % 6.0));

        const a0 = -2.0 * z1 * w1 * this.v0 - w1 * w1 * this.x0 - xgdd;
        this.v0 += a0 * dt;
        this.x0 += this.v0 * dt;

        const relX = this.xd - this.x1;
        const relV = this.vd - this.v1;
        const forceTmd = mu * (2.0 * zOpt * wd * relV + wd * wd * relX);
        const a1 = -2.0 * z1 * w1 * this.v1 - w1 * w1 * this.x1 + forceTmd - xgdd;
        const ad = -2.0 * zOpt * wd * relV - wd * wd * relX - xgdd;

        this.v1 += a1 * dt;
        this.x1 += this.v1 * dt;
        this.vd += ad * dt;
        this.xd += this.vd * dt;
      }
      return { fOpt, zOpt };
    }

    stepAndDraw(ctx, w, h, dtFrame) {
      const dtTotal = Math.min(dtFrame || 0.016, 0.035);
      const mu = this.mu;
      const { fOpt, zOpt } = this._advanceOde(dtTotal);

      this.hist0.push(this.x0);
      this.hist1.push(this.x1);
      if (this.hist0.length > 220) this.hist0.shift();
      if (this.hist1.length > 220) this.hist1.shift();

      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, w, h);
      drawTechnicalGrid(ctx, w, h, 34);

      const scalePx = 56;
      const groundY = h * 0.54;
      const frameH = h * 0.42;

      const drawBuilding = (cxBase, sway, hasTmd, damperOffset, accentColor, label) => {
        const dx = Math.max(-72, Math.min(72, sway * scalePx));
        ctx.strokeStyle = PALETTE.gridStrong;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cxBase - 58, groundY);
        ctx.lineTo(cxBase + 58, groundY);
        ctx.stroke();

        const halfW = 36;
        const stories = 3;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2.6;
        for (const colOffset of [-halfW, halfW]) {
          ctx.beginPath();
          ctx.moveTo(cxBase + colOffset, groundY);
          for (let st = 1; st <= stories; st++) {
            const frac = st / stories;
            const ySt = groundY - frac * frameH;
            const xSt = cxBase + colOffset + dx * (0.45 * frac + 0.55 * frac * frac);
            ctx.lineTo(xSt, ySt);
          }
          ctx.stroke();
        }

        for (let st = 1; st <= stories; st++) {
          const frac = st / stories;
          const ySt = groundY - frac * frameH;
          const xCenter = cxBase + dx * (0.45 * frac + 0.55 * frac * frac);
          ctx.fillStyle = st === stories ? accentColor : "#203347";
          ctx.fillRect(xCenter - halfW - 6, ySt - 4, (halfW + 6) * 2, 7);
        }

        if (hasTmd) {
          const roofX = cxBase + dx;
          const roofY = groundY - frameH;
          const tmdX = roofX + Math.max(-38, Math.min(38, (damperOffset - sway) * scalePx * 1.1));
          ctx.strokeStyle = "#38E5C0";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(roofX - 24, roofY - 11);
          ctx.lineTo(tmdX, roofY - 11);
          ctx.stroke();

          ctx.fillStyle = PALETTE.amber;
          ctx.fillRect(tmdX - 11, roofY - 18, 22, 13);
          ctx.strokeStyle = PALETTE.ink;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(tmdX - 11, roofY - 18, 22, 13);
        }

        ctx.fillStyle = accentColor;
        ctx.font = 'italic 600 12px "Georgia", "Times New Roman", serif';
        ctx.textAlign = "center";
        ctx.fillText(label, cxBase, groundY + 18);
      };

      drawBuilding(w * 0.28, this.x0, false, 0, PALETTE.amber, "Uncontrolled Frame");
      drawBuilding(w * 0.72, this.x1, true, this.xd, PALETTE.cyan, "With Den Hartog TMD");

      const chartTop = h * 0.66;
      const chartBot = h - 20;
      const chartMid = (chartTop + chartBot) * 0.5;
      const chartHalf = (chartBot - chartTop) * 0.44;
      const padL = 24;
      const padR = w - 24;

      ctx.strokeStyle = PALETTE.gridStrong;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, chartMid);
      ctx.lineTo(padR, chartMid);
      ctx.stroke();

      const maxHist = Math.max(
        0.35,
        ...this.hist0.map((v) => Math.abs(v)),
        ...this.hist1.map((v) => Math.abs(v))
      );

      const drawTrace = (arr, color, width) => {
        if (arr.length < 2) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i++) {
          const px = padL + (i / 219) * (padR - padL);
          const py = chartMid - (arr[i] / maxHist) * chartHalf;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };

      drawTrace(this.hist0, "rgba(229, 169, 60, 0.78)", 1.7);
      drawTrace(this.hist1, PALETTE.cyan, 2.2);

      const peak0 = Math.max(1e-4, ...this.hist0.map((v) => Math.abs(v)));
      const peak1 = Math.max(0, ...this.hist1.map((v) => Math.abs(v)));
      const reductionPct = Math.max(0, Math.min(94, (1 - peak1 / peak0) * 100));

      ctx.fillStyle = PALETTE.muted;
      ctx.font = 'italic 600 11.5px "Georgia", "Times New Roman", serif';
      ctx.textAlign = "left";
      ctx.fillText("Roof Displacement Time-History: Baseline vs. TMD (Click canvas for seismic impulse)", padL, chartTop - 6);

      return {
        m1Label: "\\(\\mu = m_d / m_1\\)",
        m1Val: `${(mu * 100).toFixed(1)} %`,
        m2Label: "\\(f_{\\mathrm{opt}}\\; /\\; \\zeta_{\\mathrm{opt}}\\)",
        m2Val: `${fOpt.toFixed(3)} / ${zOpt.toFixed(3)}`,
        m3Label: "\\(\\Delta x_{\\mathrm{peak}}\\)",
        m3Val: `-${reductionPct.toFixed(0)}% drift`,
      };
    }
  }

  window.StudioSims = {
    DoublePendulumSim,
    FourierEpicyclesSim,
    BeamSolverSim,
    CfdVortexSim,
    SeismicTmdSim
  };
})();
