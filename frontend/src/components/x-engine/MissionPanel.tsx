"use client";

import { cn } from "@/lib/utils";

interface MissionPanelProps {
  title?: string;
  code?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  flush?: boolean;
}

export default function MissionPanel({
  title,
  code,
  children,
  className,
  headerRight,
  flush = false,
}: MissionPanelProps) {
  return (
    <section
      className={cn(
        "mission-panel rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden",
        className,
      )}
    >
      {(title || code || headerRight) && (
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            {code && (
              <span className="engine-mono text-[10px] text-emerald-500/80 shrink-0">
                {code}
              </span>
            )}
            {title && (
              <h2 className="text-sm md:text-base font-semibold text-white truncate">
                {title}
              </h2>
            )}
          </div>
          {headerRight}
        </header>
      )}
      <div className={cn(!flush && "p-5 md:p-6")}>{children}</div>
    </section>
  );
}
