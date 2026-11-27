import { ImageResponse } from "next/og";

/* 1200×630 share card for LinkedIn, X, Slack, WhatsApp etc.
   Also used as the Twitter image (see metadata in layout.tsx). */

export const alt = "Chandika Prabhashwara: Technical Artist & CG Programmer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 72, background: "#0a0a0b", color: "#ede8e0",
          backgroundImage: "radial-gradient(circle at 82% 38%, rgba(255,107,31,.35), transparent 45%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 2, color: "#ff6b1f", textTransform: "uppercase" }}>
          Technical Artist · CG Artist · Graphics Developer
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 128, fontWeight: 700, letterSpacing: -5, lineHeight: 0.95 }}>
          <span>Chandika</span>
          <span style={{ color: "#ff6b1f", fontStyle: "italic", fontWeight: 400 }}>Prabhashwara</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#b3ada4" }}>
          Procedural tools · Real-time shaders · Game-ready pipelines
        </div>
      </div>
    ),
    { ...size },
  );
}
