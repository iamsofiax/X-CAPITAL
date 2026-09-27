"use client";

import { useMemo } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import {
  REGIME_TRANSITION,
  drawdownFromPeak,
  navAt,
  navHistory,
  realizedVol,
  trailingReturn,
  type VaultSpec,
} from "@/lib/sim/vaults";
import { fmtPct, fmtUsdc, signClass } from "@/lib/sim/format";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

export interface VaultStats {
  nav: number;
  ret30d: number;
  ret90d: number;
  vol: number;
  drawdown: number;
  series: number[];
}

export function vaultStats(id: string, epoch: number): VaultStats {
  const series = navHistory(id, epoch - 90, epoch).map((p) => p.nav);
  return {
    nav: navAt(id, epoch),
    ret30d: trailingReturn(id, epoch, 90),
    ret90d: trailingReturn(id, epoch, 270),
    vol: realizedVol(id, epoch, 90),
    drawdown: drawdownFromPeak(id, epoch, 270),
    series,
  };
}

export function RiskMeter({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Risk ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 h-3 rounded-sm",
            i <= level ? (level >= 4 ? "bg-rose-400" : level >= 3 ? "bg-amber-400" : "bg-emerald-400") : "bg-white/10",
          )}
        />
      ))}
    </span>
  );
}

export function VaultCard({
  spec,
  epoch,
  positionValue,
  selected,
  onSelect,
}: {
  spec: VaultSpec;
  epoch: number;
  positionValue?: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const s = useMemo(() => vaultStats(spec.id, epoch), [spec.id, epoch]);
  const lockDays = spec.lockEpochs / 3;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "sim-glass text-left p-4 w-full transition-all duration-200 hover:-translate-y-0.5",
        selected ? "ring-1 ring-emerald-400/50" : "hover:ring-1 hover:ring-white/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="sim-label" style={{ color: spec.accent }}>{spec.code}</p>
          <h3 className="text-[15px] font-bold text-white mt-0.5 truncate">{spec.name}</h3>
        </div>
        <RiskMeter level={spec.risk} />
      </div>

      <div className="mt-3 -mx-1">
        <Sparkline values={s.series} color={spec.accent} height={44} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div>
          <p className="sim-label text-[8.5px]">NAV</p>
          <p className="sim-num text-[13px] text-white font-bold">{s.nav.toFixed(4)}</p>
        </div>
        <div>
          <p className="sim-label text-[8.5px]">30D</p>
          <p className={cn("sim-num text-[13px] font-bold", signClass(s.ret30d))}>{fmtPct(s.ret30d)}</p>
        </div>
        <div>
          <p className="sim-label text-[8.5px]">Vol</p>
          <p className="sim-num text-[13px] text-white/80 font-bold">{fmtPct(s.vol, 1, false)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="sim-chip text-[9px]">Perf fee {Math.round(spec.perfFee * 100)}% · HWM</span>
        {spec.lockEpochs > 0 ? (
          <span className="sim-chip text-[9px]"><Lock className="w-2.5 h-2.5" />{lockDays}D window</span>
        ) : (
          <span className="sim-chip text-[9px]"><ShieldCheck className="w-2.5 h-2.5" />Instant exit</span>
        )}
        {positionValue !== undefined && positionValue > 0 && (
          <span className="sim-chip sim-chip-live text-[9px]">Held {fmtUsdc(positionValue, { compact: true })}</span>
        )}
      </div>
    </button>
  );
}

/** Long-run expected annual return under the published regime model, net of the performance fee. */
export function modelExpectedReturn(spec: VaultSpec): number {
  const { calmToStress, stressToCalm } = REGIME_TRANSITION;
  const pStress = calmToStress / (calmToStress + stressToCalm);
  const gross = (1 - pStress) * spec.calm.mu + pStress * spec.stress.mu;
  return gross > 0 ? gross * (1 - spec.perfFee) : gross;
}
