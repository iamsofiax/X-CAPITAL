"use client";

import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ListedMark, markClass } from "@/components/desk/ListedMark";
import { useLiveYield } from "@/hooks/useLiveYield";
import { fmtPct, fmtUsdc } from "@/lib/sim/format";

const SLEEVES = [
  { id: "NVDA", name: "NVIDIA", line: "Equity sleeve", weight: 0.34, edge: 1.22, color: "#76b900" },
  { id: "TSLA", name: "Tesla", line: "Equity sleeve", weight: 0.28, edge: 1.08, color: "#e31937" },
  { id: "SPACEX", name: "SpaceX", line: "Private sleeve", weight: 0.22, edge: 0.96, color: "#f4f4f5" },
  { id: "XAI", name: "xAI", line: "Private sleeve", weight: 0.16, edge: 0.74, color: "#a78bfa" },
] as const;

export function PnlBoard() {
  const { live, posted, fleetPending, rate, weekly, active, mandate, now } = useLiveYield();

  const funded = posted > 0 && (active || fleetPending > 0);
  const principal = posted > 0 ? posted : 0;
  const daily = funded ? rate : 0;
  const net = live - posted;
  const profit = Math.max(net, 0);
  const loss = Math.max(-net, 0);
  const ret = principal > 0 ? net / principal : 0;
  const operated = mandate?.operatedPct ?? 0;
  const money = net !== 0 ? 4 : 2;

  const points = useMemo(() => buildPath(net), [net]);
  const ranked = useMemo(() => {
    const mix = SLEEVES.reduce((sum, s) => sum + s.weight * s.edge, 0);
    return SLEEVES.map((s) => {
      const sleeveNet = net * ((s.weight * s.edge) / mix);
      const base = principal * s.weight;
      return {
        ...s,
        net: sleeveNet,
        profit: Math.max(sleeveNet, 0),
        loss: Math.max(-sleeveNet, 0),
        ret: base > 0 ? sleeveNet / base : 0,
      };
    }).sort((a, b) => b.ret - a.ret);
  }, [net, principal]);

  const profitShare = profit + loss > 0 ? (profit / (profit + loss)) * 100 : 0;

  return (
    <section className="pnl-board space-y-4" aria-label="Profit and loss">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="sim-label text-emerald-300/80">Profit and loss</p>
          <h2 className="mt-1 text-xl md:text-2xl font-black tracking-tight text-white">Book result</h2>
        </div>
        <p className="text-[12px] text-white/45 max-w-sm sm:text-right">
          {funded
            ? `${operated}% operated · ${daily.toFixed(2)}% a day · ${weekly.toFixed(2)}% this week. Node ${fmtUsdc(live, { decimals: 4 })}.`
            : "Starts at zero. The result moves with the node balance only after this account is funded and growth is on."}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Card kicker="Net P&L" value={`${net >= 0 ? "+" : "−"}${fmtUsdc(Math.abs(net), { decimals: money })}`} hint="Open gain on the node balance" tone={net >= 0 ? "pos" : "neg"} />
        <Card kicker="Gross profit" value={`+${fmtUsdc(profit, { decimals: money })}`} hint="Same clock as the node" tone="pos" />
        <Card kicker="Loss" value={`−${fmtUsdc(loss, { decimals: money })}`} hint="Posted only when the book gives some back" tone="neg" />
        <Card kicker="Return" value={fmtPct(ret, 2)} hint={principal > 0 ? "On the funded node balance" : "Zero until the node is funded"} tone={ret >= 0 ? "pos" : "neg"} />
      </div>

      <div className="pnl-split" aria-hidden>
        <span style={{ width: `${profitShare}%` }} />
        <span style={{ width: `${100 - profitShare}%` }} />
      </div>

      <div className="grid lg:grid-cols-5 gap-3">
        <div className="pnl-stage lg:col-span-3 min-w-0">
          <div className="flex items-center justify-between gap-3 px-4 pt-4 md:px-5">
            <p className="sim-label">Cumulative result</p>
            <p className="text-[11px] font-mono text-white/40">
              {now > 0 ? `Live ${new Date(now).toLocaleTimeString()}` : "Live"} · node {fmtUsdc(live, { decimals: money })}
            </p>
          </div>
          <div className="pnl-stage-grid h-56 sm:h-64 px-1 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pnl-net" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis
                  width={58}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                  tickFormatter={(v) => fmtUsdc(Number(v), { compact: true })}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(110,231,183,0.35)" }}
                  content={({ active: on, payload }) => {
                    if (!on || !payload?.length) return null;
                    const row = payload[0].payload as { net: number; loss: number };
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#050608]/95 px-3 py-2 text-[11px] font-mono shadow-xl">
                        <p className={row.net >= 0 ? "text-emerald-300" : "text-red-300"}>
                          Net {row.net >= 0 ? "+" : "−"}{fmtUsdc(Math.abs(row.net), { decimals: 4 })}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="net" stroke="#6ee7b7" strokeWidth={2.25} fill="url(#pnl-net)" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pnl-stage p-4 md:p-5 lg:col-span-2">
          <p className="sim-label mb-4">Asset allocation</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <Donut sleeves={SLEEVES} />
            <ul className="flex-1 space-y-3 min-w-0">
              {SLEEVES.map((s) => (
                <li key={s.id} className="min-w-0">
                  <div className="flex items-center gap-2.5 text-[12px]">
                    <ListedMark symbol={s.id} name={s.name} cls={markClass(s.id)} size="sm" />
                    <span className="flex-1 truncate text-white/85 font-medium">{s.name}</span>
                    <span className="font-mono text-white/55">{(s.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${s.weight * 100}%`, background: s.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="pnl-stage p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="sim-label">Top performing assets</p>
          <p className="text-[11px] text-white/35">NVIDIA · Tesla · SpaceX · xAI</p>
        </div>
        <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {ranked.map((s, i) => (
            <li key={s.id} className="pnl-sleeve" style={{ ["--sleeve" as string]: s.color }}>
              <div className="relative flex items-center gap-3">
                <ListedMark symbol={s.id} name={s.name} cls={markClass(s.id)} />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono tracking-[0.16em] text-white/35">0{i + 1}</p>
                  <p className="text-sm font-bold text-white truncate">{s.name}</p>
                  <p className="text-[11px] text-white/40">{s.line} · {(s.weight * 100).toFixed(0)}%</p>
                </div>
              </div>
              <p className={`relative mt-4 text-[1.7rem] font-black tabular-nums tracking-tight ${s.net >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {fmtPct(s.ret, 2)}
              </p>
              <dl className="relative mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <dt className="text-white/35">Profit</dt>
                  <dd className="font-mono text-emerald-200">+{fmtUsdc(s.profit, { decimals: money })}</dd>
                </div>
                <div>
                  <dt className="text-white/35">Loss</dt>
                  <dd className="font-mono text-red-300">−{fmtUsdc(s.loss, { decimals: money })}</dd>
                </div>
              </dl>
              <div className="pnl-split relative mt-3">
                <span style={{ width: s.net > 0 ? "100%" : "0%" }} />
                <span style={{ width: s.net < 0 ? "100%" : "0%" }} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Card({
  kicker,
  value,
  hint,
  tone,
}: {
  kicker: string;
  value: string;
  hint: string;
  tone: "pos" | "neg";
}) {
  return (
    <article className={`pnl-card ${tone === "pos" ? "pnl-card-pos" : "pnl-card-neg"}`}>
      <p className="sim-label">{kicker}</p>
      <p className={`pnl-figure ${tone === "pos" ? "text-emerald-300" : "text-red-300"}`}>{value}</p>
      <p className="mt-2 text-[12px] text-white/40">{hint}</p>
    </article>
  );
}

function Donut({ sleeves }: { sleeves: typeof SLEEVES }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
      {sleeves.map((s) => {
        const len = c * s.weight - 3;
        const el = (
          <circle
            key={s.id}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${Math.max(len, 0)} ${c - Math.max(len, 0)}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
          />
        );
        offset += c * s.weight;
        return el;
      })}
      <text x="60" y="57" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">100%</text>
      <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.42)" fontSize="8" letterSpacing="1.4">SLEEVES</text>
    </svg>
  );
}

function buildPath(net: number) {
  const steps = 48;
  const rows: { t: number; net: number; loss: number }[] = [{ t: 0, net: 0, loss: 0 }];
  for (let i = 1; i < steps; i++) {
    const value = net * (i / (steps - 1));
    rows.push({ t: i, net: value, loss: Math.max(-value, 0) });
  }
  return rows;
}
