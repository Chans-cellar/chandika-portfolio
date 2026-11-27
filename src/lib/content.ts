/* ═══════════════════════════════════════════════════════════════════
   SITE CONTENT
   The data lives in /content/*.json and is edited through the CMS at
   /keystatic (schema: keystatic.config.ts). This file only shapes it
   for the page, so components keep the same imports and types.
   ═══════════════════════════════════════════════════════════════════ */

import linksJson from "../../content/links.json";
import worksJson from "../../content/works.json";
import projectsJson from "../../content/projects.json";
import articlesJson from "../../content/articles.json";
import experienceJson from "../../content/experience.json";
import skillsJson from "../../content/skills.json";
import educationJson from "../../content/education.json";

/** Empty CMS text fields are stored as "" — treat them as absent. */
const opt = (s: string | null | undefined) => (s && s.trim() ? s.trim() : undefined);

export const links = linksJson as {
  email: string;
  linkedin: string;
  artstation: string;
  github: string;
  behance: string;
  linktree: string;
  medium: string;
  resume: string;
  showreel: string;
};

/* ─── Selected works: LinkedIn and ArtStation posts ─── */
export type Work = {
  type: "linkedin" | "artstation";
  url?: string;
  embed?: string;
  image?: string;
  title?: string;
  tags?: string[];
  size?: "tall";
};

type WorkEntry = {
  type: string;
  title?: string;
  url?: string;
  image?: string | null;
  imageUrl?: string;
  embed?: string;
  tags?: string[];
  tall?: boolean;
};

export const works: Work[] = (worksJson.items as WorkEntry[]).map((w) => ({
  type: w.type === "linkedin" ? "linkedin" : "artstation",
  url: opt(w.url),
  embed: opt(w.embed),
  image: opt(w.image) ?? opt(w.imageUrl),
  title: opt(w.title),
  tags: (w.tags ?? []).filter(Boolean),
  size: w.tall ? "tall" : undefined,
}));

/* ─── Experience ─── */
export type Job = {
  period: string;
  role: string;
  company: string;
  node: string;
  kind: string;
  current?: boolean;
  points: string[];
};

export const experience: Job[] = experienceJson.items.map((j) => ({ ...j, points: j.points.filter(Boolean) }));

/* ─── Projects: `image` is optional; without it a procedural thumbnail is generated. ─── */
export type Project = { title: string; org: string; stack: string; url: string; image?: string };

export const projects: Project[] = (projectsJson.items as (Omit<Project, "image"> & { image?: string | null })[]).map(
  (p) => ({ ...p, url: p.url ?? "", image: opt(p.image) }),
);

/* ─── Articles ─── */
export const articles: { title: string; tags: string[]; blurb: string; url: string }[] = articlesJson.items.map((a) => ({
  ...a,
  tags: a.tags.filter(Boolean),
}));

/* ─── Skills & education ─── */
export const skills: { group: string; glyph: string; items: string[] }[] = skillsJson.items;

export const education: { years: string; title: string; school: string; note: string }[] = educationJson.items;

/** LinkedIn post URL → embed URL (activity / share / ugcPost ids). */
export function linkedinEmbed(item: Work): string {
  if (item.embed) return item.embed;
  const m = String(item.url || "").match(/(activity|share|ugcPost)[-:](\d{10,})/i);
  if (!m) return "";
  const kind = m[1].toLowerCase() === "ugcpost" ? "ugcPost" : m[1].toLowerCase();
  return `https://www.linkedin.com/embed/feed/update/urn:li:${kind}:${m[2]}`;
}
