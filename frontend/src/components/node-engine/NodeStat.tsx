"use client";

import { cn } from "@/lib/utils";

interface NodeStatProps {
  label: string;
  value: string;
  sub?: string;
  variant?: "default" | "signal" | "locked" | "authority";
  className?: string;
}

const variantStyles = {
  default: "text-white",
  signal: "text-node-signal",
  locked: "text-node-locked",
  authority: "text-white font-bold",
};

export default function NodeStat({
  label,
  value,
  sub,
  variant = "default",
  className,
}: NodeStatProps) {
  return (
    <div
      className={cn(
        "node-panel rounded-lg p-4 min-w-0",
        className,
      )}
    >
      <p className="node-telemetry mb-2">{label}</p>
      <p className={cn("text-xl md:text-2xl font-semibold tabular-nums tracking-tight", variantStyles[variant])}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-node-muted mt-1 font-mono">{sub}</p>
      )}
    </div>
  );
}
