"use client";

import { XCapitalLogo } from "./XCapitalLogo";

/** Splash screen mark — client-only for root layout. */
export default function XCapitalSplashLogo() {
  return (
    <div className="xc-splash-icon flex items-center justify-center">
      <XCapitalLogo size={48} />
    </div>
  );
}
