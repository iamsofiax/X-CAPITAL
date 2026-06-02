"use client";

import { cn } from "@/lib/utils";

interface MissionCanvasProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

/** Main content frame — CSS-only enter (no layout animation library). */
export default function MissionCanvas({
  children,
  className,
  wide = false,
}: MissionCanvasProps) {
  return (
    <div
      className={cn(
        "mission-canvas-enter mx-auto w-full px-5 md:px-8 lg:px-10 pt-7 md:pt-10 pb-28 md:pb-36",
        wide ? "max-w-[1600px]" : "max-w-[1400px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
