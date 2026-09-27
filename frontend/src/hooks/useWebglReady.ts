"use client";

import { useCallback, useEffect, useState } from "react";

export function useWebglReady() {
  const [webglReady, setWebglReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      const canvas = document.createElement("canvas");
      ok = !!(
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
      );
    } catch {
      ok = false;
    }
    if (!ok) {
      setWebglFailed(true);
      return;
    }
    setWebglReady(true);
  }, []);

  return {
    webglReady,
    webglFailed,
    markWebglFailed: useCallback(() => setWebglFailed(true), []),
  };
}
