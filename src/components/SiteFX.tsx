"use client";

/* ═══════════════════════════════════════════════════════════════
   All imperative motion for the page: smooth scroll, the WebGL
   specimen, scroll choreography and micro-interactions.
   The markup is server-rendered; this component only enhances it
   and fully tears down on unmount (React Strict Mode safe).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { projects } from "@/lib/content";
import type { Scene, SceneState } from "@/lib/scene";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window { __booted?: boolean }
}

type Cleanup = () => void;

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function SiteFX() {
  useEffect(() => {
    const cleanups: Cleanup[] = [];
    const ac = new AbortController();
    const signal = ac.signal;
    let disposed = false;
    const ctx = gsap.context(() => {});
    const later = (s: number, fn: () => void) => ctx.add(() => gsap.delayedCall(s, fn));
    const tick = (fn: (t: number) => void) => {
      gsap.ticker.add(fn);
      cleanups.push(() => gsap.ticker.remove(fn));
    };

    const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
    window.__booted = true;

    /* ───── WebGL proxy: page never waits on Three.js ───── */
    const scene = {
      real: null as Scene | null,
      pending: { scale: 0.001 } as Partial<SceneState>,
      mode: 0,
      set(o: Partial<SceneState>) { Object.assign(this.pending, o); this.real?.set(o); },
      setMode(i: number) { this.mode = i; this.real?.setMode(i); },
    };
    const uT = $("#u-t"), uFps = $("#u-fps");
    let hudT = 0;
    const sceneReady = import("@/lib/scene")
      .then(({ createScene }) => {
        if (disposed) return;
        const s = createScene($<HTMLCanvasElement>("#gl")!, {
          onFrame: ({ t, fps }) => {
            if (t - hudT < 0.1) return;
            hudT = t;
            if (uT) uT.textContent = t.toFixed(2);
            if (uFps) uFps.textContent = String(fps);
          },
        });
        if (!s) throw new Error("no WebGL context");
        s.set(scene.pending);
        s.setMode(scene.mode);
        s.start();
        scene.real = s;
      })
      .catch((e) => {
        console.warn("WebGL scene unavailable:", e);
        document.documentElement.classList.add("no-webgl");
      });
    cleanups.push(() => { scene.real?.dispose(); scene.real = null; });

    /* ───── Lenis smooth scroll ───── */
    let lenis: Lenis | null = null;
    if (!REDUCE) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
      lenis.on("scroll", ScrollTrigger.update);
      tick((t) => lenis?.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
      window.scrollTo(0, 0);
      cleanups.push(() => { lenis?.destroy(); lenis = null; });
    }

    /* ───── Node-graph wires ───── */
    const wireProgress: number[] = [];
    const applyWire = (i: number) => {
      const p = document.getElementById(`w${i}`) as (SVGPathElement & { _len?: number }) | null;
      if (p?._len) p.style.strokeDashoffset = String(p._len * (1 - (wireProgress[i] || 0)));
    };
    const drawWires = () => {
      const g = $("#graph"), svg = $<SVGSVGElement>("#wires");
      if (!g || !svg) return;
      const gb = g.getBoundingClientRect();
      const nodes = $$(".node", g);
      let out = "";
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = $(".port--out", nodes[i])!.getBoundingClientRect();
        const b = $(".port--in", nodes[i + 1])!.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - gb.left, y1 = a.top + a.height / 2 - gb.top;
        const x2 = b.left + b.width / 2 - gb.left, y2 = b.top + b.height / 2 - gb.top;
        const dy = (y2 - y1) * 0.6;
        const d = `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
        out += `<path class="wire-bg" d="${d}"/><path class="wire" id="w${i}" d="${d}"/>`;
        if (!REDUCE) out += `<circle class="pkt" r="3.5"><animateMotion dur="${2.4 + i * 0.3}s" repeatCount="indefinite" path="${d}"/></circle>`;
      }
      svg.setAttribute("viewBox", `0 0 ${gb.width} ${gb.height}`);
      svg.innerHTML = out;
      $$<SVGPathElement & { _len?: number }>(".wire", svg).forEach((p, i) => {
        p._len = p.getTotalLength();
        p.style.strokeDasharray = String(p._len);
        applyWire(i);
      });
    };

    /* ───── Text scramble ───── */
    const GLYPHS = "!<>-_\\/[]{}—=+*^?#∂∑∫∇λπ01";
    const scramble = (el: HTMLElement & { _busy?: boolean }) => {
      if (el._busy) return;
      const original = el.dataset.text || (el.dataset.text = el.textContent || "");
      el._busy = true;
      let f = 0;
      const total = 14;
      const step = () => {
        if (disposed) { el.textContent = original; return; }
        el.textContent = [...original]
          .map((c, i) => (c === " " ? " " : i < (f / total) * original.length ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join("");
        if (++f <= total) requestAnimationFrame(step);
        else { el.textContent = original; el._busy = false; }
      };
      step();
    };
    document.addEventListener("pointerover", (e) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-scramble]");
      if (el && !el.contains(e.relatedTarget as Node)) scramble(el);
    }, { signal });

    /* ───── Cursor ───── */
    if (FINE) {
      document.documentElement.classList.add("has-cursor");
      cleanups.push(() => document.documentElement.classList.remove("has-cursor"));
      const c = $("#cursor")!, ring = $(".cursor__ring", c)!, dot = $(".cursor__dot", c)!;
      const coords = $("#cursor-coords")!, label = $("#cursor-label")!;
      const pos = { x: innerWidth / 2, y: innerHeight / 2 }, r = { ...pos };
      addEventListener("pointermove", (e) => {
        pos.x = e.clientX; pos.y = e.clientY;
        coords.textContent = `x ${String(Math.round(pos.x)).padStart(4, "0")} · y ${String(Math.round(pos.y)).padStart(4, "0")}`;
      }, { passive: true, signal });
      tick(() => {
        r.x += (pos.x - r.x) * 0.18; r.y += (pos.y - r.y) * 0.18;
        dot.style.transform = `translate(${pos.x}px,${pos.y}px)`;
        ring.style.transform = `translate(${r.x}px,${r.y}px)`;
        coords.style.transform = `translate(${pos.x + 18}px,${pos.y + 18}px)`;
      });
      document.addEventListener("pointerover", (e) => {
        const t = e.target as Element;
        const lab = t.closest<HTMLElement>("[data-cursor]");
        const hov = t.closest("a, button, [data-tilt], .sk li");
        c.classList.toggle("is-label", !!lab);
        c.classList.toggle("is-hover", !!hov && !lab);
        if (lab) label.textContent = lab.dataset.cursor || "";
      }, { signal });
      document.documentElement.addEventListener("pointerleave", () => (c.style.opacity = "0"), { signal });
      document.documentElement.addEventListener("pointerenter", () => (c.style.opacity = "1"), { signal });
    }

    /* ───── Magnetic buttons + tilt cards ───── */
    if (FINE && !REDUCE) {
      $$(".magnetic").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
        el.addEventListener("pointermove", (e) => {
          const b = el.getBoundingClientRect();
          xTo((e.clientX - b.left - b.width / 2) * 0.3);
          yTo((e.clientY - b.top - b.height / 2) * 0.4);
        }, { signal });
        el.addEventListener("pointerleave", () => { xTo(0); yTo(0); }, { signal });
        cleanups.push(() => gsap.set(el, { clearProps: "transform" }));
      });
      $$("[data-tilt]").forEach((el) => {
        const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
        const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
        gsap.set(el, { transformPerspective: 900 });
        el.addEventListener("pointermove", (e) => {
          const b = el.getBoundingClientRect();
          ry(((e.clientX - b.left) / b.width - 0.5) * 10);
          rx(-((e.clientY - b.top) / b.height - 0.5) * 10);
        }, { signal });
        el.addEventListener("pointerleave", () => { rx(0); ry(0); }, { signal });
        cleanups.push(() => gsap.set(el, { clearProps: "transform" }));
      });
    }

    /* ───── Triad visuals: Lissajous + typing VEX ───── */
    {
      const path = $<SVGPathElement>("#viz-math path");
      let ph = 0, live = false;
      const draw = () => {
        let d = "";
        for (let i = 0; i <= 360; i++) {
          const t = (i / 360) * Math.PI * 2;
          d += (i ? "L" : "M") + (100 + 88 * Math.sin(3 * t + ph)).toFixed(1) + "," + (60 + 50 * Math.sin(4 * t)).toFixed(1);
        }
        path?.setAttribute("d", d);
      };
      draw();
      if (!REDUCE) {
        ctx.add(() => ScrollTrigger.create({ trigger: ".triad", start: "top bottom", end: "bottom top", onToggle: (s) => (live = s.isActive) }));
        tick(() => { if (live) { ph += 0.008; draw(); } });
      }
      const code = $("#viz-code");
      const lines = [
        `<span class="c">// VEX · point wrangle</span>`,
        `<span class="k">float</span> n = <span class="n">noise</span>(@P * chf(<span class="n">"freq"</span>));`,
        `@P += @N * n * chf(<span class="n">"amp"</span>);`,
        `@Cd = <span class="n">chramp</span>(<span class="n">"col"</span>, n);`,
        `<span class="k">if</span> (n &lt; <span class="n">0.2</span>) <span class="n">removepoint</span>(0, @ptnum);`,
      ];
      if (code) {
        if (REDUCE) code.innerHTML = lines.join("\n");
        else {
          let li = 0;
          const step = () => {
            if (disposed) return;
            li = (li % lines.length) + 1;
            code.innerHTML = lines.slice(0, li).join("\n") + `<span class="caret"></span>`;
            later(li === lines.length ? 2.4 : 0.7, step);
          };
          step();
        }
        cleanups.push(() => (code.innerHTML = ""));
      }
    }

    /* ───── Project hover preview with procedural thumbnails ───── */
    if (FINE) {
      const pv = $("#ppreview")!, cv = $<HTMLCanvasElement>("canvas", pv)!, g = cv.getContext("2d")!;
      const img = $<HTMLImageElement>("img", pv)!, cap = $("span", pv)!;
      const thumb = makeThumbs();
      const xTo = gsap.quickTo(pv, "x", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(pv, "y", { duration: 0.6, ease: "power3.out" });
      const rTo = gsap.quickTo(pv, "rotation", { duration: 0.8, ease: "power3.out" });
      let lastX = 0;
      const names = ["flow_field.vex", "iso_contours.glsl", "voronoi_cells.hlsl", "truchet_tiles.py", "iso_stack.js", "phyllotaxis.vex", "ridgeline.glsl", "halftone.hlsl"];
      $$(".prow").forEach((row) => {
        row.addEventListener("pointerenter", () => {
          const i = Number(row.dataset.i), p = projects[i];
          if (p.image) img.src = p.image;
          else { img.removeAttribute("src"); g.drawImage(thumb(i), 0, 0); }
          cap.textContent = p.image ? p.title : names[i % names.length];
          pv.classList.add("is-on");
        }, { signal });
        row.addEventListener("pointerleave", () => pv.classList.remove("is-on"), { signal });
      });
      addEventListener("pointermove", (e) => {
        xTo(e.clientX + 24); yTo(e.clientY - 120);
        rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX;
      }, { passive: true, signal });
    }

    /* ───── Nav: hide on scroll, drawer, anchors through Lenis ───── */
    {
      const nav = $("#nav")!, burger = $("#burger")!, drawer = $("#drawer")!;
      let last = 0;
      const onScroll = (y: number) => {
        nav.classList.toggle("is-scrolled", y > 40);
        nav.classList.toggle("is-hidden", y > last && y > 400 && !drawer.classList.contains("is-open"));
        last = y;
      };
      if (lenis) lenis.on("scroll", ({ scroll }: { scroll: number }) => onScroll(scroll));
      else addEventListener("scroll", () => onScroll(scrollY), { passive: true, signal });

      const toggle = (open: boolean) => {
        drawer.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        drawer.setAttribute("aria-hidden", String(!open));
        if (open) lenis?.stop(); else lenis?.start();
      };
      burger.addEventListener("click", () => toggle(!drawer.classList.contains("is-open")), { signal });
      cleanups.push(() => { toggle(false); nav.classList.remove("is-scrolled", "is-hidden"); });

      document.addEventListener("click", (e) => {
        const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute("href")!;
        const el = id === "#top" ? document.body : $(id);
        if (!el) return;
        e.preventDefault();
        toggle(false);
        if (lenis) lenis.scrollTo(el, { offset: id === "#top" ? 0 : -20, duration: 1.6 });
        else el.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" });
      }, { signal });

      ctx.add(() => {
        $$<HTMLAnchorElement>(".nav__links a").forEach((a) => {
          const sec = $(a.getAttribute("href")!);
          if (sec) ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-active", s.isActive) });
        });
      });
    }

    /* ───── Hero render-mode switcher ───── */
    const heroMode = { current: 0, auto: true };
    {
      const wrap = $(".modes")!, btns = $$<HTMLButtonElement>(".mode", wrap), pill = $(".modes__pill", wrap)!;
      const place = (b: HTMLElement) => { pill.style.width = b.offsetWidth + "px"; pill.style.transform = `translateX(${b.offsetLeft}px)`; };
      const select = (i: number, user: boolean) => {
        heroMode.current = i;
        btns.forEach((b, j) => { b.classList.toggle("is-active", i === j); b.setAttribute("aria-checked", String(i === j)); });
        place(btns[i]);
        scene.setMode(i);
        if (user) heroMode.auto = false;
      };
      btns.forEach((b, i) => b.addEventListener("click", () => select(i, true), { signal }));
      addEventListener("resize", () => place(btns[heroMode.current]), { signal });
      requestAnimationFrame(() => place(btns[0]));
      cleanups.push(() => select(0, false));
      if (!REDUCE) {
        const cycle = () => {
          if (!heroMode.auto || disposed) return;
          if (scrollY < innerHeight * 0.6) select((heroMode.current + 1) % 3, false);
          later(4.2, cycle);
        };
        later(5, cycle);
      }
    }

    /* ───── Boot sequence ───── */
    const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2500)]).then(() => wait(50));

    const ro = new ResizeObserver(() => {
      clearTimeout(roT);
      roT = setTimeout(() => { drawWires(); ScrollTrigger.refresh(); }, 150);
    });
    let roT: ReturnType<typeof setTimeout>;
    cleanups.push(() => { ro.disconnect(); clearTimeout(roT); });

    (async () => {
      await fontsReady;
      if (disposed) return;
      drawWires();
      ctx.add(() => setupScroll({ scene, heroMode, REDUCE, wireProgress, applyWire, signal }));
      const graph = $("#graph");
      if (graph) ro.observe(graph);

      scene.set({ scale: 0.001 });
      // wait for the scene, but never longer than 4.5s: on a slow link the 3D fades in later
      await runLoader(Promise.race([sceneReady, wait(4500)]), REDUCE, ctx);
      if (disposed) return;
      lenis?.start();
      ctx.add(() => introHero(REDUCE));
      scene.set(innerWidth > 1100 ? { x: 0.42, y: 0.08, scale: 1.15, dim: 1 } : { x: 0, y: 0.3, scale: 0.85, dim: 0.6 });
      ScrollTrigger.refresh();
    })().catch((e) => {
      console.error(e);
      document.documentElement.classList.add("failsafe");
    });

    return () => {
      disposed = true;
      ac.abort();
      ctx.revert();
      cleanups.reverse().forEach((fn) => fn());
      const loader = $("#loader");
      if (loader) loader.style.display = "";
    };
  }, []);

  return null;
}

