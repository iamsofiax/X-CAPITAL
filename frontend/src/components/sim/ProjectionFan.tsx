"use client";

import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { projectBook, type ProjectionInput } from "@/lib/sim/projection";
import { fmtPct, fmtUsdc } from "@/lib/sim/format";

function FanTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { days: number; p10: number; p50: number; p90: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[#050608]/95 px-3 py-2 sim-num text-[11px] space-y-0.5">
      <p className="text-white/50">Day {p.days}</p>
      <p className="sim-pos">P90 {fmtUsdc(p.p90)}</p>
      <p className="text-white">P50 {fmtUsdc(p.p50)}</p>
      <p className="sim-neg">P10 {fmtUsdc(p.p10)}</p>
    </div>
  );
}

export function ProjectionFan({
  input,
  height = 240,
}: {
  input: ProjectionInput;
  height?: number;
}) {
  const points = useMemo(() => projectBook(input), [input]);
  const start = points[0]?.p50 ?? 0;
  const last = points[points.length - 1];
  const data = points.map((p) => ({
    days: Math.round(p.days),
    base: p.p10,
    band: Math.max(0, p.p90 - p.p10),
    p10: p.p10,
    p50: p.p50,
    p90: p.p90,
  }));

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fan" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.12} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="days"
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
              tickFormatter={(d) => `${d}d`}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
              tickFormatter={(v) => fmtUsdc(v, { compact: true })}
              axisLine={false}
              tickLine={false}
              width={56}
              domain={["auto", "auto"]}
            />
            <Tooltip cursor={{ stroke: "rgba(255,255,255,0.15)" }} content={<FanTooltip />} />
            <Area dataKey="base" stackId="fan" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area dataKey="band" stackId="fan" stroke="none" fill="url(#fan)" isAnimationActive={false} />
            <Line dataKey="p90" stroke="rgba(52,211,153,0.45)" strokeDasharray="3 4" dot={false} strokeWidth={1} isAnimationActive={false} />
            <Line dataKey="p10" stroke="rgba(248,113,113,0.5)" strokeDasharray="3 4" dot={false} strokeWidth={1} isAnimationActive={false} />
            <Line dataKey="p50" stroke="#e5e7eb" dot={false} strokeWidth={1.75} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {last && start > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {([
            ["P10 · bad case", last.p10],
            ["P50 · median", last.p50],
            ["P90 · good case", last.p90],
          ] as const).map(([label, v]) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <p className="sim-label text-[8.5px]">{label}</p>
              <p className="sim-num text-[13px] text-white font-bold">{fmtUsdc(v, { compact: true })}</p>
              <p className={`sim-num text-[10px] ${v >= start ? "sim-pos" : "sim-neg"}`}>{fmtPct(v / start - 1, 1)}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-white/35 mt-3 leading-relaxed">
        {input.paths ?? 400} Monte Carlo paths of the published vault models, each with its own regime chain.
        This is a model distribution of the published sleeve assumptions. It is not a forecast, an offer, or a promise of return.
      </p>
    </div>
  );
}
