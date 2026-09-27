"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NavPoint } from "@/lib/sim/types";
import { epochStart } from "@/lib/sim/clock";
import { fmtUsdc } from "@/lib/sim/format";

export function NavChart({ history, height = 220 }: { history: NavPoint[]; height?: number }) {
  if (history.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-white/35">
        NAV history starts after your first settled epoch.
      </div>
    );
  }
  const up = history[history.length - 1].nav >= history[0].nav;
  const color = up ? "#34d399" : "#f87171";
  const data = history.map((p) => ({ epoch: p.epoch, nav: p.nav }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nav-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="epoch"
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            tickFormatter={(e) => `E${e}`}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            tickFormatter={(v) => fmtUsdc(v, { compact: true })}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={["auto", "auto"]}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.15)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { epoch: number; nav: number };
              return (
                <div className="rounded-xl border border-white/10 bg-[#050608]/95 px-3 py-2 sim-num text-[11px]">
                  <p className="text-white/50">Epoch {p.epoch} · {new Date(epochStart(p.epoch)).toUTCString().slice(5, 22)}</p>
                  <p className="text-white font-bold">{fmtUsdc(p.nav)} USD</p>
                </div>
              );
            }}
          />
          <Area dataKey="nav" stroke={color} strokeWidth={1.75} fill="url(#nav-fill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