/* ═══════════════════════════ LOADER + HERO INTRO ═════════════════ */

function runLoader(ready: Promise<unknown>, REDUCE: boolean, ctx: gsap.Context) {
  const loader = $("#loader")!, num = $("#loader-num")!, bar = $("#loader-bar")!, log = $("#loader-log")!;
  const msgs = ["initialising context…", "compiling shaders…", "tessellating icosphere…", "baking noise field…", "uploading buffers…", "first frame ✓"];
  const o = { v: 0 };
  return new Promise<void>((resolve) => {
    if (REDUCE) { loader.style.display = "none"; resolve(); return; }
    ctx.add(() => {
      gsap.timeline()
        .to(o, {
          v: 100, duration: 1.8, ease: "power2.inOut",
          onUpdate() {
            num.textContent = String(Math.round(o.v)).padStart(3, "0");
            bar.style.transform = `scaleX(${o.v / 100})`;
            log.textContent = msgs[Math.min(msgs.length - 1, Math.floor((o.v / 100) * msgs.length))];
          },
        })
        .add(() => {
          ready.then(() =>
            ctx.add(() => {
              gsap.timeline({ onComplete: () => { loader.style.display = "none"; } })
                .to([".loader__count", ".loader__top", ".loader__bar"], { yPercent: -40, opacity: 0, duration: 0.6, ease: "power3.in", stagger: 0.05 })
                .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "-=0.2")
                .add(resolve, "-=0.7");
            }),
          );
        });
    });
  });
}

