/* eslint-disable @next/next/no-img-element -- animated WebP avatar is swapped in at runtime */
import { Fragment } from "react";
import { articles, education, experience, links, projects, skills } from "@/lib/content";
import { Chars, pad, words } from "@/lib/split";
import SiteFX from "@/components/SiteFX";
import Works from "@/components/Works";
import Reel from "@/components/Reel";
import Clock from "@/components/Clock";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
// Shared ↗ icon. Note: when spreading props onto an element in a list, put `key`
// first: a key after a spread drops React to the legacy createElement path.
const arrow = (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3 9 9 3M4 3h5v5" />
  </svg>
);
const SecHead = ({ n, title, pad: padded }: { n: string; title: string; pad?: boolean }) => (
  <div className={`sec-head ${padded ? "sec-head--pad" : ""}`}>
    <span className="sec-num mono">{n}</span>
    <span className="sec-title mono">{title}</span>
    <span className="sec-rule" />
  </div>
);

export default function Home() {
  return (
    <>
      {/* ─── LOADER ─── */}
      <div className="loader" id="loader" aria-hidden="true">
        <div className="loader__grid" />
        <div className="loader__top">
          <span>CP/RENDER</span>
          <span id="loader-log">initialising context…</span>
        </div>
        <div className="loader__count">
          <span id="loader-num">000</span>
          <sup>%</sup>
        </div>
        <div className="loader__bar">
          <i id="loader-bar" />
        </div>
      </div>

      {/* ─── GLOBAL CHROME ─── */}
      <canvas id="gl" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="cols" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>

      <div className="cursor" id="cursor" aria-hidden="true">
        <div className="cursor__ring">
          <span className="cursor__label" id="cursor-label" />
        </div>
        <div className="cursor__dot" />
        <div className="cursor__coords" id="cursor-coords">x 0000 · y 0000</div>
      </div>

      <div className="progress" aria-hidden="true">
        <span className="progress__label">render</span>
        <span className="progress__track"><i id="progress-bar" /></span>
        <span className="progress__pct" id="progress-pct">00%</span>
      </div>

      <header className="nav" id="nav">
        <a href="#top" className="nav__logo" aria-label="Back to top">
          <img src="/logo.svg" alt="Chandika Prabhashwara" width={96} height={35} />
        </a>
        <nav className="nav__links" aria-label="Primary">
          {[["about", "About"], ["reel", "Reel"], ["pipeline", "Experience"], ["works", "Works"], ["projects", "Projects"], ["contact", "Contact"]].map(([id, label]) => (
            <a key={id} href={`#${id}`} data-scramble>{label}</a>
          ))}
        </nav>
        <a className="nav__cta magnetic" href={links.resume} {...ext}>
          <span>Résumé</span>
          {arrow}
        </a>
        <button className="nav__burger" id="burger" aria-label="Open menu" aria-expanded="false">
          <span /><span />
        </button>
      </header>

      <div className="drawer" id="drawer" aria-hidden="true">
        <nav>
          {[["about", "About"], ["reel", "Reel"], ["pipeline", "Experience"], ["works", "Works"], ["projects", "Projects"], ["writing", "Writing"], ["skills", "Skills"], ["education", "Education"], ["contact", "Contact"]].map(([id, label], i) => (
            <a key={id} href={`#${id}`}><sup>{pad(i + 1)}</sup>{label}</a>
          ))}
        </nav>
        <a className="drawer__resume" href={links.resume} {...ext}>Résumé ↗</a>
      </div>

      <main id="top">
        {/* ─── HERO ─── */}
        <section className="hero" id="hero">
          <div className="hero__meta mono">
            <span className="reveal-line">Technical Artist</span>
            <span className="reveal-line">CG Artist</span>
            <span className="reveal-line">Graphics Developer</span>
          </div>

          <h1 className="hero__name" aria-label="Chandika Prabhashwara">
            <span className="hero__row"><Chars text="Chandika" /></span>
            <span className="hero__row hero__row--serif"><Chars text="Prabhashwara" /></span>
          </h1>

          <div className="hero__bottom">
            <p className="hero__intro reveal-up">
              I build the bridge between <em>equations</em> and <em>images</em>: procedural tools, real-time shaders and
              game-ready pipelines that help studios move faster without losing the art.
            </p>

            <div className="hero__panel reveal-up" aria-label="Render mode">
              <div className="hero__eq mono" aria-hidden="true">
                <div>
                  <span className="dim">vec3</span> p′ = p + n · <span className="acc">snoise</span>(p·ω + t) · α
                </div>
                <div className="dim">
                  t=<b id="u-t">0.00</b> ω=<b>1.40</b> α=<b>0.32</b> · <b id="u-fps">60</b>fps
                </div>
              </div>
              <div className="modes" role="radiogroup" aria-label="Render mode">
                <span className="modes__pill" />
                <button className="mode is-active" role="radio" aria-checked="true"><i>∂</i>Math</button>
                <button className="mode" role="radio" aria-checked="false"><i>△</i>Mesh</button>
                <button className="mode" role="radio" aria-checked="false"><i>◐</i>Shade</button>
              </div>
            </div>
          </div>

          <a href="#about" className="hero__scroll mono" aria-label="Scroll to about">
            <span className="hero__scroll-line" />
            scroll to traverse the pipeline
          </a>
          <div className="hero__coords mono" aria-hidden="true">6.9271° N<br />79.8612° E</div>
        </section>

        {/* ─── MARQUEE ─── */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track" id="marquee">
            {[0, 1].map((k) => (
              <Fragment key={k}>
                <span>Mathematics</span><i>×</i><span className="serif">3D Art</span><i>×</i><span>Code</span><i>∫</i>
              </Fragment>
            ))}
          </div>
        </div>

        {/* ─── ABOUT ─── */}
        <section className="section about" id="about">
          <SecHead n="01" title="About / Vertex" />
          <div className="about__grid">
            <div className="about__text">
              <h2 className="about__lead" data-words>
                {words(<>Where craft meets technical precision. I write the <em>math</em> that shapes the <em>art</em>, and the <em>code</em> that lets artists stay in flow.</>)}
              </h2>
              <div className="about__body">
                <p className="reveal-up">
                  I&apos;m a CG &amp; Technical Artist with 2+ years building game-ready asset pipelines. My foundation in
                  Multimedia Technology from the University of Sri Jayewardenepura pairs academic rigour with production
                  experience.
                </p>
                <p className="reveal-up">
                  My work sits where art meets engineering: procedural Houdini tools that save days of manual work, HLSL
                  shaders tuned for real-time engines, and Maya Python utilities. I care about scalable, well-documented
                  pipelines that outlive the person who built them.
                </p>
              </div>
              <dl className="stats">
                {[["studios", 3], ["projects", 8], ["languages", 5]].map(([k, v]) => (
                  <div key={k}><dt className="mono">{k}</dt><dd><span data-count={v}>0</span></dd></div>
                ))}
                <div><dt className="mono">years</dt><dd><span data-count="2">0</span><sup>+</sup></dd></div>
              </dl>
            </div>

            <figure className="avatar" id="avatar">
              <div className="avatar__box">
                <span className="bb bb--tl" /><span className="bb bb--tr" /><span className="bb bb--bl" /><span className="bb bb--br" />
                <img src="/avatar-poster.webp" data-src="/avatar.webp" alt="Stylised 3D avatar of Chandika waving" width={560} height={749} loading="lazy" />
                <svg className="gizmo" viewBox="0 0 100 100" aria-hidden="true">
                  <line x1="20" y1="80" x2="70" y2="80" className="gx" /><polygon points="70,76 78,80 70,84" className="gxf" />
                  <line x1="20" y1="80" x2="20" y2="30" className="gy" /><polygon points="16,30 20,22 24,30" className="gyf" />
                  <line x1="20" y1="80" x2="48" y2="56" className="gz" /><circle cx="50" cy="54" r="3.5" className="gzf" />
                  <circle cx="20" cy="80" r="3" fill="#fff" />
                </svg>
              </div>
              <figcaption className="mono">
                <span>chandika_rig.fbx</span>
                <span>76 fr · 24 fps · waving</span>
              </figcaption>
            </figure>
          </div>

          <div className="triad">
            <article className="triad__card" data-tilt>
              <header className="mono"><span>A</span><span>∂ / Mathematics</span></header>
              <svg className="triad__viz" id="viz-math" viewBox="0 0 200 120" aria-hidden="true"><path /></svg>
              <h3>Noise, vectors &amp; transforms</h3>
              <p>Fields, falloffs and fractals: the invisible rules that make a surface feel natural.</p>
            </article>
            <article className="triad__card" data-tilt>
              <header className="mono"><span>B</span><span>◐ / 3D Art</span></header>
              <div className="triad__viz triad__orb" aria-hidden="true"><i /></div>
              <h3>Form, light &amp; colour</h3>
              <p>Modelling, texturing, rigging and VFX, made to production spec and shipped in-engine.</p>
            </article>
            <article className="triad__card" data-tilt>
              <header className="mono"><span>C</span><span>{"{ }"} / Code</span></header>
              <pre className="triad__viz triad__code mono" id="viz-code" aria-hidden="true" />
              <h3>Tools, shaders &amp; pipelines</h3>
              <p>Python, VEX, HLSL and C#, used to automate the repetitive work and protect the creative work.</p>
            </article>
          </div>
        </section>

        {/* ─── SHOWREEL ─── */}
        <section className="reel" id="reel">
          <SecHead n="02" title="Showreel / Rasterise" pad />
          <div className="reel__stage">
            <h2 className="reel__title" aria-hidden="true"><span>Show</span><span className="serif">reel</span></h2>
            <Reel />
          </div>
        </section>

        {/* ─── EXPERIENCE / NODE GRAPH ─── */}
        <section className="section pipeline" id="pipeline">
          <SecHead n="03" title="Experience / Node Graph" />
          <div className="sec-intro">
            <h2 className="big" data-split-words>{words(<>Each role a node. <em>Every node feeds the next.</em></>)}</h2>
            <p className="mono dim">/obj/career/pipeline · cook: {experience.length} nodes · output → present</p>
          </div>
          <div className="graph" id="graph">
            <svg className="graph__wires" id="wires" aria-hidden="true" />
            {experience.map((x, i) => (
              <article className={`node ${x.current ? "node--current" : ""}`} key={x.node}>
                <span className="port port--in" />
                <header className="node__head">
                  <span className="node__kind">{x.kind}</span>
                  <span className="node__name">{x.node}{i + 1}</span>
                  <span className="node__flag"><i /><i /><i /></span>
                </header>
                <div className="node__body">
                  <div className="node__period">
                    {x.period}
                    {x.current && <span className="node__live">cooking</span>}
                  </div>
                  <h3 className="node__role">{x.role}</h3>
                  <p className="node__co">{x.company}</p>
                  <ul className="node__list">
                    {x.points.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
                <span className="port port--out" />
              </article>
            ))}
            <div className="node node--out">
              <span className="port port--in" />
              <a href="#contact" data-cursor="Hire">
                <span className="node__kind mono">OUT</span>
                <span>next_studio — <em>yours?</em></span>
              </a>
            </div>
          </div>
        </section>

        {/* ─── SELECTED WORKS ─── */}
        <section className="section works" id="works">
          <SecHead n="04" title="Selected Works / Composite" />
          <Works />
        </section>

        {/* ─── PROJECTS ─── */}
        <section className="section projects" id="projects">
          <SecHead n="05" title="Projects / Index" />
          <div className="sec-intro">
            <h2 className="big" data-split-words>{words(<>Shipped, played <em>&amp; screened.</em></>)}</h2>
          </div>
          <ol className="plist">
            {projects.map((p, i) => {
              const Row = p.url ? "a" : "div";
              return (
                <li className={`prow ${p.url ? "" : "prow--nolink"}`} data-i={i} key={p.title}>
                  <Row {...(p.url ? { href: p.url, ...ext } : {})}>
                    <span className="prow__i">{pad(i + 1)}</span>
                    <span className="prow__t">{p.title}</span>
                    <span className="prow__o">{p.org}</span>
                    <span className="prow__stack">{p.stack}</span>
                    <span className="prow__arr">{arrow}</span>
                  </Row>
                </li>
              );
            })}
          </ol>
          <div className="ppreview" id="ppreview" aria-hidden="true">
            <canvas width={420} height={300} />
            <img alt="" />
            <span className="mono" />
          </div>
        </section>

        {/* ─── WRITING ─── */}
        <section className="section writing" id="writing">
          <SecHead n="06" title="Writing / Debug Log" />
          <div className="writing__grid">
            {articles.map((a, i) => (
              <a key={a.url} className="article" href={a.url} {...ext} data-cursor="Read">
                <div className="article__top">
                  <span className="err">log_{pad(i + 1, 3)} · fixed</span>
                  <span>Medium</span>
                </div>
                <h3>{a.title}</h3>
                <p>{a.blurb}</p>
                <div className="article__foot">
                  <div className="work__tags">
                    {a.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                  </div>
                  <span className="article__read">Read <b>→</b></span>
                </div>
              </a>
            ))}
          </div>
          <a className="pill magnetic writing__all" href={links.medium} {...ext}>
            <span>All articles on Medium</span>
            <b>↗</b>
          </a>
        </section>

        {/* ─── SKILLS ─── */}
        <section className="section skills" id="skills">
          <SecHead n="07" title="Expertise / Toolchain" />
          <div className="skills__grid">
            {skills.map((s) => (
              <div className="sk" key={s.group}>
                <div className="sk__head">
                  <h3>{s.group}</h3>
                  <span className="sk__glyph">{s.glyph}</span>
                </div>
                <ul>
                  {s.items.map((it, i) => (
                    <li data-i={pad(i + 1)} data-scramble key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── EDUCATION ─── */}
        <section className="section edu" id="education">
          <SecHead n="08" title="Education / Training Data" />
          <ul className="edu__list">
            {education.map((e) => (
              <li className="edu__item" key={e.title}>
                <span className="edu__years">{e.years}</span>
                <span className="edu__title">{e.title}</span>
                <span className="edu__school">
                  {e.school}
                  {e.note && <em>{e.note}</em>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── CONTACT ─── */}
        <section className="contact" id="contact">
          <SecHead n="09" title="Contact / Output" pad />
          <div className="contact__inner">
            <p className="mono dim contact__kicker">
              Open to Technical Artist &amp; CG roles, pipeline consulting and tool-dev collaborations.
            </p>
            <h2 className="contact__title">
              <span data-split aria-label="Let's build"><Chars text="Let's build" /></span>
              <span className="serif" data-split aria-label="something great."><Chars text="something great." /></span>
            </h2>
            <a className="contact__mail" href={`mailto:${links.email}`} data-cursor="Write">
              <span className="contact__mail-text">
                {[...links.email].map((c, i) => (
                  <span key={i} style={{ "--i": i } as React.CSSProperties}>{c}</span>
                ))}
              </span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11" /></svg>
            </a>
            <div className="contact__row">
              <ul className="socials">
                {(["linkedin", "artstation", "github", "behance", "linktree"] as const).map((k) => (
                  <li key={k}>
                    <a className="magnetic" href={links[k]} {...ext} data-scramble>
                      {{ linkedin: "LinkedIn", artstation: "ArtStation", github: "GitHub", behance: "Behance", linktree: "Linktree" }[k]}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="contact__local mono">
                <span>Sri Lanka · <Clock /> local</span>
                <span className="dim">UTC+05:30</span>
              </div>
            </div>
          </div>
          <footer className="footer mono">
            <span>© {new Date().getFullYear()} Chandika Prabhashwara</span>
            <span className="dim">Hand-built · Next.js · Three.js · GLSL · GSAP</span>
            <a href="#top" className="footer__top" data-scramble>Back to top ↑</a>
          </footer>
        </section>
      </main>

      <SiteFX />
    </>
  );
}
