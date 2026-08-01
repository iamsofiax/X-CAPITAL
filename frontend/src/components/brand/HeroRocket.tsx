"use client";

/**
 * HeroRocket — platform centerpiece, rendered as pure vector SVG.
 *
 * Why vector: SVG is resolution-independent, so it renders pixel-perfect at
 * 1080p, 4K, and 8K without shipping raster assets or blurry upscales.
 *
 * Layout contract (keeps words from overlapping on every device):
 *   - Desktop (≥1024px): rocket + flame on the right column, headline left.
 *   - Mobile (<1024px): a compact 220px constellation mark sits BELOW the
 *     headline so the two never collide.
 *
 * The rocket is a reusable viewBox (0 0 280 360) with a <defs> gradient
 * palette identical on every render — no runtime work, zero jank.
 */

interface HeroRocketProps {
  className?: string;
  /** SVG height in px. Width scales automatically via the viewBox ratio. */
  height?: number;
  mobile?: boolean;
}

const ROCKET_GRADIENTS = (
  <>
    <defs>
      <linearGradient id="rkt-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f5f5f5" />
        <stop offset="45%" stopColor="#9ca3af" />
        <stop offset="100%" stopColor="#3f3f46" />
      </linearGradient>
      <linearGradient id="rkt-nose" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#a1a1aa" />
      </linearGradient>
      <linearGradient id="rkt-flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="55%" stopColor="#10b981" />
        <stop offset="100%" stopColor="rgba(16,185,129,0)" />
      </linearGradient>
      <linearGradient id="rkt-flame-core" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="rgba(251,191,36,0)" />
      </linearGradient>
      <radialGradient id="rkt-window" cx="0.4" cy="0.35" r="0.9">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
        <stop offset="60%" stopColor="#022c22" />
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>
    </defs>
  </>
);

