"use client";

import { cn } from "@/lib/utils";

type XCapitalLogoProps = {
  size?: number;
  className?: string;
  /** Soft green on the rising stroke. */
  glow?: boolean;
};

/** Earlier X: a white leg and a green leg. */
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
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <line x1="6" y1="6" x2="18" y2="18" stroke="white" strokeWidth="2.75" strokeLinecap="round" />
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
              ? { filter: "drop-shadow(0 0 3px rgba(34,197,94,0.45))" }
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
        "rounded-xl bg-gradient-to-br from-zinc-950 to-black border border-white/15 flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <XCapitalLogo size={Math.round(size * 0.55)} glow={false} />
    </div>
  );
}
