"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { linkedinEmbed, links, works, type Work } from "@/lib/content";
import { pad } from "@/lib/split";

type Filter = "all" | "artstation" | "linkedin";

const SLOTS: { type: Work["type"]; text: React.ReactNode }[] = [
  { type: "artstation", text: <>Add an artwork URL and its cover image in <code>src/lib/content.ts → works</code>.</> },
  { type: "linkedin", text: <>Paste a LinkedIn post URL. The embed is generated for you.</> },
  { type: "artstation", text: <>Use <code>size: &quot;tall&quot;</code> for vertical renders and breakdown sheets.</> },
  { type: "linkedin", text: <>Posts load lazily as they scroll into view, so the page stays fast.</> },
  { type: "artstation", text: <>Add an <code>embed</code> URL to show the interactive viewer.</> },
  { type: "linkedin", text: <>Items show in the order you list them.</> },
];

function LazyFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      {!loaded && <div className="work__load">loading…</div>}
      <iframe
        ref={ref}
        src={visible ? src : undefined}
        title={title}
        loading="lazy"
        allowFullScreen
        onLoad={() => visible && setLoaded(true)}
      />
    </>
  );
}

function WorkCard({ w, i }: { w: Work; i: number }) {
  const type = w.type === "linkedin" ? "linkedin" : "artstation";
  const label = type === "linkedin" ? "LinkedIn post" : "ArtStation";
  const src = type === "linkedin" ? linkedinEmbed(w) : w.embed || "";
  return (
    <article className={`work work--${type} ${w.size === "tall" ? "work--tall" : ""}`} data-type={type}>
      <div className="work__bar">
        <span className="work__src">
          <i />
          {label} · {pad(i + 1)}
        </span>
        {w.url && (
          <a href={w.url} target="_blank" rel="noopener noreferrer">
            open ↗
          </a>
        )}
      </div>
      <div className="work__media">
        {src ? (
          <LazyFrame src={src} title={w.title || label} />
        ) : w.image ? (
          <a href={w.url} target="_blank" rel="noopener noreferrer" data-cursor="View">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote ArtStation CDN, any host */}
            <img src={w.image} alt={w.title || "ArtStation artwork"} loading="lazy" />
          </a>
        ) : (
          <div className="work__load">
            no preview, add <code>image</code> or <code>embed</code>
          </div>
        )}
      </div>
      {(w.title || w.tags?.length) && (
        <div className="work__cap">
          {w.title && <h3>{w.title}</h3>}
          {!!w.tags?.length && (
            <div className="work__tags">
              {w.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function useColumns() {
  const [n, setN] = useState(3);
  useEffect(() => {
    const calc = () => setN(innerWidth < 760 ? 1 : innerWidth < 1100 ? 2 : 3);
    calc();
    addEventListener("resize", calc);
    return () => removeEventListener("resize", calc);
  }, []);
  return n;
}

export default function Works() {
  const valid = useMemo(() => works.filter((w) => w && (w.url || w.embed || w.image)), []);
  const isEmpty = valid.length === 0;
  const items = useMemo(
    () =>
      isEmpty
        ? SLOTS.map((s, i) => ({ type: s.type, key: `slot${i}`, node: <Slot key={`slot${i}`} i={i} slot={s} /> }))
        : valid.map((w, i) => ({ type: w.type, key: `w${i}`, node: <WorkCard key={`w${i}`} w={w} i={i} /> })),
    [isEmpty, valid],
  );
  const counts = {
    all: items.length,
    artstation: items.filter((x) => x.type === "artstation").length,
    linkedin: items.filter((x) => x.type === "linkedin").length,
  };

  const [filter, setFilter] = useState<Filter>("all");
  const ncols = useColumns();
  const grid = useRef<HTMLDivElement>(null);

  // Round-robin masonry keeps reading order left→right, top→bottom.
  const shown = items.filter((x) => filter === "all" || x.type === filter);
  const cols = Array.from({ length: ncols }, (_, c) => shown.filter((_, i) => i % ncols === c));

  const choose = (f: Filter) => {
    if (f === filter) return;
    const els = grid.current?.querySelectorAll(".work, .slot");
    if (!els?.length) return setFilter(f);
    gsap.to(els, {
      opacity: 0, y: 16, duration: 0.25, stagger: 0.02, ease: "power2.in",
      onComplete: () => setFilter(f),
    });
  };

  // animate the newly filtered set in
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const els = grid.current?.querySelectorAll(".work, .slot");
    if (els?.length) gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "expo.out" });
    ScrollTrigger.refresh();
  }, [filter]);

  return (
    <>
      <div className="works__head">
        <h2 className="big" data-split-words>
          <span className="w"><span>Selected</span></span> <em><span className="w"><span>works</span></span></em>
        </h2>
        <div className="filters" role="tablist" aria-label="Filter works">
          {(["all", "artstation", "linkedin"] as const).map((f) => (
            <button
              key={f}
              className={`filter ${filter === f ? "is-active" : ""}`}
              role="tab"
              aria-selected={filter === f}
              onClick={() => choose(f)}
            >
              {f === "all" ? "All" : f === "artstation" ? "ArtStation" : "LinkedIn"} <sup>{counts[f]}</sup>
            </button>
          ))}
        </div>
      </div>
      <div className="works__grid" ref={grid}>
        {cols.map((col, c) => (
          <div className="works__col" key={c}>
            {col.map((x) => x.node)}
          </div>
        ))}
      </div>
      <div className="works__cta">
        <a className="pill magnetic" href={links.artstation} target="_blank" rel="noopener noreferrer">
          <span>Full gallery on ArtStation</span>
          <b>↗</b>
        </a>
        <a className="pill magnetic" href={links.linkedin} target="_blank" rel="noopener noreferrer">
          <span>Updates on LinkedIn</span>
          <b>↗</b>
        </a>
      </div>
    </>
  );
}

function Slot({ i, slot }: { i: number; slot: (typeof SLOTS)[number] }) {
  return (
    <div className="slot" data-type={slot.type}>
      <div className="slot__top">
        <span>slot_{pad(i + 1)}</span>
        <span>{slot.type === "artstation" ? "ArtStation" : "LinkedIn"}</span>
      </div>
      <p>{slot.text}</p>
    </div>
  );
}
