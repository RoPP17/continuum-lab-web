/**
 * Read-Only 3D CAD Showcase Engine
 * Renders multi-material PBR engineering assemblies from preloaded B-Rep bundles
 * (works seamlessly in both file:// and http://) with orbital studio lighting.
 */
(function () {
  'use strict';

  const PBR_PALETTE = Object.freeze({
    chassis_titanium: Object.freeze({ color: 0x2b3847, metalness: 0.56, roughness: 0.38 }),
    alum_brushed: Object.freeze({ color: 0xdbe3ec, metalness: 0.78, roughness: 0.25 }),
    steel_machined: Object.freeze({ color: 0x7e92a7, metalness: 0.72, roughness: 0.30 }),
    bronze_brass: Object.freeze({ color: 0xdca048, metalness: 0.84, roughness: 0.22 }),
    chrome_pin: Object.freeze({ color: 0xf1f6fa, metalness: 0.90, roughness: 0.15 }),
    accent_cyan: Object.freeze({ color: 0x38e5c0, metalness: 0.45, roughness: 0.32 }),
  });

  const MODEL_CONFIG = Object.freeze({
    bionic_hand: Object.freeze({
      baseScale: 1.12,
      stats: Object.freeze({ parts: 129, triangles: 33188, standard: 'ISO 2768-f', status: '0.000 cm³' }),
    }),
    bionic_prosthesis: Object.freeze({
      baseScale: 1.12,
      stats: Object.freeze({ parts: 196, triangles: 52753, standard: 'ISO 2768-f', status: '0.000 cm³' }),
    }),
    differential_wrist: Object.freeze({
      baseScale: 1.05,
      stats: Object.freeze({ parts: 16, triangles: 17214, standard: 'ISO 23509', status: '0.000 cm³' }),
    }),
    punch_press: Object.freeze({
      baseScale: 1.08,
      stats: Object.freeze({ parts: 26, triangles: 11680, standard: 'DIN 55101', status: '0.000 cm³' }),
    }),
  });

  const CAMERA_PRESETS = Object.freeze({
    iso: Object.freeze([2.25, 1.48, 2.48]),
    front: Object.freeze([0.0, 0.14, 3.15]),
    side: Object.freeze([3.15, 0.14, 0.0]),
    top: Object.freeze([0.0, 3.25, 0.01]),
  });

  class CadVault {
    constructor({ container, onStatsChange, onLoadStateChange }) {
      this.container = container;
      this.onStatsChange = onStatsChange || (() => {});
      this.onLoadStateChange = onLoadStateChange || (() => {});

      this.meshCache = new Map();
      this.currentModelId = 'bionic_hand';
      this.renderMode = 'shaded';
      this.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.loadToken = 0;
      this.modelGroup = null;
      this.clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.02);
      this.targetCamPos = null;
      this.sectionHelper = null;
      this.envMap = null;
      this.clock = new THREE.Clock();

      this._initThree();
      this._bindEvents();
      this._animate();
    }

    _buildStudioEnvMap() {
      if (!this.renderer || typeof THREE.PMREMGenerator === 'undefined') return null;
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x0b121a);

      const addPanel = (color, intensity, w, h, pos, look) => {
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        mesh.position.set(...pos);
        mesh.lookAt(...look);
        envScene.add(mesh);
      };

      addPanel(0xffffff, 2.4, 12, 12, [0, 10, 0], [0, 0, 0]);       // Overhead softbox
      addPanel(0xd8ecff, 1.8, 10, 8, [9, 4, 8], [0, 0, 0]);         // Warm-cool key panel
      addPanel(0x38e5c0, 1.5, 8, 8, [-9, 3, -6], [0, 0, 0]);        // Cyan rim reflector
      addPanel(0xffb454, 1.0, 8, 6, [6, -6, -8], [0, 0, 0]);        // Subtle warm bounce
      addPanel(0x162433, 1.0, 16, 16, [0, -9, 0], [0, 0, 0]);       // Ground dark bounce

      const rt = pmrem.fromScene(envScene, 0.04);
      pmrem.dispose();
      envScene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      return rt.texture;
    }

    _initThree() {
      const w = Math.max(this.container.clientWidth || 680, 300);
      const h = Math.max(this.container.clientHeight || 480, 280);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(35, w / h, 0.05, 50);
      this.camera.position.set(...CAMERA_PRESETS.iso);

      try {
        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
      } catch (_) {
        this.onLoadStateChange(false, 'WebGL unavailable');
        return;
      }

      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h);
      this.renderer.localClippingEnabled = true;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.22;

      this.envMap = this._buildStudioEnvMap();
      if (this.envMap) {
        this.scene.environment = this.envMap;
      }

      this.renderer.domElement.className = 'cad-webgl-canvas';
      this.container.appendChild(this.renderer.domElement);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.07;
      this.controls.enablePan = false;
      this.controls.enableZoom = true;
      this.controls.enableRotate = true;
      this.controls.minDistance = 1.55;
      this.controls.maxDistance = 5.4;
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 0.95;
      this.controls.target.set(0, 0, 0);

      this._setupLightsAndStage();
    }

    _setupLightsAndStage() {
      const hemi = new THREE.HemisphereLight(0xf3f8ff, 0x101824, 0.78);
      this.scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffffff, 1.35);
      key.position.set(4.8, 6.4, 5.2);
      this.keyLight = key;
      this.scene.add(key);

      const rim = new THREE.DirectionalLight(0x38e5c0, 0.75);
      rim.position.set(-4.6, 2.8, -4.4);
      this.rimLight = rim;
      this.scene.add(rim);

      const fill = new THREE.DirectionalLight(0xffb454, 0.42);
      fill.position.set(2.2, -3.2, -2.5);
      this.scene.add(fill);

      const grid = new THREE.GridHelper(3.4, 18, 0x264457, 0x13222e);
      grid.position.y = -1.16;
      const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
      mats.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.42;
      });
      this.scene.add(grid);

      const ringGeo = new THREE.RingGeometry(1.18, 1.205, 72);
      ringGeo.rotateX(-Math.PI / 2);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: 0x38e5c0, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
      );
      ring.position.y = -1.158;
      this.scene.add(ring);

      const secGeo = new THREE.PlaneGeometry(2.35, 2.35);
      const secLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(secGeo),
        new THREE.LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.6 })
      );
      secLine.rotation.y = Math.PI / 2;
      secLine.position.x = 0.02;
      secLine.visible = false;
      this.sectionHelper = secLine;
      this.scene.add(secLine);
      secGeo.dispose();
    }

    _bindEvents() {
      this._onContextMenu = (e) => e.preventDefault();
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.addEventListener('contextmenu', this._onContextMenu);
      }
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => this.resize());
        this._resizeObserver.observe(this.container);
      } else {
        window.addEventListener('resize', () => this.resize());
      }
    }

    resize() {
      if (!this.renderer || !this.camera) return;
      const w = Math.max(this.container.clientWidth || 1, 1);
      const h = Math.max(this.container.clientHeight || 1, 1);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    setCameraPreset(preset) {
      const coords = CAMERA_PRESETS[preset] || CAMERA_PRESETS.iso;
      this.targetCamPos = new THREE.Vector3(...coords);
    }

    toggleAutoRotate() {
      this.autoRotate = !this.autoRotate;
      if (this.controls) this.controls.autoRotate = this.autoRotate;
      return this.autoRotate;
    }

    setRenderMode(mode) {
      this.renderMode = mode || 'shaded';
      if (this.sectionHelper) {
        this.sectionHelper.visible = this.renderMode === 'section';
      }
      if (this.modelGroup) {
        this._applyRenderModeToGroup(this.modelGroup);
      }
    }

    loadModel(modelId) {
      if (!Object.prototype.hasOwnProperty.call(MODEL_CONFIG, modelId) || !this.renderer) return;
      const cfg = MODEL_CONFIG[modelId];

      this.currentModelId = modelId;
      const token = ++this.loadToken;
      this.onLoadStateChange(true);

      try {
        const hasVault =
          window.CAD_MESH_VAULT && Object.prototype.hasOwnProperty.call(window.CAD_MESH_VAULT, modelId);
        const jsonData = (hasVault ? window.CAD_MESH_VAULT[modelId] : null) || this.meshCache.get(modelId);
        if (!jsonData) {
          throw new Error('Model bundle unavailable');
        }
        this.meshCache.set(modelId, jsonData);

        if (token !== this.loadToken) return;
        const runtimeStats = {
          ...cfg.stats,
          parts: jsonData.partsCount || cfg.stats.parts,
          triangles: jsonData.triangles || cfg.stats.triangles,
        };
        const built = this._buildJsonAssembly(jsonData);

        if (token !== this.loadToken) {
          this._disposeBuiltGroup(built.group);
          return;
        }

        this._clearCurrentModel();
        this.modelGroup = built.group;
        this.modelGroup.scale.setScalar(cfg.baseScale || 1.0);
        this.scene.add(this.modelGroup);
        this._applyRenderModeToGroup(this.modelGroup);

        this.onStatsChange(runtimeStats);
        this.onLoadStateChange(false);
      } catch (err) {
        if (token === this.loadToken) {
          this.onLoadStateChange(false, err.message || 'Load error');
        }
      }
    }

    _clearCurrentModel() {
      if (this.modelGroup) {
        this.scene.remove(this.modelGroup);
        this._disposeBuiltGroup(this.modelGroup);
        this.modelGroup = null;
      }
    }

    _disposeBuiltGroup(group) {
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    _makePbrMaterial(matKey) {
      const spec = PBR_PALETTE[matKey] || PBR_PALETTE.alum_brushed;
      return {
        spec,
        mat: new THREE.MeshStandardMaterial({
          color: spec.color,
          metalness: spec.metalness,
          roughness: spec.roughness,
          envMapIntensity: 1.25,
          side: THREE.DoubleSide,
        }),
      };
    }

    _buildJsonAssembly(data) {
      const group = new THREE.Group();
      const posScale = data.posScale || 1;
      const totalTris = data.triangles || 0;
      const edgeAngle = totalTris > 24000 ? 40 : 28;

      (data.groups || []).forEach((g) => {
        const geo = new THREE.BufferGeometry();
        const rawPos = g.pos || [];
        const fPos = new Float32Array(rawPos.length);
        for (let i = 0; i < rawPos.length; i++) {
          fPos[i] = rawPos[i] / posScale;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));

        if (g.idx && g.idx.length) {
          geo.setIndex(g.idx);
        }

        if (g.norm && g.norm.length === rawPos.length) {
          const fNorm = new Float32Array(g.norm.length);
          for (let i = 0; i < g.norm.length; i += 3) {
            const nx = g.norm[i];
            const ny = g.norm[i + 1];
            const nz = g.norm[i + 2];
            const len = Math.hypot(nx, ny, nz) || 1;
            fNorm[i] = nx / len;
            fNorm[i + 1] = ny / len;
            fNorm[i + 2] = nz / len;
          }
          geo.setAttribute('normal', new THREE.BufferAttribute(fNorm, 3));
        } else {
          geo.computeVertexNormals();
        }

        const { spec, mat } = this._makePbrMaterial(g.material || 'alum_brushed');
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.baseColor = new THREE.Color(spec.color);
        mesh.userData.metalness = spec.metalness;
        mesh.userData.roughness = spec.roughness;
        group.add(mesh);

        // Edge lines prebuilt for Wireframe / X-Ray inspection (hidden in clean PBR shaded mode)
        if (totalTris < 62000) {
          const edgeGeo = new THREE.EdgesGeometry(geo, edgeAngle);
          const edgeMat = new THREE.LineBasicMaterial({
            color: 0x38e5c0,
            transparent: true,
            opacity: 0.75,
          });
          const lines = new THREE.LineSegments(edgeGeo, edgeMat);
          lines.userData.isEdgeOverlay = true;
          lines.visible = false;
          mesh.add(lines);
        }
      });

      return { group };
    }

    _applyRenderModeToGroup(group) {
      const mode = this.renderMode;
      group.traverse((obj) => {
        if (obj.isLineSegments && obj.userData.isEdgeOverlay) {
          if (mode === 'wireframe' || mode === 'xray') {
            obj.visible = true;
            obj.material.color.setHex(0x38e5c0);
            obj.material.opacity = mode === 'wireframe' ? 0.92 : 0.65;
            obj.material.clippingPlanes = null;
          } else {
            obj.visible = false;
          }
          obj.material.needsUpdate = true;
          return;
        }

        if (obj.isMesh && obj.userData.baseColor) {
          const mat = obj.material;
          if (mode === 'xray') {
            mat.color.copy(obj.userData.baseColor);
            mat.transparent = true;
            mat.opacity = 0.24;
            mat.depthWrite = false;
            mat.wireframe = false;
            mat.side = THREE.DoubleSide;
            mat.clippingPlanes = null;
          } else if (mode === 'wireframe') {
            mat.color.setHex(0x28566d);
            mat.transparent = true;
            mat.opacity = 0.12;
            mat.depthWrite = false;
            mat.wireframe = true;
            mat.side = THREE.DoubleSide;
            mat.clippingPlanes = null;
          } else if (mode === 'section') {
            mat.color.copy(obj.userData.baseColor);
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.depthWrite = true;
            mat.wireframe = false;
            mat.side = THREE.DoubleSide;
            mat.clippingPlanes = [this.clipPlane];
          } else {
            mat.color.copy(obj.userData.baseColor);
            mat.transparent = false;
            mat.opacity = 1.0;
            mat.depthWrite = true;
            mat.wireframe = false;
            mat.side = THREE.DoubleSide;
            mat.clippingPlanes = null;
          }
          mat.needsUpdate = true;
        }
      });
    }

    _animate() {
      requestAnimationFrame(() => this._animate());
      if (!this.renderer || !this.controls) return;

      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();

      if (this.modelGroup && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.modelGroup.position.y = Math.sin(elapsed * 1.35) * 0.018;
      }
      if (this.rimLight) {
        this.rimLight.intensity = 0.74 + Math.sin(elapsed * 1.1) * 0.14;
      }

      if (this.targetCamPos) {
        this.camera.position.lerp(this.targetCamPos, Math.min(1, dt * 8));
        if (this.camera.position.distanceTo(this.targetCamPos) < 0.015) {
          this.camera.position.copy(this.targetCamPos);
          this.targetCamPos = null;
        }
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  window.CadVault = CadVault;
})();
