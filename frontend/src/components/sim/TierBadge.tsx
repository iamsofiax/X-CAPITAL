import { Award } from "lucide-react";
import { CAREER_TIERS, nextTier, tierFor, tierProgress } from "@/lib/sim/scoring";
import { cn } from "@/lib/utils";

const TIER_TONE: Record<string, string> = {
  analyst: "text-slate-300 border-slate-400/25 bg-slate-400/[0.06]",
  associate: "text-sky-300 border-sky-400/30 bg-sky-400/[0.07]",
  vp: "text-violet-300 border-violet-400/30 bg-violet-400/[0.07]",
  director: "text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/[0.07]",
  partner: "text-amber-300 border-amber-400/35 bg-amber-400/[0.08]",
  gp: "text-emerald-300 border-emerald-400/40 bg-emerald-400/[0.09]",
};

export function TierBadge({ xp, className }: { xp: number; className?: string }) {
  const tier = tierFor(xp);
  return (
    <span className={cn("sim-chip", TIER_TONE[tier.id], className)} title={`${tier.boost}x XC accrual`}>
      <Award className="w-3 h-3" />
      {tier.title}
    </span>
  );
}

export function TierLadder({ xp }: { xp: number }) {
  const current = tierFor(xp);
  const next = nextTier(xp);
  const progress = tierProgress(xp);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="sim-label mb-1">Career track</p>
          <p className="text-lg font-bold text-white">{current.title}</p>
          <p className="sim-num text-[11px] text-white/45">{xp.toLocaleString()} XP · {current.boost}x emissions</p>
        </div>
        {next && (
          <p className="sim-num text-[11px] text-white/45 text-right">
            {(next.minXp - xp).toLocaleString()} XP to
            <br />
            <span className="text-white/80">{next.title}</span>
          </p>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <ol className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {CAREER_TIERS.map((t) => {
          const reached = xp >= t.minXp;
          return (
            <li
              key={t.id}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-center",
                reached ? TIER_TONE[t.id] : "border-white/[0.06] text-white/30",
                t.id === current.id && "ring-1 ring-white/20",
              )}
            >
              <p className="text-[10px] font-bold truncate">{t.title}</p>
              <p className="sim-num text-[9px] opacity-70">{t.boost}x</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
