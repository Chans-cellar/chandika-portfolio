/* ═══════════════════════════════════════════════════════════════
   The Specimen: one surface, three ways of seeing it.
     mode 0 · MATH  → iso-contours of the displacement field
     mode 1 · MESH  → barycentric wireframe of the tessellation
     mode 2 · SHADE → thin-film iridescent shading + rim light
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from "three";
import { VERT, FRAG, PLOT_VERT, PLOT_FRAG } from "./shaders";

export type SceneState = { x: number; y: number; scale: number; dim: number; plot: number };
export type FrameInfo = { t: number; fps: number };
export type Scene = {
  start(): void;
  dispose(): void;
  setMode(i: number): void;
  set(state: Partial<SceneState>): void;
};

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

  // ── Specimen ────────────────────────────────────────────────
  const geo = new THREE.IcosahedronGeometry(1, isSmall ? 26 : 38); // non-indexed
  const count = geo.attributes.position.count;
  const bary = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 3) bary.set([1, 0, 0, 0, 1, 0, 0, 0, 1], i * 3);
  geo.setAttribute("aBary", new THREE.BufferAttribute(bary, 3));

  const uniforms = {
    uTime: { value: 0 },
    uFreq: { value: 1.4 },
    uAmp: { value: 0.32 },
    uHit: { value: new THREE.Vector3(0, 0, 2) },
    uHitAmt: { value: 0 },
    uMix: { value: new THREE.Vector3(1, 0, 0) },
    uDim: { value: 1 },
    uAcc: { value: acc },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
  const mesh = new THREE.Mesh(geo, mat);
  const pivot = new THREE.Group();
  pivot.add(mesh);
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
  const drag = { on: false, lx: 0, ly: 0, vx: 0, vy: 0 };
  const rot = new THREE.Euler(0.3, 0, 0);
  const ray = new THREE.Raycaster();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1.1);
  const hitW = new THREE.Vector3();
  let hitTarget = 0;

  // every listener shares one signal so dispose() removes them all
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

  const ndc = new THREE.Vector2();
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

  // Drag-to-spin only in the hero, where the canvas is the subject.
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
    pivot.scale.setScalar(cur.scale * (0.55 + 0.45 * fit) * 1.02);

    if (!drag.on) {
      drag.vx *= 0.95;
      drag.vy *= 0.95;
    }
    rot.y += dt * 0.12 + drag.vx;
    rot.x += drag.vy;
    rot.x += (0.3 - rot.x) * 0.01;
    mesh.rotation.set(rot.x + mouse.y * 0.25, rot.y + mouse.x * 0.35, 0);

    // ripple where the pointer meets the specimen
    ray.setFromCamera(ndc, camera);
    sphere.center.copy(pivot.position);
    sphere.radius = 1.1 * pivot.scale.x;
    if (ray.ray.intersectSphere(sphere, hitW)) {
      mesh.worldToLocal(hitW);
      uniforms.uHit.value.lerp(hitW.normalize(), 0.2);
      hitTarget = 1;
    } else hitTarget = 0;
    uniforms.uHitAmt.value += (hitTarget - uniforms.uHitAmt.value) * k * 0.5;

    uniforms.uMix.value.set(cur.mix[0], cur.mix[1], cur.mix[2]);
    uniforms.uDim.value = cur.dim;
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
    onFrame?.({ t, fps });
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
      geo.dispose();
      mat.dispose();
      pgeo.dispose();
      pmat.dispose();
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
