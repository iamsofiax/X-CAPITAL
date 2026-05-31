"use client";

import { cn } from "@/lib/utils";

type SignalState = "ROUTING" | "ARMED" | "FUNDED" | "UNFUNDED" | "PENDING" | "NOMINAL";

interface NodeSignalProps {
  state: SignalState;
  className?: string;
}

const stateConfig: Record<
  SignalState,
  { color: string; pulse: boolean }
> = {
  ROUTING: { color: "bg-node-signal", pulse: true },
  ARMED: { color: "bg-node-signal", pulse: true },
  FUNDED: { color: "bg-node-signal", pulse: false },
  UNFUNDED: { color: "bg-node-locked", pulse: false },
  PENDING: { color: "bg-amber-500", pulse: true },
  NOMINAL: { color: "bg-node-signal", pulse: false },
};

export default function NodeSignal({ state, className }: NodeSignalProps) {
  const cfg = stateConfig[state];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded border-2 border-node-border bg-node-panel-up",
        className,
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          cfg.color,
          cfg.pulse && "animate-pulse",
        )}
      />
      <span className="node-telemetry text-white/90">{state}</span>
    </div>
  );
}
