/* ═══════════════════════════════════════════════════════════════════
   SITE CONTENT: edit this file to update the portfolio.
   ═══════════════════════════════════════════════════════════════════ */

export const links = {
  email: "chandikaprabhashwara@outlook.com",
  linkedin: "https://www.linkedin.com/in/chandika-prabhashwara",
  artstation: "https://www.artstation.com/bizarrebakes9",
  github: "https://github.com/Chans-cellar",
  behance: "https://www.behance.net/chandikprabhas",
  linktree: "https://linktr.ee/chandika_prabhashwara",
  medium: "https://medium.com/@lwcprabhashwara",
  resume:
    "https://www.dropbox.com/scl/fi/fpfjs7xd294wbawmbp10f/Chandika_Prabhashwara_CV.pdf?rlkey=uq6tyzzx7an09v8kz8gnl68p3&e=1&st=m1dc66k7&dl=0",
  showreel: "https://player.vimeo.com/video/982368122?h=252cf56eb2",
} as const;

/* ───────────────────────────────────────────────────────────────────
   SELECTED WORKS: LinkedIn and ArtStation posts
   ───────────────────────────────────────────────────────────────────
   Add one object per post. The order here is the display order.

   LINKEDIN: paste the post URL. The embed is derived automatically.
     { type: "linkedin",
       url: "https://www.linkedin.com/posts/chandika-prabhashwara_xxx-activity-7212345678901234567-AbCd",
       title: "Optional caption" }
     (If a post won't render, open the post's "…" menu → Embed this post,
      copy the src="…" value and add it as  embed: "https://www.linkedin.com/embed/feed/update/urn:li:share:…")

   ARTSTATION: paste the artwork URL plus a cover image.
     { type: "artstation",
       url: "https://www.artstation.com/artwork/AbCdEf",
       image: "https://cdna.artstation.com/p/assets/images/images/…/large/….jpg",
       title: "Stylised Tavern — Houdini + UE5",
       tags: ["Houdini", "Unreal"] }
     (Right-click the main artwork image → Copy image address to get `image`.
      If you have an ArtStation embed code, add  embed: "https://www.artstation.com/embed/123456"
      to show the live viewer instead of the image.)

   Optional on any item:  size: "tall"  for a taller card.
   ─────────────────────────────────────────────────────────────────── */
export type Work = {
  type: "linkedin" | "artstation";
  url?: string;
  embed?: string;
  image?: string;
  title?: string;
  tags?: string[];
  size?: "tall";
};

export const works: Work[] = [
  // { type: "artstation", url: "", image: "", title: "", tags: [] },
  // { type: "linkedin", url: "", title: "" },
];

/* ─────────────────────────────────────────────────────────────────── */

export type Job = {
  period: string;
  role: string;
  company: string;
  node: string;
  kind: string;
  current?: boolean;
  points: string[];
};

export const experience: Job[] = [
  {
    period: "Jul 2023 — Jan 2024",
    role: "Trainee Technical Artist",
    company: "Behaviol",
    node: "maya_unity_bridge",
    kind: "SOP",
    points: [
      "Worked in a Maya → Unity production pipeline from day one",
      "Exported and integrated rigs, materials and assets into Unity",
      "Integrated animations into live gameplay systems",
      "Created in-game cutscenes with Unity Timeline",
      "Wrote procedural shaders for real-time rendering",
      "Built workflow tools that cut repetitive manual work for Maya artists",
    ],
  },
  {
    period: "Sep 2024 — Feb 2025",
    role: "Associate 3D Artist",
    company: "Hologo World",
    node: "asset_forge",
    kind: "VOP",
    points: [
      "Modelled low-poly props and vegetation to project specifications",
      "Generated terrain heightmaps in Gaea for landscape workflows",
      "Created production textures through UV unwrapping and baking",
      "Developed rigging systems and animations for dynamic assets",
      "Designed real-time VFX with Unity Particle System and Embergen spritesheets",
      "Authored procedural shaders and integrated optimised assets into Unity",
    ],
  },
  {
    period: "May 2025 — Present",
    role: "Technical Artist",
    company: "VR Archives Studio",
    node: "metahuman_pipeline",
    kind: "HDA",
    current: true,
    points: [
      "Developed tools to automate repetitive, error-prone tasks in the MetaHuman character pipeline",
      "Designed and tested technical solutions for pipeline bottlenecks and performance limits",
      "Built procedural Houdini tools for asset preparation, modification and iteration",
      "Established pipeline standards and best practices for multi-artist collaboration",
      "Bridged art and technology to keep workflows scalable and production-ready",
    ],
  },
];

