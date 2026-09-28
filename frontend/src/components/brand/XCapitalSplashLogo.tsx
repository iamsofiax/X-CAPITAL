"use client";

/** Loading mark. The earlier X: a white leg and a green leg. The desk seal stays on the site. */
export default function XCapitalSplashLogo() {
  return (
    <div className="xc-splash-icon flex items-center justify-center" aria-hidden>
      <svg viewBox="0 0 24 24" width={56} height={56} fill="none">
        <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2.75" strokeLinecap="round" />
        <line
          x1="6"
          y1="18"
          x2="18"
          y2="6"
          stroke="#22c55e"
          strokeWidth="2.75"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(34,197,94,0.85)) drop-shadow(0 0 10px rgba(34,197,94,0.35))" }}
        />
      </svg>
    </div>
  );
}