export default function HeroRocket({
  className,
  height = 360,
  mobile = false,
}: HeroRocketProps) {
  if (mobile) {
    // Compact constellation mark for mobile — headline stays on top,
    // this floats beneath with zero overlap risk.
    return (
      <svg
        width="220"
        height="120"
        viewBox="0 0 220 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
        style={{ filter: "drop-shadow(0 0 24px rgba(16,185,129,0.30))" }}
      >
        {ROCKET_GRADIENTS}
        <circle cx="32" cy="88" r="2" fill="#10b981" opacity="0.5" />
        <circle cx="190" cy="22" r="2" fill="#10b981" opacity="0.4" />
        <circle cx="205" cy="80" r="1.5" fill="#ffffff" opacity="0.25" />
        <circle cx="18" cy="30" r="1.5" fill="#ffffff" opacity="0.2" />
        <circle cx="150" cy="8" r="1.5" fill="#10b981" opacity="0.35" />
        <path d="M118 58 L112 76 L124 72 Z" fill="#52525b" />
        <path d="M142 58 L148 76 L136 72 Z" fill="#52525b" />
        <path d="M130 18 C136 30 140 44 140 58 C140 68 136 74 130 74 C124 74 120 68 120 58 C120 44 124 30 130 18 Z" fill="url(#rkt-body)" />
        <circle cx="130" cy="52" r="7" fill="url(#rkt-window)" stroke="#34d399" strokeWidth="1.5" />
        <ellipse cx="130" cy="78" rx="7" ry="2.5" fill="#27272a" />
        <path d="M128 79 Q130 96 132 79 Z" fill="url(#rkt-flame)" />
        <path d="M129 79 Q130 89 131 79 Z" fill="url(#rkt-flame-core)" />
      </svg>
    );
  }

  // Full-size desktop rocket — 280×360 viewBox, scale-aware, 4K crisp.
  return (
    <svg
      height={height}
      viewBox="0 0 280 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      style={{ filter: "drop-shadow(0 0 40px rgba(16,185,129,0.35))" }}
    >
      {ROCKET_GRADIENTS}

      {/* Exhaust plume — layered, reads as engine burn */}
      <g opacity="0.9">
        <ellipse cx="140" cy="332" rx="26" ry="10" fill="#18181b" />
        <path d="M126 336 Q140 372 154 336 Z" fill="url(#rkt-flame)" />
        <path d="M132 336 Q140 356 148 336 Z" fill="url(#rkt-flame-core)" />
      </g>

      {/* Left fin */}
      <path d="M96 242 L78 284 L100 274 Z" fill="#52525b" />
      <path d="M96 242 L78 284 L88 281 L99 256 Z" fill="#3f3f46" opacity="0.55" />
      {/* Right fin */}
      <path d="M184 242 L202 284 L180 274 Z" fill="#52525b" />
      <path d="M184 242 L202 284 L192 281 L181 256 Z" fill="#3f3f46" opacity="0.55" />

      {/* Nose cone */}
      <path d="M140 28 C152 52 158 76 158 92 C158 106 152 116 140 116 C128 116 122 106 122 92 C122 76 128 52 140 28 Z" fill="url(#rkt-nose)" />
      <path d="M140 28 C146 40 150 54 151 68 L156 72 C150 56 146 42 140 28 Z" fill="#ffffff" opacity="0.35" />

      {/* Main body */}
      <path d="M128 112 C128 160 126 220 126 246 C126 276 132 296 140 296 C148 296 154 276 154 246 C154 220 152 160 152 112 Z" fill="url(#rkt-body)" />
      {/* Body shading — left core shadow for depth */}
      <path d="M128 130 C128 180 126 230 126 246 C126 270 130 288 134 294 C130 282 129 266 129 246 C129 200 130 160 128 130 Z" fill="#18181b" opacity="0.28" />

      {/* Window ring */}
      <circle cx="140" cy="158" r="22" fill="#18181b" />
      <circle cx="140" cy="158" r="18" fill="url(#rkt-window)" />
      <circle cx="140" cy="158" r="18" fill="none" stroke="#34d399" strokeWidth="2.5" />
      <circle cx="135" cy="153" r="5" fill="#34d399" opacity="0.85" />
      {/* Window cross-hair tick */}
      <path d="M140 140 L140 142 M140 174 L140 176 M122 158 L124 158 M156 158 L158 158" stroke="#34d399" strokeWidth="1.2" opacity="0.7" />

      {/* Hull rings */}
      <rect x="127" y="204" width="26" height="2.5" rx="1" fill="#3f3f46" opacity="0.7" />
      <rect x="126.5" y="214" width="27" height="2" rx="1" fill="#3f3f46" opacity="0.45" />
      <rect x="126" y="260" width="28" height="2.5" rx="1" fill="#3f3f46" opacity="0.7" />
      <rect x="126.5" y="270" width="27" height="2" rx="1" fill="#3f3f46" opacity="0.45" />

      {/* Small side nods */}
      <rect x="154" y="226" width="3.5" height="12" rx="1.75" fill="#fbbf24" opacity="0.9" />
      <rect x="122.5" y="226" width="3.5" height="12" rx="1.75" fill="#fbbf24" opacity="0.9" />

      {/* Engine bell */}
      <path d="M130 294 L126 308 L154 308 L150 294 Z" fill="#3f3f46" />
      <rect x="126" y="308" width="28" height="10" rx="2" fill="#27272a" />
      <path d="M130 318 L136 330 L144 330 L150 318 Z" fill="#1c1c1e" />

      {/* Ground-station tick — platform annotation */}
      <g opacity="0.6">
        <path d="M206 120 L224 138" stroke="#10b981" strokeWidth="1" />
        <circle cx="206" cy="120" r="2" fill="#10b981" />
        <path d="M60 292 L44 308" stroke="#10b981" strokeWidth="1" />
        <circle cx="60" cy="292" r="2" fill="#10b981" />
      </g>
    </svg>
  );
}
