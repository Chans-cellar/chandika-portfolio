# chandika-portfolio

Portfolio of Chandika Prabhashwara: Technical Artist & CG programmer.

**Stack:** Next.js 16 (App Router, TypeScript), Three.js with custom GLSL, GSAP + ScrollTrigger, Lenis smooth scroll.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Editing content

All content lives in **`src/lib/content.ts`**: links, experience, projects, articles, skills, education and **Selected Works**. The page is statically rendered from it at build time.

### Selected Works (LinkedIn + ArtStation)
Add entries to the `works` array. Full instructions are in the comment above it.

```ts
export const works: Work[] = [
  { type: "artstation", url: "https://www.artstation.com/artwork/AbCdEf",
    image: "https://cdna.artstation.com/p/assets/images/images/…/large/….jpg",
    title: "Procedural Rock Generator", tags: ["Houdini", "VEX"] },
  { type: "linkedin",
    url: "https://www.linkedin.com/posts/chandika-prabhashwara_…-activity-7212345678901234567-AbCd" },
];
```

While the array is empty, the section shows placeholder "slots".

### Project thumbnails
Add `image: "…"` to a project to show a real preview on hover. Projects without one get a procedurally generated thumbnail.

## Structure
- `src/app/page.tsx`: the whole page (server component)
- `src/app/layout.tsx`: fonts (`next/font`), metadata, pre-paint script
- `src/app/globals.css`: all styling (design tokens are at the top)
- `src/components/SiteFX.tsx`: client-side motion: smooth scroll, scroll choreography, cursor, loader, interactions
- `src/components/Works.tsx`: Selected Works grid with filters and lazy embeds
- `src/components/Reel.tsx`, `Clock.tsx`: small client islands
- `src/lib/scene.ts` + `shaders.ts`: the WebGL "specimen" with three render modes (math / mesh / shade)
- `public/`: avatar (animated WebP + poster) and logo