function introHero(REDUCE: boolean) {
  const chars = $$(".hero__row .ch");
  if (REDUCE) {
    gsap.set([".hero .reveal-up", ".hero__meta .reveal-line", ".hero__scroll", ".hero__coords"], { opacity: 1, y: 0 });
    return;
  }
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .from(chars, { yPercent: 115, rotate: 8, duration: 1.5, stagger: 0.03 })
    .to(".hero__meta .reveal-line", { opacity: 1, duration: 0.8, stagger: 0.08 }, 0.3)
    .fromTo(".hero__meta .reveal-line", { x: -20 }, { x: 0, duration: 1, stagger: 0.08 }, 0.3)
    .to(".hero .reveal-up", { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 }, 0.6)
    .to([".hero__scroll", ".hero__coords"], { opacity: 1, duration: 1 }, 1);
}

/* ═══════════════════════════ SCROLL CHOREOGRAPHY ═════════════════ */

type ScrollDeps = {
  scene: { set(o: Partial<SceneState>): void; setMode(i: number): void };
  heroMode: { current: number };
  REDUCE: boolean;
  wireProgress: number[];
  applyWire: (i: number) => void;
  signal: AbortSignal;
};

function setupScroll({ scene, heroMode, REDUCE, wireProgress, applyWire, signal }: ScrollDeps) {
  // progress HUD
  const bar = $("#progress-bar")!, pct = $("#progress-pct")!;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (s) => {
      bar.style.transform = `scaleX(${s.progress})`;
      pct.textContent = String(Math.round(s.progress * 100)).padStart(2, "0") + "%";
    },
  });

  $$(".sec-rule").forEach((r) =>
    gsap.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: r, start: "top 90%" } }));

  $$(".reveal-up").filter((el) => !el.closest(".hero")).forEach((el) =>
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } }));

  // headings: word masks rise
  $$("[data-split-words]").forEach((h) =>
    gsap.from($$(".w > span", h), { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 85%" } }));

  // about lead: words light up as you read (scrubbed)
  const lead = $("[data-words]");
  if (lead) {
    gsap.fromTo($$(".w > span", lead), { opacity: 0.14 }, {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: lead, start: "top 80%", end: "bottom 40%", scrub: true },
    });
  }

  // stat counters
  $$("[data-count]").forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: Number(el.dataset.count), duration: 1.8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: () => { el.textContent = String(Math.round(o.v)); },
    });
  });

  // avatar: lazy-swap to the animated WebP + clip reveal
  const av = $<HTMLImageElement>("#avatar img");
  if (av) {
    ScrollTrigger.create({
      trigger: "#avatar", start: "top bottom+=200", once: true,
      onEnter: () => { const i = new Image(); i.onload = () => (av.src = av.dataset.src!); i.src = av.dataset.src!; },
    });
  }
  gsap.fromTo(".avatar__box", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: "#avatar", start: "top 80%" } });
  gsap.fromTo(".gizmo", { scale: 0, transformOrigin: "20% 80%" }, { scale: 1, duration: 1, ease: "back.out(2)", delay: 0.6, scrollTrigger: { trigger: "#avatar", start: "top 80%" } });

  gsap.from(".triad__card", { y: 80, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".triad", start: "top 85%" } });

  // marquee: base drift + scroll velocity
  const track = $("#marquee");
  if (track && !REDUCE) {
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      onUpdate: (s) => {
        const v = s.getVelocity(), dir = s.direction;
        gsap.to(loop, {
          timeScale: dir * (1 + Math.min(Math.abs(v) / 250, 5)), duration: 0.2, overwrite: true,
          onComplete: () => { gsap.to(loop, { timeScale: dir, duration: 1.2, overwrite: true }); },
        });
        gsap.to(track, {
          skewX: gsap.utils.clamp(-8, 8, -v / 300), duration: 0.4, overwrite: true,
          onComplete: () => { gsap.to(track, { skewX: 0, duration: 0.6 }); },
        });
      },
    });
  }

  // reel: frame opens to full-bleed, title scales back
  if (!REDUCE) {
    gsap.fromTo("#reel-frame", { clipPath: "inset(22% 22% 22% 22% round 28px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
      scrollTrigger: { trigger: ".reel__stage", start: "top top", end: "45% top", scrub: true },
    });
    gsap.fromTo(".reel__title", { scale: 1, opacity: 1 }, {
      scale: 0.7, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".reel__stage", start: "top top", end: "40% top", scrub: true },
    });
  }

  // node graph: nodes slide in, wires draw with scroll
  const nodes = $$(".node");
  nodes.forEach((n, i) => gsap.from(n, {
    x: n.classList.contains("node--out") ? 0 : i % 2 ? 60 : -60, opacity: 0, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: n, start: "top 85%" },
  }));
  const setWire = (i: number, s: ScrollTrigger) => { wireProgress[i] = REDUCE ? 1 : s.progress; applyWire(i); };
  nodes.slice(0, -1).forEach((n, i) => ScrollTrigger.create({
    trigger: n, start: "bottom 75%", endTrigger: nodes[i + 1], end: "top 60%",
    onUpdate: (s) => setWire(i, s), onRefresh: (s) => setWire(i, s),
  }));

  // entrances
  ScrollTrigger.batch("#works-grid .work, #works-grid .slot", { start: "top 92%", onEnter: (els) => { gsap.from(els, { y: 60, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08 }); } });
  ScrollTrigger.batch(".prow", { start: "top 92%", onEnter: (els) => { gsap.from(els, { y: 40, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }); } });
  ScrollTrigger.batch(".article, .sk, .edu__item", { start: "top 90%", onEnter: (els) => { gsap.from(els, { y: 50, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08 }); } });
  $$(".sk").forEach((sk) => gsap.from($$("li", sk), { opacity: 0, x: -14, duration: 0.6, stagger: 0.035, ease: "power2.out", scrollTrigger: { trigger: sk, start: "top 85%" } }));

  // contact title
  $$(".contact__title [data-split]").forEach((el, i) =>
    gsap.from($$(".ch", el), { yPercent: 110, rotate: 6, duration: 1.2, ease: "expo.out", stagger: 0.025, delay: i * 0.1, scrollTrigger: { trigger: ".contact__title", start: "top 85%" } }));

  // article glow follows the pointer
  $$(".article").forEach((el) => el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { signal }));

  // ── Specimen choreography: each section re-frames the 3D object ──
  const wide = () => innerWidth > 1100;
  type St = Partial<SceneState> & { mode?: number };
  const states: Record<string, () => St> = {
    hero: () => ({ x: wide() ? 0.42 : 0, y: wide() ? 0.08 : 0.3, scale: wide() ? 1.15 : 0.85, dim: wide() ? 1 : 0.6, plot: 1 }),
    about: () => ({ x: wide() ? -0.55 : 0, y: 0, scale: 1.9, dim: 0.28, plot: 0.4, mode: 1 }),
    reel: () => ({ x: 0, y: 0, scale: 0.6, dim: 0, plot: 0 }),
    pipeline: () => ({ x: 0, y: 0, scale: 2.4, dim: 0.22, plot: 0.3, mode: 0 }),
    works: () => ({ x: wide() ? 0.75 : 0.5, y: -0.4, scale: 1.4, dim: 0.18, plot: 0.2, mode: 2 }),
    projects: () => ({ x: wide() ? -0.7 : 0, y: 0.3, scale: 1.2, dim: 0.25, plot: 0.2, mode: 1 }),
    writing: () => ({ x: 0.7, y: 0.4, scale: 0.9, dim: 0.22, plot: 0.3, mode: 0 }),
    skills: () => ({ x: -0.7, y: -0.35, scale: 1.1, dim: 0.13, plot: 0.4, mode: 2 }),
    education: () => ({ x: 0.6, y: -0.2, scale: 1, dim: 0.22, plot: 0.5, mode: 1 }),
    contact: () => (wide()
      ? { x: 0.68, y: 0.05, scale: 1.05, dim: 0.62, plot: 1, mode: 2 }
      : { x: 0.35, y: -0.45, scale: 0.9, dim: 0.38, plot: 0.6, mode: 2 }),
  };
  const apply = (id: string) => {
    const s = states[id]?.();
    if (!s) return;
    const { mode, ...rest } = s;
    scene.set(rest);
    if (mode !== undefined) scene.setMode(mode);
    else if (id === "hero") scene.setMode(heroMode.current);
  };
  Object.keys(states).forEach((id) => {
    const el = document.getElementById(id);
    if (el) ScrollTrigger.create({ trigger: el, start: "top 55%", end: "bottom 45%", onEnter: () => apply(id), onEnterBack: () => apply(id) });
  });
}

