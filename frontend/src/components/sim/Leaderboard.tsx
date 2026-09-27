"use client";

import { useEffect, useState } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { simAPI, type LeaderboardEntry } from "@/lib/api";
import { fmtPct, fmtUsdc, signClass } from "@/lib/sim/format";
import { MIN_EPOCHS_FOR_RANK } from "@/lib/sim/scoring";
import { cn } from "@/lib/utils";

export function Leaderboard({
  season,
  selfId,
  limit = 20,
}: {
  season: number;
  selfId?: string | null;
  limit?: number;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    simAPI
      .getLeaderboard(season)
      .then(({ data }) => {
        if (!cancelled) setEntries(data.data.entries);
      })
      .catch(() => {
        if (!cancelled) setError("Leaderboard is unavailable right now.");
      });
    return () => {
      cancelled = true;
    };
  }, [season, nonce]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-white/45">
          Ranked by season Sortino ratio (downside-risk-adjusted return). Resets are shown, not hidden.
          Books need {MIN_EPOCHS_FOR_RANK}+ settled epochs to rank.
        </p>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
          aria-label="Refresh leaderboard"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && <p className="text-sm text-red-300/80 py-4">{error}</p>}
      {!error && entries === null && <p className="text-sm text-white/40 py-4">Loading standings…</p>}
      {!error && entries?.length === 0 && (
        <p className="text-sm text-white/40 py-6 text-center">
          No ranked books yet this season. Settle {MIN_EPOCHS_FOR_RANK} epochs to be the first.
        </p>
      )}

      {!!entries?.length && (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                <th className="font-normal px-5 py-2">#</th>
                <th className="font-normal px-2 py-2">Manager</th>
                <th className="font-normal px-2 py-2 text-right">Sortino</th>
                <th className="font-normal px-2 py-2 text-right">Season</th>
                <th className="font-normal px-2 py-2 text-right">Max DD</th>
                <th className="font-normal px-2 py-2 text-right">NAV</th>
                <th className="font-normal px-5 py-2 text-right">Resets</th>
              </tr>
            </thead>
            <tbody className="sim-num text-[12px]">
              {entries.slice(0, limit).map((e) => (
                <tr
                  key={e.userId}
                  className={cn(
                    "border-b border-white/[0.03]",
                    e.userId === selfId ? "bg-emerald-400/[0.06]" : "hover:bg-white/[0.02]",
                  )}
                >
                  <td className="px-5 py-2.5">
                    {e.rank <= 3 ? (
                      <Trophy className={cn("w-3.5 h-3.5", e.rank === 1 ? "text-amber-300" : e.rank === 2 ? "text-slate-300" : "text-orange-400")} />
                    ) : (
                      <span className="text-white/40">{e.rank}</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="text-white font-bold font-sans">{e.name}</span>
                    {e.userId === selfId && <span className="ml-2 sim-chip sim-chip-live text-[8px] py-0">You</span>}
                    <span className="block text-[10px] text-white/35">{e.careerTier}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right text-white font-bold">{e.sortino?.toFixed(2) ?? "—"}</td>
                  <td className={cn("px-2 py-2.5 text-right", signClass(e.seasonReturn))}>{fmtPct(e.seasonReturn)}</td>
                  <td className="px-2 py-2.5 text-right sim-neg">{fmtPct(e.maxDrawdown, 1)}</td>
                  <td className="px-2 py-2.5 text-right text-white/70">{fmtUsdc(e.nav, { compact: true })}</td>
                  <td className={cn("px-5 py-2.5 text-right", e.resets > 0 ? "text-amber-300" : "text-white/35")}>{e.resets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
