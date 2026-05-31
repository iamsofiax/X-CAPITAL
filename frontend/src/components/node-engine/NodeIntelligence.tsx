"use client";

import { useEffect, useState } from "react";
import {
  getNodeIntelligenceMessage,
  type NodeUserState,
} from "@/lib/nodeCopy";
import { cn } from "@/lib/utils";

interface NodeIntelligenceProps {
  state: NodeUserState;
  className?: string;
}

export default function NodeIntelligence({
  state,
  className,
}: NodeIntelligenceProps) {
  const [message, setMessage] = useState(() =>
    getNodeIntelligenceMessage(state),
  );

  useEffect(() => {
    setMessage(getNodeIntelligenceMessage(state));
    const t = setInterval(
      () => setMessage(getNodeIntelligenceMessage(state)),
      8000,
    );
    return () => clearInterval(t);
  }, [state]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded border border-node-border bg-node-panel/80",
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-node-signal animate-pulse shrink-0" />
      <p className="text-xs font-mono text-node-muted truncate">{message}</p>
    </div>
  );
}
