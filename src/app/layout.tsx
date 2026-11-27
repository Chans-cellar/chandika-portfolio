import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { links } from "@/lib/content";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  keywords: [
    "Chandika Prabhashwara", "Technical Artist", "CG Programmer", "Graphics Developer", "CG Artist",
    "Houdini", "VEX", "Procedural Modelling", "Shader Programming", "HLSL", "GLSL", "Unity", "Unreal Engine",
    "Maya Python", "Game Development", "Real-time Rendering", "Sri Lanka", "Portfolio",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "profile",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: SITE_TITLE,
    description: "Procedural tools, real-time shaders and game-ready pipelines. Where mathematics, 3D art and code meet.",
    firstName: "Chandika",
    lastName: "Prabhashwara",
    // og:image comes from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: "Procedural tools, real-time shaders and game-ready pipelines. Where mathematics, 3D art and code meet.",
  },
  // Search Console / Bing ownership tokens, set in the hosting env (only rendered when present)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
  icons: { icon: "/logo.svg" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_NAME,
      givenName: "Chandika",
      familyName: "Prabhashwara",
      jobTitle: "Technical Artist",
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      image: `${SITE_URL}/avatar-poster.webp`,
      address: { "@type": "PostalAddress", addressCountry: "LK" },
      knowsAbout: [
        "Technical Art", "Computer Graphics", "Shader Programming", "Houdini", "Procedural Modelling",
        "Real-time Rendering", "Unity", "Unreal Engine", "Maya", "Python", "Game Development",
      ],
      sameAs: [links.linkedin, links.artstation, links.github, links.behance, links.medium, links.linktree],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export const viewport: Viewport = { themeColor: "#0a0a0b", width: "device-width", initialScale: 1 };

// Runs before first paint: enables the JS-only reveal states, and if the app
// bundle never boots (blocked script, old browser) un-hides everything after 7s.
const PRE_PAINT = `document.documentElement.classList.add('js');setTimeout(function(){if(!window.__booted)document.documentElement.classList.add('failsafe')},7000);`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: PRE_PAINT }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          // structured data so search engines can build a knowledge panel for the person
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
