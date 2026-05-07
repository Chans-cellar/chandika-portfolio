/* ============================================================
   CHANDIKA PRABHASHWARA — PORTFOLIO  v2
   script.js  — GSAP · Three.js · WebGL GLSL · Interactions
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════════
   0.  WAIT FOR DOM + GSAP REGISTRATION
══════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {

  // Register GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  initGLSLBackground();   // WebGL shader canvas — hero bg
  initAvatarCanvas();     // Three.js torus ring around avatar
  initSkillsCanvas();     // Three.js wireframe sphere — skills bg
  initHeroAnimations();   // GSAP hero entry sequence
  initScrollAnimations(); // GSAP ScrollTrigger reveals
  initCursor();           // Custom cursor + magnetic buttons
  initNav();              // Scroll-scrolled class + burger
  initTicker();           // Typewriter code ticker
  initStatCounters();     // Animated number counters
  initProjectGlow();      // Mouse-following glow on project cards
});

/* ══════════════════════════════════════════════════════════════
   1.  WEBGL GLSL SHADER BACKGROUND (hero canvas, fixed)
   — A flowing, noise-based warm mesh using raw WebGL.
   — Extremely lightweight: one fullscreen quad, one fragment shader.
══════════════════════════════════════════════════════════════ */
function initGLSLBackground() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { canvas.style.display = 'none'; return; }

  // ── Vertex shader (passthrough) ──────────────────────────────
  const vertSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // ── Fragment shader ──────────────────────────────────────────
  // Soft animated contour lines inspired by UV / shader graph previews.
  // Color palette stays strictly within the brand: #f7f0ec bg, #ff7a29 accent.
  const fragSrc = `
    precision mediump float;

    uniform float u_time;
    uniform vec2  u_resolution;
    uniform vec2  u_mouse;

    // ── Simplex-style noise helpers ──────────────────────────
    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)),
               dot(p, vec2(269.5,  83.3)));
      return fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash(i + vec2(0,0)), f - vec2(0,0)),
                     dot(hash(i + vec2(1,0)), f - vec2(1,0)), u.x),
                 mix(dot(hash(i + vec2(0,1)), f - vec2(0,1)),
                     dot(hash(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, amp = 0.5;
      for (int i = 0; i < 3; i++) {
        v += amp * noise(p);
        p  = p * 2.1 + vec2(1.7, 9.2);
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      // Flip y so top-left is 0,0
      uv.y = 1.0 - uv.y;

      // Mouse influence — very subtle warp
      vec2 mouse = u_mouse / u_resolution;
      mouse.y = 1.0 - mouse.y;
      float mdist = length(uv - mouse);
      float mwarp = 0.03 * exp(-mdist * 4.0);

      // Animated domain-warped FBM
      float t  = u_time * 0.10;
      vec2  q  = vec2(fbm(uv + vec2(0.0, t)),
                      fbm(uv + vec2(5.2, 1.3 + t)));
      q += mwarp * normalize(uv - mouse + 0.001);

      float f  = fbm(uv * 2.5 + 1.7 * q + vec2(t * 0.5, t * 0.3));
      f  = 0.5 + 0.5 * f;

      // Brand palette
      vec3 bg      = vec3(0.969, 0.941, 0.925); // #f7f0ec
      vec3 bgAlt   = vec3(0.929, 0.898, 0.875); // #ede5df
      vec3 accent  = vec3(1.0, 0.478, 0.161);   // #ff7a29

      // Contour bands — thin lines at fbm thresholds
      float band = smoothstep(0.005, 0.0, abs(f - 0.52)) +
                   smoothstep(0.005, 0.0, abs(f - 0.58)) +
                   smoothstep(0.005, 0.0, abs(f - 0.64));

      vec3 col = mix(bg, bgAlt, f * 0.6);
      col = mix(col, accent, band * 0.22);

      // Vignette — keep center clear
      float vign = 1.0 - smoothstep(0.45, 1.3, length(uv - 0.5) * 1.6);
      col = mix(bgAlt, col, vign);

      // Very subtle overall opacity so content remains readable
      gl_FragColor = vec4(col, 0.72);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER,   vertSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes  = gl.getUniformLocation(prog, 'u_resolution');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  let _glResizeTimer;
  window.addEventListener('resize', () => { clearTimeout(_glResizeTimer); _glResizeTimer = setTimeout(resize, 150); });

  let start = performance.now(), glPaused = false;
  document.addEventListener('visibilitychange', () => { glPaused = document.hidden; });
  function render() {
    requestAnimationFrame(render);
    if (glPaused) return;
    const t = (performance.now() - start) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes,  canvas.width, canvas.height);
    gl.uniform2f(uMouse, mx * (canvas.width / window.innerWidth),
                         my * (canvas.height / window.innerHeight));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  render();
}

/* ══════════════════════════════════════════════════════════════
   2.  THREE.JS — TORUS ORBIT AROUND AVATAR (hero right)
══════════════════════════════════════════════════════════════ */
function initAvatarCanvas() {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.2;

  // Wireframe torus — nods to 3D mesh / topology work
  const torusGeo  = new THREE.TorusGeometry(1.05, 0.018, 12, 90);
  const torusMat  = new THREE.MeshBasicMaterial({
    color: 0xff7a29,
    wireframe: false,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.rotation.x = Math.PI / 3;
  scene.add(torus);

  // Second thinner orbit ring — offset rotation
  const torus2Geo = new THREE.TorusGeometry(1.18, 0.01, 8, 80);
  const torus2Mat = new THREE.MeshBasicMaterial({ color: 0xff9a5c, opacity: 0.45, transparent: true });
  const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
  torus2.rotation.x = -Math.PI / 5;
  torus2.rotation.y =  Math.PI / 4;
  scene.add(torus2);

  // Small floating dots as nodes (like a graph / pipeline node)
  const dotGeo = new THREE.SphereGeometry(0.032, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xff7a29 });
  const nodeCount = 8;
  for (let i = 0; i < nodeCount; i++) {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    const angle = (i / nodeCount) * Math.PI * 2;
    dot.position.set(Math.cos(angle) * 1.05, Math.sin(angle) * 1.05 * 0.35, 0);
    dot.userData.angle = angle;
    torus.add(dot);
  }

  function fitCanvas() {
    const wrap = canvas.parentElement;
    if (!wrap) return;
    const s = wrap.offsetWidth;
    renderer.setSize(s * 1.3, s * 1.3);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  fitCanvas();
  let _avatarResizeTimer;
  window.addEventListener('resize', () => { clearTimeout(_avatarResizeTimer); _avatarResizeTimer = setTimeout(fitCanvas, 150); });

  // Subtle mouse parallax
  let targetRY = 0, targetRX = 0, currentRY = 0, currentRX = 0;
  window.addEventListener('mousemove', e => {
    targetRY = ((e.clientX / window.innerWidth)  - 0.5) * 0.6;
    targetRX = ((e.clientY / window.innerHeight) - 0.5) * 0.3;
  }, { passive: true });

  let t = 0, avatarVisible = true, avatarPaused = false;
  const avatarObs = new IntersectionObserver(entries => { avatarVisible = entries[0].isIntersecting; }, { threshold: 0 });
  avatarObs.observe(canvas);
  document.addEventListener('visibilitychange', () => { avatarPaused = document.hidden; });
  function animate() {
    requestAnimationFrame(animate);
    if (!avatarVisible || avatarPaused) return;
    t += 0.008;
    torus.rotation.z  = t;
    torus2.rotation.z = -t * 0.7;
    torus2.rotation.y =  t * 0.4;

    // Lerp toward mouse
    currentRY += (targetRY - currentRY) * 0.04;
    currentRX += (targetRX - currentRX) * 0.04;
    scene.rotation.y = currentRY;
    scene.rotation.x = currentRX;

    renderer.render(scene, camera);
  }
  animate();
}

/* ══════════════════════════════════════════════════════════════
   3.  THREE.JS — WIREFRAME ICOSAHEDRON BG (skills section)
   Nods to procedural 3D topology and shader development.
══════════════════════════════════════════════════════════════ */
function initSkillsCanvas() {
  const canvas = document.getElementById('skills-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(500, 500);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 3.5;

  // Wireframe icosahedron — very "technical artist" aesthetic
  const icoGeo = new THREE.IcosahedronGeometry(1.4, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0xff7a29,
    wireframe: true,
    opacity: 1,
    transparent: false,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  scene.add(ico);

  // Outer shell — slightly larger, lower opacity
  const icoOuter = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.65, 0),
    new THREE.MeshBasicMaterial({ color: 0xff9a5c, wireframe: true, opacity: 0.35, transparent: true })
  );
  scene.add(icoOuter);

  // ScrollTrigger-linked rotation speed
  let scrollSpeed = 0;
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '#skills',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: self => { scrollSpeed = self.getVelocity() * 0.00005; },
    });
  }

  let t = 0, baseRY = 0, skillsVisible = false, skillsPaused = false;
  const skillsObs = new IntersectionObserver(entries => { skillsVisible = entries[0].isIntersecting; }, { threshold: 0 });
  skillsObs.observe(canvas);
  document.addEventListener('visibilitychange', () => { skillsPaused = document.hidden; });
  function animate() {
    requestAnimationFrame(animate);
    if (!skillsVisible || skillsPaused) return;
    t += 0.006;
    baseRY += 0.004 + scrollSpeed * 0.5;
    scrollSpeed *= 0.9;

    ico.rotation.y = baseRY;
    ico.rotation.x = Math.sin(t * 0.4) * 0.3;
    icoOuter.rotation.y = -baseRY * 0.6;
    icoOuter.rotation.x =  Math.cos(t * 0.3) * 0.25;

    renderer.render(scene, camera);
  }
  animate();
}

/* ══════════════════════════════════════════════════════════════
   4.  GSAP — HERO ENTRY ANIMATIONS
══════════════════════════════════════════════════════════════ */
function initHeroAnimations() {
  if (typeof gsap === 'undefined') return;

  const els = document.querySelectorAll('.gs-hero');
  gsap.to(els, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.12,
    delay: 0.25,
  });
}

/* ══════════════════════════════════════════════════════════════
   5.  GSAP SCROLLTRIGGER — SECTION REVEALS
══════════════════════════════════════════════════════════════ */
function initScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Generic reveal elements
  gsap.utils.toArray('.gs-reveal').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Project cards stagger in per row
  const cards = gsap.utils.toArray('.gs-card');
  cards.forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 90%',
      },
      delay: (i % 4) * 0.07,
    });
  });

  // Timeline items slide in from left
  gsap.utils.toArray('.timeline__item.gs-reveal').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, x: -32 },
      {
        opacity: 1, x: 0,
        duration: 0.85,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 86%',
        },
        delay: i * 0.08,
      }
    );
  });

  // Horizontal scroll progress bar for sections (optional visual touch)
  // Skills canvas parallax
  if (document.getElementById('skills-canvas')) {
    gsap.to('#skills-canvas', {
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: '#skills',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   6.  CUSTOM CURSOR + MAGNETIC BUTTONS
══════════════════════════════════════════════════════════════ */
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || window.matchMedia('(hover: none)').matches) return;

  const ring = cursor.querySelector('.cursor__ring');
  const dot  = cursor.querySelector('.cursor__dot');

  let cx = -100, cy = -100; // ring (lerped)
  let dx = -100, dy = -100; // dot  (instant)
  let raf;

  window.addEventListener('mousemove', e => {
    dx = e.clientX; dy = e.clientY;
  }, { passive: true });

  function loop() {
    cx += (dx - cx) * 0.12;
    cy += (dy - cy) * 0.12;

    ring.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    dot.style.transform  = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;

    raf = requestAnimationFrame(loop);
  }
  loop();

  // Hover state
  const hoverEls = document.querySelectorAll(
    'a, button, .project-card, .showreel__play, .btn, .nav__burger'
  );
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  // ── Magnetic effect on .magnetic elements ───────────────────
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect   = el.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const distX  = (e.clientX - cx) * 0.28;
      const distY  = (e.clientY - cy) * 0.28;
      if (typeof gsap !== 'undefined') {
        gsap.to(el, { x: distX, y: distY, duration: 0.4, ease: 'power2.out' });
      }
    });
    el.addEventListener('mouseleave', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   7.  NAV — SCROLL STATE + BURGER
══════════════════════════════════════════════════════════════ */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');

  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  if (burger && drawer) {
    burger.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('.drawer__link').forEach(l => {
      l.addEventListener('click', () => {
        drawer.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   8.  TYPEWRITER TICKER
   Shows rotating shader / pipeline code snippets
   — references real tools from the CV (HLSL, VEX, Python, C#)
══════════════════════════════════════════════════════════════ */
function initTicker() {
  const el = document.getElementById('ticker-text');
  if (!el) return;

  const lines = [
    '// HLSL: surface normal remapping',
    'float3 n = UnpackNormal(tex2D(_NormalMap, uv));',
    'def procedural_mesh(geo, attrib):',
    '    pts = geo.iterPoints()',
    'vec3 pos = vP + noise(vP * freq + {t});',
    'foreach (Point pt : geo.points()) { ... }',
    '# Houdini VEX — scatter on surface',
    'i@group_boundary = neighbourcount(0,@ptnum) < 4;',
    'cb.SetGlobalVector("_Wind", windDir * speed);',
    '// Unity HLSL: triplanar UV blend',
    'Shader.Find("Custom/ProceduralTerrain")',
    '// MetaHuman pipeline automation',
    'cmds.skinCluster(influences=joints)',
  ];

  let lineIdx = 0, charIdx = 0, deleting = false, pause = 0;

  function tick() {
    const line = lines[lineIdx];

    if (pause > 0) { pause--; setTimeout(tick, 60); return; }

    if (!deleting) {
      el.textContent = line.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx >= line.length) { deleting = true; pause = 38; }
      setTimeout(tick, 42);
    } else {
      el.textContent = line.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx <= 0) {
        deleting = false;
        lineIdx = (lineIdx + 1) % lines.length;
        pause = 10;
      }
      setTimeout(tick, 22);
    }
  }
  setTimeout(tick, 1800); // start after hero animation settles
}

/* ══════════════════════════════════════════════════════════════
   9.  STAT COUNTERS (About section)
══════════════════════════════════════════════════════════════ */
function initStatCounters() {
  const nums = document.querySelectorAll('.stat__num');
  if (!nums.length || typeof ScrollTrigger === 'undefined') return;

  nums.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let triggered = false;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        if (triggered) return;
        triggered = true;
        let current = 0;
        const inc = Math.ceil(target / 30);
        const interval = setInterval(() => {
          current = Math.min(current + inc, target);
          el.textContent = current;
          if (current >= target) clearInterval(interval);
        }, 40);
      },
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   10. PROJECT CARD MOUSE-FOLLOWING GLOW
══════════════════════════════════════════════════════════════ */
function initProjectGlow() {
  document.querySelectorAll('.project-card').forEach(card => {
    const glow = card.querySelector('.project-card__glow');
    if (!glow) return;

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      glow.style.left = (e.clientX - rect.left) + 'px';
      glow.style.top  = (e.clientY - rect.top)  + 'px';
    });
  });
}
