"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useWebGLSupport — probe whether the browser can create a WebGL context
 * BEFORE any three.js <Canvas> mounts.
 *
 * Why: mounting a Canvas when WebGL is blocked (GPU blacklist, disabled
 * hardware acceleration, remote desktop, crashed GPU process) throws
 * "Error creating WebGL context" and trips the page-level error boundary —
 * the whole page turns into "Something went wrong" and the site appears
 * blank. Every three.js surface uses this hook and renders a static
 * CSS fallback while WebGL is unavailable.
 *
 * Returns { webglReady, webglFailed, markWebglFailed }: mount the Canvas
 * only when webglReady && !webglFailed; render the fallback when
 * webglFailed; call markWebglFailed() from a `webglcontextlost` handler.
 */
export function useWebGLSupport(): {
  webglReady: boolean;
  webglFailed: boolean;
  markWebglFailed: () => void;
} {
  const [webglReady, setWebglReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    // Detect WebGL support up-front (Chrome/Edge sometimes block it under
    // memory pressure or GPU-process crashes).
    let supported = false;
    try {
      const probe = document.createElement("canvas");
      supported = !!(
        probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl")
      );
    } catch {
      supported = false;
    }
    if (!supported) {
      setWebglFailed(true);
      return;
    }
    setWebglReady(true);
  }, []);

  const markWebglFailed = useCallback(() => setWebglFailed(true), []);

  return { webglReady, webglFailed, markWebglFailed };
}