/* `image` is optional: without it a procedural thumbnail is generated. */
export type Project = { title: string; org: string; stack: string; url: string; image?: string };

export const projects: Project[] = [
  { title: "Galle VR", org: "VR Archives Studio", stack: "Unreal · MetaHuman", url: "https://www.echoesofgalle.com/" },
  { title: "Meta 11", org: "Behaviol", stack: "Maya · Unity Pipeline", url: "https://meta11.com/" },
  { title: "Hologo Web AR", org: "Hologo", stack: "Blender · Unity", url: "https://app.hologo.world/" },
  { title: "Racket-Rumble", org: "Personal Project", stack: "Unity · C#", url: "https://github.com/Chans-cellar/Racket-Rumble" },
  { title: "Tower-Tangle", org: "Personal Project", stack: "Three.js", url: "https://tower-tangle.web.app/" },
  { title: "Snake Prototype", org: "Commissioned", stack: "Unreal Blueprint", url: "" },
  { title: "ADDICTION", org: "Short Film · BICT — USJ", stack: "Direction · Lighting", url: "" },
  { title: "Fallen From", org: "Short Film · Freelance", stack: "Blender · CGI", url: "" },
];

export const articles = [
  {
    title: "How to Fix Invisible TextMesh Pro Text on Transparent Materials in Unity",
    tags: ["Unity", "Shader"],
    blurb:
      "A render-queue conflict hides TMP text behind transparent surfaces. Here's why it happens and the two-line shader fix.",
    url: "https://medium.com/@lwcprabhashwara/how-to-fix-invisible-textmesh-pro-text-on-transparent-materials-in-unity-3be90fcb360d",
  },
  {
    title: "Fixing the “Cannot find procedure ‘asLabel’” Error in Advanced Skeleton (Maya)",
    tags: ["Maya", "Rigging"],
    blurb:
      "A step-by-step look at why this error appears in Advanced Skeleton rigs and exactly how to resolve it.",
    url: "https://medium.com/@lwcprabhashwara/fixing-the-cannot-find-procedure-aslabel-error-in-advanced-skeleton-maya-feb165a9ba4f",
  },
];

export const skills = [
  {
    group: "Software & Tools",
    glyph: "◐",
    items: ["Houdini", "Maya", "Blender", "Unreal Engine", "Unity", "Substance Painter", "Gaea", "Embergen", "Photoshop", "Qt Designer"],
  },
  { group: "Code & Scripting", glyph: "{ }", items: ["Python", "VEX", "HLSL", "C#", "AR Foundation"] },
  {
    group: "Technical & Artistic",
    glyph: "∂",
    items: ["Tech Art", "Shader Programming", "Asset Integration Pipelines", "Procedural Modelling", "Polygonal Modelling", "Texturing", "Animation", "Game Development", "OOP"],
  },
  { group: "Strengths", glyph: "∞", items: ["Proceduralism", "Analytical Mindset", "Problem Solving", "Creativity", "Teamwork", "Communication"] },
];

export const education = [
  { years: "2020 — 2024", title: "Bachelor of ICT (Hons) — Multimedia Technology", school: "University of Sri Jayewardenepura", note: "Second Class Honours · GPA 3.29" },
  { years: "2018 — 2019", title: "Advanced Diploma in Advertising & Multimedia", school: "National Institute of Business Management", note: "Distinction Pass" },
  { years: "Cert.", title: "3D Application & Game Development with Three.js", school: "Alison", note: "" },
  { years: "Cert.", title: "Building Games using JavaScript", school: "Great Learning", note: "" },
  { years: "Cert.", title: "Certificate in Graphic Designing", school: "NYSCO Computer Training Center — Badulla", note: "" },
];

/** LinkedIn post URL → embed URL (activity / share / ugcPost ids). */
export function linkedinEmbed(item: Work): string {
  if (item.embed) return item.embed;
  const m = String(item.url || "").match(/(activity|share|ugcPost)[-:](\d{10,})/i);
  if (!m) return "";
  const kind = m[1].toLowerCase() === "ugcpost" ? "ugcPost" : m[1].toLowerCase();
  return `https://www.linkedin.com/embed/feed/update/urn:li:${kind}:${m[2]}`;
}
