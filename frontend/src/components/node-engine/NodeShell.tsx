"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NODE_STATUS } from "@/lib/nodeCopy";

interface NodeShellProps {
  children: React.ReactNode;
  className?: string;
  nodeId?: string;
}

export default function NodeShell({
  children,
  className,
  nodeId,
}: NodeShellProps) {
  const id =
    nodeId ??
    (typeof window !== "undefined"
      ? `NODE-${(localStorage.getItem("xc_access_token") ?? "0000").slice(-4).toUpperCase()}`
      : "NODE-0000");

  return (
    <div className={cn("node-mesh-bg min-h-full", className)}>
      <div className="hidden md:flex items-center justify-between px-1 pb-3 mb-1 border-b border-node-border/80">
        <div className="flex items-center gap-4 node-telemetry">
          <span className="text-node-signal">● LIVE</span>
          <span>ALT 127.4km</span>
          <span>V 7,842 m/s</span>
          <span className="text-node-signal">{NODE_STATUS.nominal}</span>
        </div>
        <div className="node-telemetry text-node-muted">{id}</div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
