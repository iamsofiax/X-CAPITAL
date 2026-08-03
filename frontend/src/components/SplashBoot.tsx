"use client";

import { useEffect } from "react";

/**
 * SplashBoot — self-healing dismissal for the institutional boot overlay.
 *
 * Why this exists: the splash is server-rendered in root layout and dismissed
 * by an inline script. If React hydration fails or fast-refresh replaces the
 * DOM, the original inline script's captured node reference goes stale and the
 * freshly-rendered splash never leaves — the site appears frozen on the boot
 * screen. This component re-queries #xc-splash by ID every pass, so it works
 * no matter how many times React re-renders the tree.
 */
export default function SplashBoot() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const startTime = Date.now();

    const dismiss = () => {
      const splash = document.getElementById("xc-splash");
      if (!splash) return;
      splash.classList.add("xc-splash-exit");
      window.setTimeout(() => {
        document.getElementById("xc-splash")?.remove();
      }, 600);
    };

    // Fast path — dismiss shortly after hydration settles.
    const fastTimer = window.setTimeout(dismiss, 350);

    // Hard-kill path — if the splash is STILL in the DOM 4.5s after mount,
    // something interfered (stale reference, failed hydration). Remove it
    // unconditionally so the main site is never blocked.
    const hardKill = window.setInterval(() => {
      if (Date.now() - startTime < 4500) return;
      const splash = document.getElementById("xc-splash");
      if (splash) {
        splash.remove();
      } else {
        window.clearInterval(hardKill);
      }
    }, 400);

    return () => {
      window.clearTimeout(fastTimer);
      window.clearInterval(hardKill);
    };
  }, []);

  return null;
}
