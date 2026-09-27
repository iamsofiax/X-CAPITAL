"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NodePanel({
  title,
  scanLine = true,
  className,
  style,
  children,
}: {
  title?: string;
  scanLine?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "node-panel relative overflow-hidden rounded-xl",
        scanLine && "node-scan-line",
        className,
      )}
      style={style}
    >
      {title ? (
        <header className="node-panel-header px-5 py-3">
          <p className="node-telemetry">{title}</p>
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