/* ═══════════════════════════ PROCEDURAL THUMBNAILS ═══════════════ */

function makeThumbs() {
  const W = 420, H = 300;
  const cache: HTMLCanvasElement[] = [];
  const rnd = (s: number) => () => ((s = (Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5) | 0), ((s ^ (s >>> 14)) >>> 0) / 4294967296);
  const vnoise = (x: number, y: number) => Math.sin(x * 1.7 + Math.sin(y * 1.3)) * Math.cos(y * 1.1 + Math.sin(x * 0.7));
  const ACC = "#ff6b1f", INK = "#ede8e0";
  type G = CanvasRenderingContext2D;
  const algos: ((g: G, r: () => number) => void)[] = [
    (g, r) => { // flow field
      g.strokeStyle = ACC; g.globalAlpha = 0.5; g.lineWidth = 1;
      for (let i = 0; i < 380; i++) {
        let x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y);
        for (let s = 0; s < 40; s++) { const a = vnoise(x * 0.012, y * 0.012) * Math.PI * 2; x += Math.cos(a) * 3; y += Math.sin(a) * 3; g.lineTo(x, y); }
        g.stroke();
      }
    },
    (g) => { // contour rings
      g.lineWidth = 1;
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = k % 5 ? "rgba(237,232,224,.35)" : ACC; g.beginPath();
        for (let a = 0; a <= 361; a += 2) {
          const t = (a * Math.PI) / 180, rr = 12 + k * 9 + vnoise(Math.cos(t) * 2 + k * 0.08, Math.sin(t) * 2) * 14;
          const x = W / 2 + Math.cos(t) * rr * 1.25, y = H / 2 + Math.sin(t) * rr;
          if (a) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.stroke();
      }
    },
    (g, r) => { // voronoi
      const pts = Array.from({ length: 22 }, () => [r() * W, r() * H]);
      const img = g.createImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let d1 = 1e9, d2 = 1e9;
        for (const [px, py] of pts) { const d = (px - x) ** 2 + (py - y) ** 2; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
        const e = Math.sqrt(d2) - Math.sqrt(d1), v = e < 1.5 ? 1 : Math.max(0, 0.18 - Math.sqrt(d1) / 400);
        const i = (y * W + x) * 4;
        img.data[i] = 255 * v; img.data[i + 1] = 107 * v; img.data[i + 2] = 31 * v; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    },
    (g, r) => { // truchet
      const s = 30; g.lineWidth = 2;
      for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
        g.strokeStyle = r() < 0.15 ? ACC : "rgba(237,232,224,.6)"; g.beginPath();
        if (r() < 0.5) { g.arc(x, y, s / 2, 0, Math.PI / 2); g.moveTo(x + s, y + s / 2); g.arc(x + s, y + s, s / 2, -Math.PI / 2, Math.PI, true); }
        else { g.arc(x + s, y, s / 2, Math.PI / 2, Math.PI); g.moveTo(x + s / 2, y + s); g.arc(x, y + s, s / 2, 0, -Math.PI / 2, true); }
        g.stroke();
      }
    },
    (g) => { // isometric tower stack
      g.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const cx = W / 2 + Math.sin(i * 0.9) * 30, cy = H - 40 - i * 26, w = 70 - i * 3;
        g.fillStyle = i % 3 === 2 ? ACC : `rgba(237,232,224,${0.1 + i * 0.05})`; g.strokeStyle = "rgba(237,232,224,.6)";
        g.beginPath(); g.moveTo(cx, cy - w / 2); g.lineTo(cx + w, cy); g.lineTo(cx, cy + w / 2); g.lineTo(cx - w, cy); g.closePath(); g.fill(); g.stroke();
      }
    },
    (g) => { // phyllotaxis: golden angle
      const ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < 520; i++) {
        const rr = 5.6 * Math.sqrt(i), a = i * ga;
        g.fillStyle = i % 13 === 0 ? ACC : "rgba(237,232,224,.75)";
        g.beginPath(); g.arc(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr, 1 + i / 260, 0, 7); g.fill();
      }
    },
    (g) => { // stacked sine ridges
      g.lineWidth = 1.2;
      for (let k = 0; k < 28; k++) {
        const y0 = 30 + k * 9; g.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const c = Math.exp(-((x - W / 2) ** 2) / 5000), y = y0 - c * (20 + Math.abs(vnoise(x * 0.05, k)) * 30);
          if (x) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fillStyle = "#0d0d0f"; g.fill();
        g.strokeStyle = k === 14 ? ACC : "rgba(237,232,224,.7)"; g.stroke();
      }
    },
    (g) => { // halftone
      for (let y = 6; y < H; y += 11) for (let x = 6; x < W; x += 11) {
        const d = Math.hypot(x - W * 0.55, y - H * 0.45) / 150, v = Math.max(0, 1 - d) * (0.6 + 0.4 * vnoise(x * 0.03, y * 0.03));
        g.fillStyle = v > 0.55 ? ACC : INK; g.beginPath(); g.arc(x, y, v * 5, 0, 7); g.fill();
      }
    },
  ];
  return (i: number) => {
    if (cache[i]) return cache[i];
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d")!; g.fillStyle = "#0d0d0f"; g.fillRect(0, 0, W, H);
    algos[i % algos.length](g, rnd(i * 9973 + 7));
    return (cache[i] = c);
  };
}
