"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useProfitEngine, type BullishSpike } from "@/store/useProfitEngine";
import { cn, formatCurrency } from "@/lib/utils";
import { NODE_LADDER, getNodeProgress } from "@/lib/nodeLadder";
import { TrendingUp, Zap, Flame, Activity } from "lucide-react";

/**
 * Ground Station rate ladder presets. Rates track the Node Advancement
 * Ladder (entry 3%/day → Sovereign 15%/day) so every preset lands inside
 * the engine ceiling.
 */
const DAILY_RATE_PRESETS = [
  { label: "Node I 3.0%", value: 3.0 },
  { label: "Node II 3.5%", value: 3.5 },
  { label: "Node III 5.0%", value: 5.0 },
  { label: "Node V 8.0%", value: 8.0 },
  { label: "Node VIII 15%", value: 15.0 },
];

export default function BullishSpikeControls() {
  const {
    registeredUsers,
    addAuditEntry,
    user: currentUser,
    updateUserById,
  } = useStore();
  const { bullishSpikes, addBullishSpike, resolveBullishSpike, nodeGrowths } =
    useProfitEngine();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [spikePct, setSpikePct] = useState(15);
  const [durationHrs, setDurationHrs] = useState(24);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [label, setLabel] = useState("Bullish spike");
  const [customDailyRate, setCustomDailyRate] = useState(3.0);
  const [nodeGoal, setNodeGoal] = useState(500);
  const [nodeRate, setNodeRate] = useState(3.5);

  const activeSpikes = bullishSpikes.filter((s) => s.active);

  const handleApplySpike = () => {
    if (!selectedUserId) return;
    const now = new Date();
    const expires = new Date(now.getTime() + durationHrs * 60 * 60 * 1000);
    const spike: BullishSpike = {
      targetUserId: selectedUserId,
      percentage: spikePct,
      durationHours: durationHrs,
      direction,
      label: label || "Admin override",
      active: true,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    addBullishSpike(spike);

    // Also update the node's daily rate
    const node = nodeGrowths[selectedUserId];
    if (node) {
      const adjustedRate = customDailyRate / 100;
      useProfitEngine.setState((state) => ({
        nodeGrowths: {
          ...state.nodeGrowths,
          [selectedUserId]: { ...node, dailyRate: adjustedRate },
        },
      }));
    }

    addAuditEntry({
      id: `audit-${Date.now()}`,
      time: new Date().toISOString(),
      actor: currentUser?.email ?? "admin",
      action: `BULLISH_SPIKE: ${spikePct}% for ${durationHrs}h on ${
        registeredUsers.find((u) => u.id === selectedUserId)?.email ??
        selectedUserId
      }`,
      target: selectedUserId,
      level: "success",
    });
  };

  const handleResolveSpike = (userId: string) => {
    resolveBullishSpike(userId);
    addAuditEntry({
      id: `audit-${Date.now()}`,
      time: new Date().toISOString(),
      actor: currentUser?.email ?? "admin",
      action: `BULLISH_SPIKE_RESOLVED: spike removed for user ${userId}`,
      target: userId,
      level: "warning",
    });
  };

  const handleApplyDailyRate = (rate: number) => {
    setCustomDailyRate(rate);
    if (selectedUserId) {
      const node = nodeGrowths[selectedUserId];
      if (node) {
        useProfitEngine.setState((state) => ({
          nodeGrowths: {
            ...state.nodeGrowths,
            [selectedUserId]: { ...node, dailyRate: rate / 100 },
          },
        }));
        addAuditEntry({
          id: `audit-${Date.now()}`,
          time: new Date().toISOString(),
          actor: currentUser?.email ?? "admin",
          action: `DAILY_RATE_UPDATE: ${rate}% for ${
            registeredUsers.find((u) => u.id === selectedUserId)?.email ??
            selectedUserId
          }`,
          target: selectedUserId,
          level: "action",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Spikes */}
      {activeSpikes.length > 0 && (
        <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
              Active Bullish Spikes
            </span>
            <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded-full text-[9px] font-mono font-bold text-emerald-400">
              {activeSpikes.length}
            </span>
          </div>
          <div className="space-y-2">
            {activeSpikes.map((s) => {
              const user = registeredUsers.find((u) => u.id === s.targetUserId);
              const remaining = Math.max(
                0,
                Math.floor(
                  (new Date(s.expiresAt).getTime() - Date.now()) /
                    (1000 * 60 * 60),
                ),
              );
              return (
                <div
                  key={s.targetUserId}
                  className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      {user?.email ?? s.targetUserId}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-xc-muted mt-0.5">
                      <span
                        className={cn(
                          "font-bold",
                          s.direction === "up"
                            ? "text-emerald-400"
                            : "text-red-400",
                        )}
                      >
                        {s.direction === "up" ? "+" : "-"}
                        {s.percentage}%
                      </span>
                      <span>{remaining}h remaining</span>
                      <span className="text-white/30">{s.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveSpike(s.targetUserId)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-bold transition"
                  >
                    Resolve
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Apply New Spike */}
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">
            Apply Bullish Spike
          </span>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Target User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white"
          >
            <option value="">Select user...</option>
            {registeredUsers
              .filter((u) => u.role !== "GOD_ADMIN")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email}) —{" "}
                  {formatCurrency(u.balance ?? 0)}
                </option>
              ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Spike %</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={spikePct}
                onChange={(e) => setSpikePct(Number(e.target.value))}
                min={1}
                max={500}
                className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={durationHrs}
                onChange={(e) => setDurationHrs(Number(e.target.value))}
                min={1}
                max={720}
                className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white"
              />
              <span className="text-xs text-gray-500">hours</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection("up")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition border",
                  direction === "up"
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/40"
                    : "bg-[#1a1a24] border-white/10 text-gray-400",
                )}
              >
                <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                Up
              </button>
              <button
                onClick={() => setDirection("down")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold transition border",
                  direction === "down"
                    ? "bg-red-600/20 text-red-400 border-red-600/40"
                    : "bg-[#1a1a24] border-white/10 text-gray-400",
                )}
              >
                <TrendingUp className="w-3.5 h-3.5 inline mr-1 rotate-180" />
                Down
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Tesla catalyst"
              className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        <button
          onClick={handleApplySpike}
          disabled={!selectedUserId}
          className={cn(
            "w-full py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2",
            selectedUserId
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-white/5 text-gray-500 cursor-not-allowed",
          )}
        >
          <Zap className="w-4 h-4" /> Apply {spikePct}% Bullish Spike
        </button>
      </div>

      {/* Daily Rate Override */}
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">
            Daily Profit Rate Override
          </span>
          <span className="text-[9px] text-xc-muted font-mono">
            A = P(1+r)^t
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {DAILY_RATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleApplyDailyRate(preset.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-bold transition",
                customDailyRate === preset.value
                  ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/40"
                  : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="number"
            value={customDailyRate}
            onChange={(e) => {
              const next = Math.min(15, Math.max(0.1, Number(e.target.value)));
              setCustomDailyRate(Number.isFinite(next) ? next : 3.0);
            }}
            step={0.1}
            min={0.1}
            max={15}
            className="w-24 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white text-center font-mono"
          />
          <span className="text-xs text-gray-400">
            % daily · Ladder ceiling 15% (Node VIII)
          </span>
        </div>

        {selectedUserId && (
          <div className="mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <p className="text-xs text-gray-400">
              Compound projection at {customDailyRate}%/day:
            </p>
            <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] font-mono">
              <div>
                <span className="text-white/30">24h</span>
                <p className="text-emerald-400 font-bold">
                  +{customDailyRate}%
                </p>
              </div>
              <div>
                <span className="text-white/30">7d</span>
                <p className="text-emerald-400 font-bold">
                  +{(Math.pow(1 + customDailyRate / 100, 7) - 1) * 100}%
                </p>
              </div>
              <div>
                <span className="text-white/30">30d</span>
                <p className="text-emerald-400 font-bold">
                  +{(Math.pow(1 + customDailyRate / 100, 30) - 1) * 100}%
                </p>
              </div>
              <div>
                <span className="text-white/30">90d</span>
                <p className="text-emerald-400 font-bold">
                  +{(Math.pow(1 + customDailyRate / 100, 90) - 1) * 100}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Node Advancement Ladder — Ground Station goal + rate control */}
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">
            Node Advancement Ladder
          </span>
          <span className="text-[9px] text-xc-muted font-mono">
            NODE to NODE
          </span>
        </div>
        <p className="text-[11px] text-gray-400 -mt-2">
          Set the funding goal a user must reach to upgrade to the next node,
          and the exact daily rate that upgrade unlocks. The growth engine
          honors these values immediately — balance climbs higher, rate climbs
          with them.
        </p>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Funding Goal ($)
          </label>
          <input
            type="number"
            value={nodeGoal}
            onChange={(e) => setNodeGoal(Number(e.target.value))}
            min={0}
            className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Daily Rate Unlocked (%)
          </label>
          <input
            type="number"
            value={nodeRate}
            onChange={(e) =>
              setNodeRate(
                Math.min(15, Math.max(0.1, Number(e.target.value))),
              )
            }
            step={0.1}
            min={0.1}
            max={15}
            className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            Max 15%/day — Node VIII (Sovereign) ceiling.
          </p>
        </div>

        <button
          onClick={() => {
            if (!selectedUserId) return;
            const user = registeredUsers.find(
              (u) => u.id === selectedUserId,
            );
            const goal = Math.max(0, Number(nodeGoal));
            const rate = Math.min(15, Math.max(0.1, Number(nodeRate)));
            updateUserById(selectedUserId, {
              nodeTier: user?.nodeTier ?? 1,
              nodeGoal: goal,
              nextNodeRate: rate,
            });
            // Apply the new rate to the live engine node immediately
            const node = nodeGrowths[selectedUserId];
            if (node) {
              useProfitEngine.setState((state) => ({
                nodeGrowths: {
                  ...state.nodeGrowths,
                  [selectedUserId]: { ...node, dailyRate: rate / 100 },
                },
              }));
            }
            addAuditEntry({
              id: `audit-${Date.now()}`,
              time: new Date().toISOString(),
              actor: currentUser?.email ?? "admin",
              action: `NODE_GOAL_SET: ${formatCurrency(goal)} → ${rate}%/day for ${
                registeredUsers.find((u) => u.id === selectedUserId)?.email ??
                selectedUserId
              }`,
              target: selectedUserId,
              level: "action",
            });
          }}
          disabled={!selectedUserId}
          className={cn(
            "w-full py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2",
            selectedUserId
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-white/5 text-gray-500 cursor-not-allowed",
          )}
        >
          <TrendingUp className="w-4 h-4" /> Set Node Goal
        </button>

        {selectedUserId &&
          (() => {
            const user = registeredUsers.find(
              (u) => u.id === selectedUserId,
            );
            const balance = Number(user?.balance ?? 0);
            const prog = getNodeProgress(balance, user);
            return (
              <div className="mt-1 space-y-3">
                <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                      Current node
                    </span>
                    <span
                      className={cn(
                        "text-sm font-black",
                        prog.current.color,
                      )}
                    >
                      {prog.current.code} · {prog.current.dailyRatePct}%/day
                    </span>
                  </div>
                  {prog.next ? (
                    <>
                      <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                          style={{
                            width: `${Math.min(100, prog.progress * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400">
                        <span className="text-emerald-400 font-bold">
                          {formatCurrency(Math.max(0, prog.remaining))}
                        </span>{" "}
                        to {prog.next.code} → unlocks{" "}
                        {prog.next.dailyRatePct}%/day
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[11px] text-emerald-400">
                      MAX TIER REACHED
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {NODE_LADDER.map((n) => {
                    const isCurrent = n.tier === prog.current.tier;
                    const isNext = prog.next?.tier === n.tier;
                    return (
                      <div
                        key={n.tier}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-center",
                          isCurrent &&
                            "border-emerald-600/40 bg-emerald-950/40",
                          isNext && "border-cyan-600/40 bg-cyan-950/30",
                          !isCurrent &&
                            !isNext &&
                            "border-white/[0.06] bg-white/[0.02]",
                        )}
                      >
                        <div
                          className={cn(
                            "text-[9px] font-black",
                            isCurrent ? n.color : "text-white/40",
                          )}
                        >
                          {n.code}
                        </div>
                        <div className="text-[9px] font-mono text-white/30">
                          {n.dailyRatePct}%/d
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
