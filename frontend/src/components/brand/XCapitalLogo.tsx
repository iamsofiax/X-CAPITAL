"use client";

import { cn } from "@/lib/utils";

export type XCapitalLogoProps = {
  size?: number;
  className?: string;
};

/** Official X (Twitter) logo path */
const X_LOGO_PATH =
  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z";

export function XCapitalLogo({ size = 20, className }: XCapitalLogoProps) {
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
        <path d={X_LOGO_PATH} fill="#ffffff" />
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
        "hero-x-logo rounded-xl bg-gradient-to-br from-zinc-950 to-black border border-white/15 flex items-center justify-center shadow-lg shadow-black/50",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <XCapitalLogo size={Math.round(size * 0.58)} />
    </div>
  );
}
