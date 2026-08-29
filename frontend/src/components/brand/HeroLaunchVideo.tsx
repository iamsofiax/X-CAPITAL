"use client";

import { useEffect, useRef } from "react";

/**
 * Full-bleed launch loop. Stays playing across tab focus, canplay, and loop.
 */
export default function HeroLaunchVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const play = () => {
      if (!el.paused && !el.ended) return;
      el.muted = true;
      void el.play().catch(() => undefined);
    };
    play();
    el.addEventListener("canplay", play);
    el.addEventListener("ended", play);
    const onVis = () => {
      if (document.visibilityState === "visible") play();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", play);
    return () => {
      el.removeEventListener("canplay", play);
      el.removeEventListener("ended", play);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", play);
    };
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover opacity-[0.9] pointer-events-none animate-hero-zoom"
      src="/videos/hero-hd.mp4"
    />
  );
}
