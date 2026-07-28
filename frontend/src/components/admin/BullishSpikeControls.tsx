"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useProfitEngine, type BullishSpike } from "@/store/useProfitEngine";
import { cn, formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Zap,
  Flame,
  Activity,
} from "lucide-react";

const DAILY_RATE_PRESETS = [
  { label: "Base 1.5%", value: 1.5 },
  { label: "Boosted 3.0%", value: 3.0 },
  { label: "Aggressive 5.0%", value: 5.0 },
  { label: "Max 10.0%", value: 10.0 },
];

export default function BullishSpikeControls() {
  const { registeredUsers, addAuditEntry, user: currentUser } = useStore();
  const { bullishSpikes, addBullishSpike, resolveBullishSpike, nodeGrowths } = useProfitEngine();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [spikePct, setSpikePct] = useState(15);
  const [durationHrs, setDurationHrs] = useState(24);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [label, setLabel] = useState("Bullish spike");
  const [customDailyRate, setCustomDailyRate] = useState(1.5);

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
      action: `BULLISH_SPIKE: ${spikePct}% for ${durationHrs}h on ${registeredUsers.find((u) => u.id === selectedUserId)?.email ?? selectedUserId}`,
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
          action: `DAILY_RATE_UPDATE: ${rate}% for ${registeredUsers.find((u) => u.id === selectedUserId)?.email ?? selectedUserId}`,
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
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Active Bullish Spikes</span>
            <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded-full text-[9px] font-mono font-bold text-emerald-400">
              {activeSpikes.length}
            </span>
          </div>
          <div className="space-y-2">
            {activeSpikes.map((s) => {
              const user = registeredUsers.find((u) => u.id === s.targetUserId);
              const remaining = Math.max(0, Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
              return (
                <div key={s.targetUserId} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-white">{user?.email ?? s.targetUserId}</div>
                    <div className="flex items-center gap-3 text-xs text-xc-muted mt-0.5">
                      <span className={cn("font-bold", s.direction === "up" ? "text-emerald-400" : "text-red-400")}>
                        {s.direction === "up" ? "+" : "-"}{s.percentage}%
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
          <span className="text-sm font-semibold text-white">Apply Bullish Spike</span>
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
                  {u.firstName} {u.lastName} ({u.email}) — {formatCurrency(u.balance ?? 0)}
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

      {/* Custom Daily Rate */}
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Daily Profit Rate Override</span>
          <span className="text-[9px] text-xc-muted font-mono">A = P(1+r)^t</span>
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

        <div className="flex items-center gap-3">
          <input
            type="number"
            value={customDailyRate}
            onChange={(e) => setCustomDailyRate(Number(e.target.value))}
            step={0.1}
            min={0.1}
            max={50}
            className="w-24 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white text-center font-mono"
          />
          <span className="text-xs text-gray-400">% daily · Applied to selected node</span>
        </div>

        {selectedUserId && (
          <div className="mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <p className="text-xs text-gray-400">
              Compound projection for selected user at {customDailyRate}%/day:
            </p>
            <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] font-mono">
              <div>
                <span className="text-white/30">24h</span>
                <p className="text-emerald-400 font-bold">+{customDailyRate}%</p>
              </div>
              <div>
                <span className="text-white/30">7d</span>
                <p className="text-emerald-400 font-bold">+{(Math.pow(1 + customDailyRate / 100, 7) - 1) * 100}%</p>
              </div>
              <div>
                <span className="text-white/30">30d</span>
                <p className="text-emerald-400 font-bold">+{(Math.pow(1 + customDailyRate / 100, 30) - 1) * 100}%</p>
              </div>
              <div>
                <span className="text-white/30">90d</span>
                <p className="text-emerald-400 font-bold">+{(Math.pow(1 + customDailyRate / 100, 90) - 1) * 100}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
