"use client";

import { cn } from "@/lib/utils";

type XCapitalLogoProps = {
  size?: number;
  className?: string;
  /** Show soft green glow on the profit stroke */
  glow?: boolean;
};

/** X mark: white leg + pure green leg ↗ (chart-up direction). */
export function XCapitalLogo({
  size = 20,
  className,
  glow = true,
}: XCapitalLogoProps) {
  const green = "#22c55e";

  return (
    <div
      className={cn("x-logo inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
          stroke="white"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="18"
          x2="18"
          y2="6"
          stroke={green}
          strokeWidth="2.75"
          strokeLinecap="round"
          style={
            glow
              ? {
                  filter:
                    "drop-shadow(0 0 4px rgba(34,197,94,0.85)) drop-shadow(0 0 10px rgba(34,197,94,0.35))",
                }
              : undefined
          }
        />
      </svg>
    </div>
  );
}

export function XCapitalLogoMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hero-x-logo rounded-xl bg-gradient-to-br from-zinc-950 to-black border border-white/15 flex items-center justify-center shadow-lg shadow-emerald-950/25 premium-3d-tilt",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <XCapitalLogo size={Math.round(size * 0.55)} />
    </div>
  );
}
