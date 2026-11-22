"use client";

import { useState } from "react";
import { links } from "@/lib/content";

export default function Reel() {
  const [playing, setPlaying] = useState(false);
  const sep = links.showreel.includes("?") ? "&" : "?";
  const src = `${links.showreel}${sep}autoplay=1&title=0&byline=0&portrait=0&color=ff6b1f`;

  const play = () => {
    if (playing) return;
    setPlaying(true);
    document.getElementById("cursor")?.classList.remove("is-label");
  };

  return (
    <div className="reel__frame" id="reel-frame" data-cursor={playing ? undefined : "Play"} onClick={play}>
      <div className={`reel__poster ${playing ? "is-gone" : ""}`}>
        <span className="reel__corner mono">REC ● 2025</span>
        <span className="reel__corner reel__corner--r mono">1920×1080 · 24p</span>
        <button className="reel__play" aria-label="Play showreel">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <span className="reel__corner reel__corner--bl mono">click to render</span>
      </div>
      {playing && (
        <iframe src={src} title="Chandika Prabhashwara showreel" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      )}
    </div>
  );
}
