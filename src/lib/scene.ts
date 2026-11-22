/* ═══════════════════════════════════════════════════════════════
   The Specimen: a Fibonacci nautilus, seen three ways.
   See shaders.ts for the maths; this file builds buffers, wires
   uniforms, and runs the render loop.
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from "three";
import { SHELL, SHELL_VERT, SHELL_FRAG, SEPTA_VERT, SEPTA_FRAG, PLOT_VERT, PLOT_FRAG } from "./shaders";

export type SceneState = { x: number; y: number; scale: number; dim: number; plot: number };
export type FrameInfo = { t: number; theta: number; fps: number };
export type Scene = {
  start(): void;
  dispose(): void;
  setMode(i: number): void;
  set(state: Partial<SceneState>): void;
};

/** Non-indexed (u,v) grid with barycentric coords for the wireframe mode. */
function shellGeometry(nu: number, nv: number) {
  const quads = nu * nv;
  const uv = new Float32Array(quads * 6 * 2);
  const bary = new Float32Array(quads * 6 * 3);
  const B3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  let o = 0;
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
      const tri = [u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1];
      uv.set(tri, o * 2);
      bary.set(B3, o * 3);
      bary.set(B3, o * 3 + 9);
      o += 6;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("aUV", new THREE.BufferAttribute(uv, 2));
  g.setAttribute("aBary", new THREE.BufferAttribute(bary, 3));
  // positions are computed in the vertex shader; give three.js a dummy + safe bounds
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(quads * 6 * 3), 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return g;
}

/** Stack of disk grids, one per chamber wall (septum). */
function septaGeometry(count: number, nr: number, na: number) {
  const verts = (nr + 1) * (na + 1);
  const attr = new Float32Array(count * verts * 3);
  const index: number[] = [];
  for (let s = 0; s < count; s++) {
    const base = s * verts;
    for (let i = 0; i <= nr; i++)
      for (let j = 0; j <= na; j++) {
        const k = (base + i * (na + 1) + j) * 3;
        attr[k] = i / nr;
        attr[k + 1] = j / na;
        attr[k + 2] = s;
      }
    for (let i = 0; i < nr; i++)
      for (let j = 0; j < na; j++) {
        const a = base + i * (na + 1) + j, b = a + na + 1;
        index.push(a, b, a + 1, a + 1, b, b + 1);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("aSep", new THREE.BufferAttribute(attr, 3));
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * verts * 3), 3));
  g.setIndex(index);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return g;
}

