/* Canonical site facts shared by metadata, sitemap, robots and JSON-LD.
   Set NEXT_PUBLIC_SITE_URL when the site moves to a custom domain. */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://chandika-prabhashwara.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "Chandika Prabhashwara";
export const SITE_TITLE = "Chandika Prabhashwara | Technical Artist & CG Programmer";
export const SITE_DESCRIPTION =
  "Chandika Prabhashwara is a Technical Artist and CG programmer building procedural Houdini tools, real-time shaders and game-ready pipelines where mathematics, 3D art and code meet.";
