"use client";

import { cn } from "@/lib/utils";

interface NodePanelProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  scanLine?: boolean;
}

export default function NodePanel({
  title,
  subtitle,
  children,
  className,
  headerRight,
  scanLine = true,
}: NodePanelProps) {
  return (
    <div
      className={cn(
        "node-panel rounded-lg overflow-hidden relative",
        scanLine && "node-scan-line",
        className,
      )}
    >
      {(title || headerRight) && (
        <div className="node-panel-header px-4 py-3 flex items-center justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold tracking-tight text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-node-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
