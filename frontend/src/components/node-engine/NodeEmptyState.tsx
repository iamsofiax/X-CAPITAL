"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NodeEmptyStateProps {
  title: string;
  body: string;
  cta: string;
  href: string;
  className?: string;
}

export default function NodeEmptyState({
  title,
  body,
  cta,
  href,
  className,
}: NodeEmptyStateProps) {
  return (
    <div
      className={cn(
        "node-panel rounded-xl p-8 md:p-12 text-center border-2 border-dashed border-node-border",
        className,
      )}
    >
      <p className="node-telemetry text-node-locked mb-3">NODE STATUS</p>
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      <p className="text-sm text-node-muted mt-3 max-w-md mx-auto leading-relaxed">
        {body}
      </p>
      <Link
        href={href}
        className="inline-flex mt-6 px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-slate-100 transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}
