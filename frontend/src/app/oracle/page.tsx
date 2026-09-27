"use client";

import { useDeferredValue, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/sim/Panel";
import { ProjectionFan } from "@/components/sim/ProjectionFan";
import { RegimeChip } from "@/components/sim/EpochClock";
import { modelExpectedReturn } from "@/components/sim/VaultCard";
import { useSim } from "@/hooks/useSim";
import { REGIME_TRANSITION, VAULTS, realizedVol, regimeAt, trailingReturn } from "@/lib/sim/vaults";
import { fmtPct, fmtUsdc, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

export default function OraclePage() {
  return (
    <DashboardLayout title="Oracle" subtitle="R6 · Regime model, strategy analytics and allocation" wide requireGenesis>
      <Oracle />
    </DashboardLayout>
  );
}

function Oracle() {
  const { epoch, account } = useSim();
  const { calmToStress, stressToCalm } = REGIME_TRANSITION;
  const pStress = calmToStress / (calmToStress + stressToCalm);

  const strip = useMemo(() => {
    const out: ("calm" | "stress")[] = [];
    for (let e = Math.max(0, epoch - 179); e <= epoch; e++) out.push(regimeAt(e));
    return out;
  }, [epoch]);
  const stressShare = strip.filter((r) => r === "stress").length / strip.length;

  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(VAULTS.map((v) => [v.id, v.id === "tbill" ? 40 : v.id === "basis" ? 30 : v.id === "tail" ? 10 : v.id === "aidx" ? 20 : 0])),
  );
  const [capital, setCapital] = useState(0);
  const [horizon, setHorizon] = useState(180);
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0);

  const input = useMemo(() => {
    const vaults: Record<string, number> = {};
    for (const [id, w] of Object.entries(weights)) if (w > 0 && totalW > 0) vaults[id] = (capital * w) / totalW;
    return {
      vaults,
      idle: totalW === 0 ? capital : 0,
      feeShareApr: 0,
      horizonEpochs: horizon * 3,
      startRegime: regimeAt(epoch),
      paths: 500,
      seedKey: `lab:${account?.userId ?? "anon"}`,
    };
  }, [weights, totalW, capital, horizon, epoch, account?.userId]);
  const deferredInput = useDeferredValue(input);

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-3 gap-5">
        <Panel code="Regime model" title="Two-state Markov chain" edge className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <RegimeChip epoch={epoch} />
            <span className="sim-chip">Stationary P(stress) {fmtPct(pStress, 1, false)}</span>
            <span className="sim-chip">Last 60D in stress {fmtPct(stressShare, 1, false)}</span>
            <span className="sim-chip">Mean stress spell {(1 / stressToCalm / 3).toFixed(1)}D</span>
          </div>
          <div className="flex gap-[2px] h-10 items-stretch" aria-label="Regime history, last 180 epochs">
            {strip.map((r, i) => (
              <span key={i} className={cn("flex-1 rounded-[1px]", r === "calm" ? "bg-emerald-400/35" : "bg-amber-400/85")} />
            ))}
          </div>
          <div className="flex justify-between sim-label text-[8.5px] mt-1.5">
            <span>60 days ago</span>
            <span>Now · epoch {epoch.toLocaleString()}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5 sim-num text-[12px]">
            <div className="rounded-xl border border-white/[0.06] p-3">
              <p className="sim-label text-[8.5px] mb-2">Transition matrix (per 8h epoch)</p>
              <table className="w-full">
                <thead><tr className="text-white/35 text-[10px]"><th /><th className="text-right font-normal">→ calm</th><th className="text-right font-normal">→ stress</th></tr></thead>
                <tbody>
                  <tr><td className="text-white/50">calm</td><td className="text-right text-white">{fmtPct(1 - calmToStress, 1, false)}</td><td className="text-right text-amber-300">{fmtPct(calmToStress, 1, false)}</td></tr>
                  <tr><td className="text-white/50">stress</td><td className="text-right text-emerald-300">{fmtPct(stressToCalm, 1, false)}</td><td className="text-right text-white">{fmtPct(1 - stressToCalm, 1, false)}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-white/45 leading-relaxed font-sans">
              One global regime drives every vault, so correlations jump together in stress, as they do in real
              markets. The chain is seeded and deterministic: every user sees the same history, and nobody,
              including the operator, can steer an individual book.
            </p>
          </div>
        </Panel>

        <Panel code="Strategy analytics" title="Model vs realized">
          <ul className="space-y-2.5">
            {VAULTS.map((v) => {
              const exp = modelExpectedReturn(v);
              const r = trailingReturn(v.id, epoch, 270);
              return (
                <li key={v.id} className="flex items-center gap-3 text-[12px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: v.accent }} />
                  <span className="flex-1 min-w-0 text-white/80 truncate">{v.name}</span>
                  <span className="sim-num w-16 text-right text-white/50" title="Model long-run expected return, net of fees">{fmtPct(exp, 1)}</span>
                  <span className={cn("sim-num w-16 text-right", signClass(r))} title="Realized 90-day return">{fmtPct(r, 1)}</span>
                  <span className="sim-num w-12 text-right text-white/40" title="Realized annualized vol">{fmtPct(realizedVol(v.id, epoch, 270), 0, false)}</span>
                </li>
              );
            })}
          </ul>
          <p className="sim-label text-[8px] mt-3 text-right">Model E[r] · Realized 90D · Vol</p>
        </Panel>
      </div>

      <Panel code="Allocation lab" title="What-if Monte Carlo" action={<span className="sim-chip">Nothing here is executed</span>}>
        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="sim-label text-[8.5px]">Capital (USD)</span>
                <input type="number" min={1000} step={1000} value={capital} onChange={(e) => setCapital(Math.max(0, Number(e.target.value) || 0))} className="sim-input sim-num mt-1 py-2" />
              </label>
              <label className="block">
                <span className="sim-label text-[8.5px]">Horizon</span>
                <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="sim-input sim-num mt-1 py-2">
                  {[30, 90, 180, 365].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </label>
            </div>
            {VAULTS.map((v) => (
              <label key={v.id} className="block">
                <span className="flex justify-between text-[12px]">
                  <span className="text-white/75">{v.name}</span>
                  <span className="sim-num text-white/50">{totalW > 0 ? ((weights[v.id] / totalW) * 100).toFixed(0) : 0}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights[v.id]}
                  onChange={(e) => setWeights((w) => ({ ...w, [v.id]: Number(e.target.value) }))}
                  className="w-full accent-emerald-400"
                  style={{ accentColor: v.accent }}
                />
              </label>
            ))}
            <p className="sim-num text-[11px] text-white/40">Deploying {fmtUsdc(capital, { decimals: 0 })} across {Object.values(weights).filter((w) => w > 0).length} sleeves.</p>
          </div>
          <ProjectionFan input={deferredInput} height={300} />
        </div>
      </Panel>
    </div>
  );
}
