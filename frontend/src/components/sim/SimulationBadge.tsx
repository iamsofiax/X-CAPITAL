import { cn } from "@/lib/utils";

export function SimulationBadge({
  variant = "chip",
  className,
}: {
  variant?: "chip" | "banner";
  className?: string;
}) {
  if (variant === "banner") {
    return (
      <div
        role="note"
        className={cn(
          "border-b border-white/[0.06] text-white/40 text-[11px] tracking-[0.16em] uppercase",
          className,
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-1.5 text-center">
          Live desk · segregated node ledger
        </div>
      </div>
    );
  }
  return (
    <span className={cn("sim-chip", className)} title="Segregated node ledger">
      Live desk
    </span>
  );
}
