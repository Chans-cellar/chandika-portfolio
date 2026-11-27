/* ═══════════════════════════════════════════════════════════════════
   KEYSTATIC CMS: the editor at /keystatic edits the JSON in /content.
   - `npm run dev`  → edits are written straight to your local files.
   - deployed site  → edits are committed to GitHub, and Vercel redeploys.
   Lists can be reordered by dragging; the order is the display order.
   ═══════════════════════════════════════════════════════════════════ */

import { config, fields, singleton } from "@keystatic/core";

const storage =
  process.env.NODE_ENV === "development"
    ? ({ kind: "local" } as const)
    : ({ kind: "github", repo: { owner: "Chans-cellar", name: "chandika-portfolio" } } as const);

const json = { data: "json" } as const;

export default config({
  storage,
  ui: {
    brand: { name: "Chandika · Portfolio" },
    navigation: {
      Showcase: ["works", "projects", "articles"],
      Profile: ["experience", "skills", "education", "links"],
    },
  },
  singletons: {
    /* ─── Selected works: LinkedIn + ArtStation posts ─── */
    works: singleton({
      label: "Selected works",
      path: "content/works",
      format: json,
      schema: {
        items: fields.array(
          fields.object({
            type: fields.select({
              label: "Source",
              options: [
                { label: "ArtStation", value: "artstation" },
                { label: "LinkedIn", value: "linkedin" },
              ],
              defaultValue: "artstation",
            }),
            title: fields.text({ label: "Title / caption" }),
            url: fields.text({
              label: "Post URL",
              description:
                "ArtStation artwork URL, or LinkedIn post URL (the LinkedIn embed is generated from it automatically).",
            }),
            image: fields.image({
              label: "Cover image (upload)",
              description: "ArtStation only. Upload a cover, or use the image URL field below instead.",
              directory: "public/images/works",
              publicPath: "/images/works/",
            }),
            imageUrl: fields.text({
              label: "Cover image URL",
              description: "ArtStation only. Right-click the artwork image → Copy image address.",
            }),
            embed: fields.text({
              label: "Embed URL (optional)",
              description:
                "ArtStation: https://www.artstation.com/embed/123456 shows the live viewer. LinkedIn: only needed if a post won't render. Use “…” → Embed this post and copy the src value.",
            }),
            tags: fields.array(fields.text({ label: "Tag" }), {
              label: "Tags",
              itemLabel: (p) => p.value,
            }),
            tall: fields.checkbox({ label: "Tall card", description: "For vertical renders and breakdown sheets." }),
          }),
          {
            label: "Works",
            itemLabel: (p) => `${p.fields.type.value === "linkedin" ? "LinkedIn" : "ArtStation"} · ${p.fields.title.value || p.fields.url.value || "Untitled"}`,
          },
        ),
      },
    }),

    /* ─── Projects ─── */
    projects: singleton({
      label: "Projects",
      path: "content/projects",
      format: json,
      schema: {
        items: fields.array(
          fields.object({
            title: fields.text({ label: "Title", validation: { isRequired: true } }),
            org: fields.text({ label: "Organisation / context" }),
            stack: fields.text({ label: "Stack", description: "e.g. Unreal · MetaHuman" }),
            url: fields.text({ label: "Link (optional)" }),
            image: fields.image({
              label: "Thumbnail (optional)",
              description: "Without one, a procedural thumbnail is generated.",
              directory: "public/images/projects",
              publicPath: "/images/projects/",
            }),
          }),
          { label: "Projects", itemLabel: (p) => p.fields.title.value || "Untitled" },
        ),
      },
    }),

    /* ─── Articles ─── */
    articles: singleton({
      label: "Articles",
      path: "content/articles",
      format: json,
      schema: {
        items: fields.array(
          fields.object({
            title: fields.text({ label: "Title", validation: { isRequired: true } }),
            url: fields.text({ label: "Article URL", description: "e.g. the Medium link" }),
            blurb: fields.text({ label: "Short summary", multiline: true }),
            tags: fields.array(fields.text({ label: "Tag" }), { label: "Tags", itemLabel: (p) => p.value }),
          }),
          { label: "Articles", itemLabel: (p) => p.fields.title.value || "Untitled" },
        ),
      },
    }),

    /* ─── Experience ─── */
    experience: singleton({
      label: "Experience",
      path: "content/experience",
      format: json,
      schema: {
        items: fields.array(
          fields.object({
            period: fields.text({ label: "Period", description: "e.g. May 2025 — Present" }),
            role: fields.text({ label: "Role" }),
            company: fields.text({ label: "Company" }),
            current: fields.checkbox({ label: "Current role" }),
            node: fields.text({ label: "Node name", description: "Pipeline-graph label, e.g. metahuman_pipeline" }),
            kind: fields.text({ label: "Node type", description: "e.g. SOP, VOP, HDA" }),
            points: fields.array(fields.text({ label: "Point", multiline: true }), {
              label: "Highlights",
              itemLabel: (p) => p.value,
            }),
          }),
          { label: "Jobs", itemLabel: (p) => `${p.fields.role.value} · ${p.fields.company.value}` },
        ),
      },
    }),

    /* ─── Skills ─── */
    skills: singleton({
      label: "Skills",
      path: "content/skills",
      format: json,
      schema: {
        items: fields.array(
          fields.object({
            group: fields.text({ label: "Group" }),
            glyph: fields.text({ label: "Glyph", description: "A short symbol, e.g. ◐ or { }" }),
            items: fields.array(fields.text({ label: "Skill" }), { label: "Skills", itemLabel: (p) => p.value }),
          }),
          { label: "Skill groups", itemLabel: (p) => p.fields.group.value || "Untitled" },
        ),
      },
    }),

    /* ─── Education ─── */
    education: singleton({
      label: "Education",
      path: "content/education",
      format: json,
      schema: {
        items: fields.array(
          fields.object({
            years: fields.text({ label: "Years", description: "e.g. 2020 — 2024, or Cert." }),
            title: fields.text({ label: "Title" }),
            school: fields.text({ label: "School / provider" }),
            note: fields.text({ label: "Note (optional)" }),
          }),
          { label: "Entries", itemLabel: (p) => p.fields.title.value || "Untitled" },
        ),
      },
    }),

    /* ─── Links ─── */
    links: singleton({
      label: "Links & contact",
      path: "content/links",
      format: json,
      schema: {
        email: fields.text({ label: "Email" }),
        linkedin: fields.text({ label: "LinkedIn" }),
        artstation: fields.text({ label: "ArtStation" }),
        github: fields.text({ label: "GitHub" }),
        behance: fields.text({ label: "Behance" }),
        linktree: fields.text({ label: "Linktree" }),
        medium: fields.text({ label: "Medium" }),
        resume: fields.text({ label: "Résumé / CV link" }),
        showreel: fields.text({ label: "Showreel embed URL", description: "Vimeo player URL" }),
      },
    }),
  },
});
