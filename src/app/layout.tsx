import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

//change this later after changing domain
const SITE = "https://chandika-prabhashwara.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Chandika Prabhashwara — Technical Artist & CG Programmer",
  description:
    "Chandika Prabhashwara: Technical Artist and CG artist building procedural Houdini tools, real-time shaders and game-ready pipelines where mathematics, 3D art and code meet.",
  openGraph: {
    title: "Chandika Prabhashwara — Technical Artist",
    description: "Procedural tools, real-time shaders and game-ready pipelines. Where mathematics, 3D art and code meet.",
    type: "website",
    url: SITE,
    images: ["/avatar-poster.webp"],
  },
  icons: { icon: "/logo.svg" },
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
      <body>{children}</body>
    </html>
  );
}
