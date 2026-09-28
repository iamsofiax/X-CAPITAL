"use client";

import { cn } from "@/lib/utils";

export type XCapitalLogoProps = {
  size?: number;
  className?: string;
};

/** Institutional seal. A cut capital X with an emerald baseline, not a social mark. */
export function XCapitalLogo({ size = 20, className }: XCapitalLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("x-logo shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="#101816" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.5" fill="none" stroke="#6ee7b7" strokeOpacity="0.72" strokeWidth="1" />
      <path fill="#f4f7f5" d="M8.2 7.2h3.4L16 12.6 20.4 7.2H23.8L17.6 16l6.2 8.8h-3.4L16 19.4l-4.4 5.4H8.2L14.4 16 8.2 7.2z" />
      <rect x="8" y="26.15" width="16" height="1.15" fill="#34d399" />
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
  return <XCapitalLogo size={size} className={className} />;
}