/** Golden-spiral rim + quarter-turn spokes, drawn in the section plane (Math mode). */
function spiralGuides() {
  const { B, W, CEN, SCALE } = SHELL;
  const loc = (x: number, y: number) => [(x - CEN[0]) * SCALE, (y - CEN[1]) * SCALE, 0.01];
  const pts: number[] = [];
  const steps = 420;
  for (let i = 0; i < steps; i++) {
    const t0 = -W + (W * i) / steps, t1 = -W + (W * (i + 1)) / steps;
    const r0 = Math.exp(B * t0), r1 = Math.exp(B * t1);
    pts.push(...loc(Math.cos(t0) * r0, Math.sin(t0) * r0), ...loc(Math.cos(t1) * r1, Math.sin(t1) * r1));
  }
  // spokes every quarter turn: consecutive lengths differ by exactly φ
  for (let k = 0; k * (Math.PI / 2) < W; k++) {
    const th = -k * (Math.PI / 2), r = Math.exp(B * th);
    pts.push(...loc(0, 0), ...loc(Math.cos(th) * r, Math.sin(th) * r));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
  return g;
}

export function createScene(
  canvas: HTMLCanvasElement,
  { onFrame }: { onFrame?: (f: FrameInfo) => void } = {},
): Scene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;
  let PR = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 1.75);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x0a0a0b, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  const acc = new THREE.Color("#ff6b1f");

  // ── Shared uniforms ─────────────────────────────────────────
  const uniforms = {
    uTime: { value: 0 },
    uPhase: { value: 0 },
    uAmp: { value: 0.025 },
    uHit: { value: new THREE.Vector3(0, 0, 9) },
    uHitAmt: { value: 0 },
    uCut: { value: 1 },
    uMix: { value: new THREE.Vector3(1, 0, 0) },
    uDim: { value: 1 },
    uAcc: { value: acc },
  };

  // ── Nautilus ────────────────────────────────────────────────
  const shellGeo = shellGeometry(isSmall ? 240 : 360, isSmall ? 40 : 56);
  const shellMat = new THREE.ShaderMaterial({ vertexShader: SHELL_VERT, fragmentShader: SHELL_FRAG, uniforms, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.frustumCulled = false;

  const SEPTA = Math.ceil((SHELL.W - SHELL.LBODY) / SHELL.DELTA) + 1;
  const septaGeo = septaGeometry(SEPTA, 10, 40);
  const septaMat = new THREE.ShaderMaterial({ vertexShader: SEPTA_VERT, fragmentShader: SEPTA_FRAG, uniforms, side: THREE.DoubleSide });
  const septa = new THREE.Mesh(septaGeo, septaMat);
  septa.frustumCulled = false;

  const guideGeo = spiralGuides();
  const guideMat = new THREE.LineBasicMaterial({ color: 0xffd2b0, transparent: true, opacity: 0, depthWrite: false });
  const guides = new THREE.LineSegments(guideGeo, guideMat);

  const specimen = new THREE.Group();
  specimen.add(shell, septa, guides);
  const pivot = new THREE.Group();
  pivot.add(specimen);
  scene.add(pivot);

  // ── Plotted surface: z = sin(x)·cos(y) ──────────────────────
  const N = isSmall ? 70 : 110;
  const pts = new Float32Array(N * N * 3);
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const k = (i * N + j) * 3;
      pts[k] = (i / (N - 1) - 0.5) * 18;
      pts[k + 2] = (j / (N - 1) - 0.5) * 18;
    }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  const puni = { uTime: uniforms.uTime, uSize: { value: 2.2 }, uPR: { value: PR }, uAcc: uniforms.uAcc, uDim: { value: 1 } };
  const pmat = new THREE.ShaderMaterial({
    vertexShader: PLOT_VERT, fragmentShader: PLOT_FRAG, uniforms: puni, transparent: true, depthWrite: false,
  });
  const plot = new THREE.Points(pgeo, pmat);
  plot.position.set(0, -1.75, -1.5);
  scene.add(plot);

  // ── State (targets are set from scroll; current values lerp) ─
  type Full = SceneState & { mix: number[] };
  const target: Full = { x: 0.9, y: 0.05, scale: 1, dim: 1, plot: 1, mix: [1, 0, 0] };
  const cur: Full = { x: 0.9, y: 0.05, scale: 0.001, dim: 1, plot: 1, mix: [1, 0, 0] };
  const keys = ["x", "y", "scale", "dim", "plot"] as const;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const drag = { on: false, lx: 0, ly: 0, vx: 0, vy: 0, ox: 0, oy: 0 };
  const ray = new THREE.Raycaster();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1.3);
  const hitW = new THREE.Vector3();
  let hitTarget = 0;

  const ac = new AbortController();
  const { signal } = ac;

  function resize() {
    // size from CSS (100lvh) so the buffer always covers the element, URL bar or not
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize, { signal });

  const ndc = new THREE.Vector2(9, 9);
  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
      ndc.set(mouse.tx, mouse.ty);
      if (drag.on) {
        drag.vx = (e.clientX - drag.lx) * 0.006;
        drag.vy = (e.clientY - drag.ly) * 0.006;
        drag.lx = e.clientX;
        drag.ly = e.clientY;
      }
    },
    { passive: true, signal },
  );

  // Drag-to-turn only in the hero, where the canvas is the subject.
  document.getElementById("hero")?.addEventListener(
    "pointerdown",
    (e) => {
      if ((e.target as Element).closest("a,button")) return;
      drag.on = true;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
    },
    { signal },
  );
  window.addEventListener("pointerup", () => (drag.on = false), { signal });

  const timer = new THREE.Timer();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frames = 0, fpsT = 0, fps = 60, slow = 0, raf = 0, running = false;

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    timer.update(now);
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = reduce ? 4 : uniforms.uTime.value + dt;
    uniforms.uTime.value = t;
    // endless growth: chambers and stripes slide inward along the spiral
    if (!reduce) uniforms.uPhase.value += dt * 0.11;

    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent lerp
    for (const key of keys) cur[key] += (target[key] - cur[key]) * k;
    for (let i = 0; i < 3; i++) cur.mix[i] += (target.mix[i] - cur.mix[i]) * k * 0.9;
    mouse.x += (mouse.tx - mouse.x) * k * 0.6;
    mouse.y += (mouse.ty - mouse.y) * k * 0.6;

    // place the pivot in view-space units so x/y are fractions of the half-frustum
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const fit = Math.min(1, camera.aspect / 1.1);
    pivot.position.set(cur.x * halfW, cur.y * halfH, 0);
    pivot.scale.setScalar(cur.scale * (0.55 + 0.45 * fit));

    // three-quarter view with a slow sway; drag adds a sprung offset
    if (!drag.on) {
      drag.vx *= 0.92;
      drag.vy *= 0.92;
      drag.ox *= 0.97;
      drag.oy *= 0.97;
    }
    drag.ox += drag.vx;
    drag.oy += drag.vy;
    specimen.rotation.set(
      -0.32 + Math.sin(t * 0.21) * 0.08 + mouse.y * 0.3 + drag.oy,
      0.38 + Math.sin(t * 0.27) * 0.22 + mouse.x * 0.45 + drag.ox,
      Math.sin(t * 0.15) * 0.06,
    );

    // ripple where the pointer meets the specimen
    ray.setFromCamera(ndc, camera);
    sphere.center.copy(pivot.position);
    sphere.radius = 1.3 * pivot.scale.x;
    if (ray.ray.intersectSphere(sphere, hitW)) {
      specimen.worldToLocal(hitW);
      uniforms.uHit.value.lerp(hitW, 0.2);
      hitTarget = 1;
    } else hitTarget = 0;
    uniforms.uHitAmt.value += (hitTarget - uniforms.uHitAmt.value) * k * 0.5;

    uniforms.uMix.value.set(cur.mix[0], cur.mix[1], cur.mix[2]);
    uniforms.uCut.value = cur.mix[0]; // Math mode opens the section
    uniforms.uDim.value = cur.dim;
    guideMat.opacity = cur.mix[0] * cur.dim * 0.85;
    guides.visible = guideMat.opacity > 0.01;
    puni.uDim.value = cur.plot * cur.dim;
    plot.rotation.y = t * 0.02 + mouse.x * 0.08;
    camera.position.x = mouse.x * 0.12;
    camera.position.y = mouse.y * 0.08;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);

    frames++;
    fpsT += dt;
    if (fpsT > 0.5) {
      fps = Math.round(frames / fpsT);
      frames = 0;
      fpsT = 0;
      // adaptive resolution: weak GPUs trade pixels for smoothness (after a warm-up)
      slow = t > 3 && fps < 30 ? slow + 1 : 0;
      if (slow >= 3 && PR > 0.6) {
        PR = Math.max(0.6, PR * 0.8);
        renderer.setPixelRatio(PR);
        puni.uPR.value = PR;
        resize();
        slow = 0;
      }
    }
    onFrame?.({ t, theta: uniforms.uPhase.value, fps });
  }

  const play = () => {
    if (running) return;
    running = true;
    timer.reset();
    raf = requestAnimationFrame(frame);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()), { signal });

  return {
    start: play,
    dispose() {
      pause();
      ac.abort();
      for (const o of [shellGeo, shellMat, septaGeo, septaMat, guideGeo, guideMat, pgeo, pmat]) o.dispose();
      renderer.dispose();
    },
    setMode(i) {
      target.mix = [0, 0, 0];
      target.mix[i] = 1;
    },
    set(state) {
      Object.assign(target, state);
    },
  };
}
