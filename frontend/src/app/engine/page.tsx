"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel, Stat, Notice } from "@/components/sim/Panel";
import { ConvictionDial } from "@/components/sim/ConvictionDial";
import { Leaderboard } from "@/components/sim/Leaderboard";
import { TierLadder } from "@/components/sim/TierBadge";
import { useSim } from "@/hooks/useSim";
import { LOCK_TERMS, initialWeight, isUnlockable, lockWeight } from "@/lib/sim/conviction";
import { EPOCHS_PER_YEAR, SEASON_EPOCHS, epochStart, seasonBounds, seasonOf } from "@/lib/sim/clock";
import { EMISSION_PER_1K } from "@/lib/sim/engine";
import { FEE_SWITCH, avgNetworkFees, networkTvlAt, networkVeWeightAt } from "@/lib/sim/vaults";
import { fmtNum, fmtPct, fmtUsdc, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

export default function ConvictionPage() {
  return (
    <DashboardLayout title="Conviction" subtitle="R7 · Lock XC · share of protocol fees" wide requireGenesis>
      <Conviction />
    </DashboardLayout>
  );
}

function Conviction() {
  const { account, metrics, epoch, actions, userId } = useSim();
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState<number>(365);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (!account || !metrics) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-sm text-white/55">
        Opening the book
      </div>
    );
  }
  const now = Date.now();
  const value = Number(amount) || 0;
  const netWeight = networkVeWeightAt(epoch);
  const poolPerEpoch = avgNetworkFees(epoch) * FEE_SWITCH;
  const previewWeight = initialWeight(value, days);
  const previewShare = (metrics.veWeight + previewWeight) / (netWeight + metrics.veWeight + previewWeight);
  const previewAnnual = poolPerEpoch * previewShare * EPOCHS_PER_YEAR;
  const season = seasonOf(epoch);
  const bounds = seasonBounds(season);
  const seasonProgress = (epoch - bounds.start) / SEASON_EPOCHS;

  const lock = () => {
    setMsg(null);
    const res = actions.lock(value, days);
    if (res.ok) {
      setMsg({ tone: "success", text: `Locked ${fmtNum(value, 2)} XC for ${days} days · weight ${fmtNum(previewWeight, 2)}.` });
      setAmount("");
    } else setMsg({ tone: "error", text: res.error });
  };

  const unlock = (id: string) => {
    const res = actions.unlock(id);
    setMsg(res.ok ? { tone: "success", text: "Lock released to free XC." } : { tone: "error", text: res.error });
  };

  return (
    <div className="space-y-5">
      <div className="grid xl:grid-cols-3 gap-5">
        <Panel code="WEIGHT" title="Your conviction" edge className="xl:col-span-2">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
            <ConvictionDial weight={metrics.veWeight} locked={metrics.locked} poolShare={metrics.poolShare} apr={metrics.feeShareApr} />
            <div className="grid grid-cols-2 gap-5">
              <Stat label="Free XC" value={fmtNum(metrics.sxc, 4)} sub={`${EMISSION_PER_1K} XC / epoch per 1k deployed × ${metrics.tier.boost}x`} />
              <Stat label="Fee share earned" value={fmtUsdc(account.totals.feeShare)} tone="pos" sub="Lifetime, USD" />
              <Stat label="XC emitted" value={fmtNum(account.totals.sxcEmitted, 2)} sub="Lifetime" />
              <Stat label="Fee-share APR on NAV" value={fmtPct(metrics.feeShareApr, 2, false)} sub="Trailing 30D pool, current weight" />
            </div>
          </div>
        </Panel>

        <Panel code="Closed loop" title="Where the yield comes from">
          <ol className="space-y-3 text-[12.5px] text-white/60">
            <li><span className="sim-num text-white/35 mr-2">01</span>Vaults charge performance fees only on new highs; trades pay spread.</li>
            <li><span className="sim-num text-white/35 mr-2">02</span>{Math.round(FEE_SWITCH * 100)}% of those fees accrue to conviction locks each period, pro-rata by weight.</li>
            <li><span className="sim-num text-white/35 mr-2">03</span>Weight = locked XC × time remaining ÷ 365D, and decays to zero at unlock.</li>
            <li><span className="sim-num text-white/35 mr-2">04</span>No fees earned, nothing paid. Nothing is printed.</li>
          </ol>
          <dl className="grid grid-cols-2 gap-3 mt-4 sim-num text-[11.5px]">
            <div><dt className="sim-label text-[8.5px]">Network TVL</dt><dd className="text-white">{fmtUsdc(networkTvlAt(epoch), { compact: true })}</dd></div>
            <div><dt className="sim-label text-[8.5px]">Network weight</dt><dd className="text-white">{fmtNum(netWeight / 1e6, 2)}M</dd></div>
            <div><dt className="sim-label text-[8.5px]">Locker pool / epoch</dt><dd className="sim-pos">{fmtUsdc(poolPerEpoch, { compact: true })}</dd></div>
            <div><dt className="sim-label text-[8.5px]">Fee switch</dt><dd className="text-white">{fmtPct(FEE_SWITCH, 0, false)}</dd></div>
          </dl>
        </Panel>
      </div>

      <div className="grid xl:grid-cols-[380px_1fr] gap-5">
        <Panel code="Lock" title="Commit XC">
          <label htmlFor="lock-amt" className="sim-label block mb-1.5">Amount (XC)</label>
          <input id="lock-amt" type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="sim-input sim-num" />
          <div className="flex gap-1.5 mt-2">
            {[0.25, 0.5, 1].map((f) => (
              <button key={f} type="button" onClick={() => setAmount((Math.floor(metrics.sxc * f * 1e4) / 1e4).toString())} className="sim-chip cursor-pointer flex-1 justify-center">
                {f === 1 ? "Max" : `${f * 100}%`}
              </button>
            ))}
          </div>
          <p className="sim-label mt-4 mb-1.5">Term</p>
          <div className="grid grid-cols-4 gap-1.5">
            {LOCK_TERMS.map((t) => (
              <button key={t.days} type="button" onClick={() => setDays(t.days)} className={cn("sim-btn py-2 text-[12px]", days === t.days ? "sim-btn-primary" : "sim-btn-ghost")}>
                {t.label}
              </button>
            ))}
          </div>
          <dl className="sim-num text-[11.5px] space-y-1.5 mt-4 border-t border-white/[0.05] pt-3">
            <div className="flex justify-between"><dt className="text-white/40">Initial weight</dt><dd className="text-white">{fmtNum(previewWeight, 4)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Network share after</dt><dd className="text-white">{(previewShare * 100).toPrecision(3)}%</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Est. fee share / yr*</dt><dd className="sim-pos">{fmtUsdc(previewAnnual)}</dd></div>
          </dl>
          {msg && <Notice tone={msg.tone} className="mt-4">{msg.text}</Notice>}
          <button type="button" onClick={lock} disabled={!(value > 0)} className="sim-btn sim-btn-primary w-full mt-4">
            <Lock className="w-4 h-4" /> Lock for {days} days
          </button>
          <p className="text-[11px] text-white/35 mt-3 leading-relaxed">
            *At today&apos;s trailing pool and your starting weight. Real payouts vary with vault performance, and
            weight decays as the lock approaches expiry. Locked XC cannot be withdrawn early.
          </p>
        </Panel>

        <Panel code="Positions" title="Active locks">
          {account.locks.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-6">No locks yet. XC accrues every epoch on deployed capital.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                    <th className="font-normal px-5 py-2">Locked</th>
                    <th className="font-normal px-2 py-2 text-right">Weight</th>
                    <th className="font-normal px-2 py-2">Decay</th>
                    <th className="font-normal px-2 py-2 text-right">Unlocks</th>
                    <th className="font-normal px-5 py-2 text-right" />
                  </tr>
                </thead>
                <tbody className="sim-num text-[12px]">
                  {account.locks.map((l) => {
                    const w = lockWeight(l, now);
                    const done = isUnlockable(l, now);
                    const elapsed = Math.min(1, (now - l.startTs) / (l.endTs - l.startTs));
                    return (
                      <tr key={l.id} className="border-b border-white/[0.03]">
                        <td className="px-5 py-2.5 text-white font-bold">{fmtNum(l.amount, 2)} XC</td>
                        <td className="px-2 py-2.5 text-right text-violet-300">{fmtNum(w, 4)}</td>
                        <td className="px-2 py-2.5 w-40">
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full bg-violet-400/70" style={{ width: `${(1 - elapsed) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right text-white/60">{new Date(l.endTs).toISOString().slice(0, 10)}</td>
                        <td className="px-5 py-2.5 text-right">
                          <button type="button" onClick={() => unlock(l.id)} disabled={!done} className="sim-btn sim-btn-ghost py-1.5 px-3 text-[11px]">
                            <Unlock className="w-3 h-3" /> {done ? "Unlock" : "Locked"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid xl:grid-cols-[380px_1fr] gap-5">
        <Panel code={`Season ${season + 1}`} title="Standing">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400" style={{ width: `${seasonProgress * 100}%` }} />
          </div>
          <p className="sim-num text-[11px] text-white/40 mt-1.5">
            Epoch {epoch - bounds.start + 1} of {SEASON_EPOCHS} · ends {new Date(epochStart(bounds.end + 1)).toISOString().slice(0, 10)}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Stat label="Season return" value={fmtPct(metrics.seasonReturn)} tone={metrics.seasonReturn >= 0 ? "pos" : "neg"} />
            <Stat label="Sortino" value={metrics.sortino?.toFixed(2) ?? "—"} sub={metrics.sortino === null ? "Needs 6+ epochs" : undefined} />
            <Stat label="Max drawdown" value={<span className={signClass(metrics.maxDrawdown)}>{fmtPct(metrics.maxDrawdown, 1)}</span>} />
            <Stat label="Resets" value={account.resets} tone={account.resets > 0 ? "warn" : undefined} />
          </div>
          <div className="mt-6">
            <TierLadder xp={account.xp} />
          </div>
        </Panel>
        <Panel code="Leaderboard" title={`Season ${season + 1} rankings`}>
          <Leaderboard season={season} selfId={userId} />
        </Panel>
      </div>
    </div>
  );
}
