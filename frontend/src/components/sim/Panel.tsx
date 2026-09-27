import { cn } from "@/lib/utils";

export function Panel({
  title,
  code,
  action,
  children,
  className,
  edge,
  bodyClassName,
}: {
  title?: React.ReactNode;
  code?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  edge?: boolean;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("pnl-stage", edge && "sim-glass-edge", className)}>
      {(title || code || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <div className="min-w-0">
            {code && <p className="sim-label mb-1 text-emerald-300/80">{code}</p>}
            {title && <h2 className="text-lg md:text-xl font-black text-white tracking-tight truncate">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5 md:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "pos" | "neg" | "warn";
  className?: string;
}) {
  return (
    <div className={cn("pnl-card min-w-0", tone === "neg" ? "pnl-card-neg" : tone === "warn" ? "pnl-card-warn" : "pnl-card-pos", className)}>
      <p className="sim-label">{label}</p>
      <p
        className={cn(
          "pnl-figure truncate",
          tone === "pos" && "text-emerald-300",
          tone === "neg" && "text-red-300",
          tone === "warn" && "text-amber-300",
          !tone && "text-white",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[12px] text-white/40 mt-2 truncate">{sub}</p>}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-[13px]",
        tone === "error" && "border-red-500/30 bg-red-500/[0.07] text-red-200",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200",
        tone === "info" && "border-white/10 bg-white/[0.03] text-white/70",
        className,
      )}
    >
      {children}
    </div>
  );
}
