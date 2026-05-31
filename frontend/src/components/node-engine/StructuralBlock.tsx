"use client";

import { STRUCTURAL_ARCHITECTURE } from "@/lib/nodeCopy";
import { cn } from "@/lib/utils";

interface StructuralBlockProps {
  className?: string;
  limit?: number;
}

export default function StructuralBlock({
  className,
  limit,
}: StructuralBlockProps) {
  const items = limit
    ? STRUCTURAL_ARCHITECTURE.slice(0, limit)
    : STRUCTURAL_ARCHITECTURE;

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="node-panel rounded-lg p-4 md:p-5 border-l-4 border-l-node-signal"
        >
          <div className="flex gap-4">
            <span className="node-telemetry text-node-signal shrink-0">
              {item.id}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-white">{item.title}</h4>
              <p className="text-xs text-node-muted mt-2 leading-relaxed">
                {item.body}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
