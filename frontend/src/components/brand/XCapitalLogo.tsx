"use client";

import { cn } from "@/lib/utils";

type XCapitalLogoProps = {
  size?: number;
  className?: string;
};

/** Black X. A filled mark on its own; the tile is added by the wordmark frame. */
export function XCapitalLogo({ size = 20, className }: XCapitalLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("x-logo shrink-0", className)}
      aria-hidden
    >
      <path
        fill="#0a0a0a"
        d="M3.1 2.2h4.35L12 9.05 16.55 2.2H20.9L13.85 12l7.05 9.8h-4.35L12 14.95 7.45 21.8H3.1L10.15 12 3.1 2.2z"
      />
    </svg>
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
    <span
      className={cn("inline-flex items-center justify-center bg-white shrink-0", className)}
      style={{ width: size, height: size, borderRadius: Math.max(6, Math.round(size * 0.22)) }}
    >
      <XCapitalLogo size={Math.round(size * 0.62)} />
    </span>
  );
}
