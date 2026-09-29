"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/sim/Panel";
import { useSim } from "@/hooks/useSim";
import { useStore } from "@/store/useStore";
import { listReceipts, type TradeReceipt as Slip } from "@/lib/yieldDesk";
import { TradeReceipt } from "@/components/desk/TradeReceipt";
import { VAULT_BY_ID, navAt } from "@/lib/sim/vaults";
import { INSTRUMENTS, INSTRUMENT_BY_SYMBOL, type Instrument } from "@/lib/sim/instruments";
import { useSimQuotes } from "@/hooks/useSimQuotes";
import { CATALOG_BY_SKU, incomePerMinute } from "@/lib/commerceDesk";
import { LiveBook } from "@/components/desk/LiveBook";
import { YieldWatch } from "@/components/desk/YieldWatch";
import { useLiveYield } from "@/hooks/useLiveYield";
import { fmtUsdc, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

export default function BookPage() {
  return (
    <DashboardLayout title="Book" subtitle="Profit and loss, allocation, and lead sleeves" requireGenesis>
      <Book />
    </DashboardLayout>
  );
}

function Book() {
  const { account, metrics, epoch } = useSim();
  const { quotes, liveCount } = useSimQuotes();
  const { active } = useLiveYield();
  const userId = useStore((s) => s.user?.id);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [openSlip, setOpenSlip] = useState<Slip | null>(null);

  useEffect(() => {
    const pull = () => {
      const next = userId ? listReceipts(userId).slice(0, 8) : [];
      setSlips((prev) =>
        prev.length === next.length && prev.every((row, i) => row.id === next[i]?.id)
          ? prev
          : next,
      );
    };
    pull();
    const id = window.setInterval(pull, 5000);
    window.addEventListener("xc-yield", pull);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("xc-yield", pull);
    };
  }, [userId]);

  const sleeves = useMemo(() => {
    if (!account || !metrics) return [];
    const rows: { id: string; label: string; kind: string; value: number; cost: number; color: string }[] = [];
    for (const [id, p] of Object.entries(account.vaults)) {
      const spec = VAULT_BY_ID[id];
      if (!spec) continue;
      rows.push({ id, label: spec.name, kind: spec.kind === "rwa" ? "RWA" : "Vault", value: p.shares * navAt(id, epoch), cost: p.costBasis, color: spec.accent });
    }
    for (const [sym, p] of Object.entries(account.positions)) {
      const mark = account.marks[sym] ?? p.avgCost;
      rows.push({ id: sym, label: `${sym} · ${INSTRUMENT_BY_SYMBOL[sym]?.name ?? ""}`, kind: "Spot", value: p.qty * mark, cost: p.qty * p.avgCost, color: "#22d3ee" });
    }
    if (account.fleet && account.fleet.units > 0) {
      rows.push({
        id: "fleet",
        label: `Robotaxi fleet · ${account.fleet.units}`,
        kind: "Fleet",
        value: account.fleet.cost,
        cost: account.fleet.cost,
        color: "#34d399",
      });
    }
    for (const h of account.commerce ?? []) {
      const item = CATALOG_BY_SKU[h.sku];
      rows.push({
        id: h.sku,
        label: item ? `${item.name} · ${h.qty}` : h.sku,
        kind: "Atelier",
        value: h.cost,
        cost: h.cost,
        color: "#93c5fd",
      });
    }
    rows.push({ id: "cash", label: "Cash USD", kind: "Cash", value: account.cash, cost: account.cash, color: "#64748b" });
    return rows.sort((a, b) => b.value - a.value);
  }, [account, metrics, epoch]);

  if (!account || !metrics) {
    return (
      <div className="sim-glass p-6 text-sm text-white/55">
        Opening the book
      </div>
    );
  }
  const total = metrics.nav || 1;

  return (
    <div className="space-y-5">
      <LiveBook />
      <BookTape quotes={quotes} liveCount={liveCount} />
      <YieldWatch />
      <Panel code="Settlements" title="Receipts" edge>
        {slips.length === 0 ? (
          <p className="text-sm text-white/45">
            {active ? "A settlement slip prints at the end of each fill." : "Slips print after the desk activates the node and a fill is made."}
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {slips.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setOpenSlip(s)} className="pnl-sleeve w-full text-left">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">{s.side} {s.symbol}</span>
                    <span className="font-mono text-[11px] text-white/45">{s.id}</span>
                  </span>
                  <span className="mt-1 block text-[12px] text-white/55">{fmtUsdc(s.notional)} · {new Date(s.at).toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {openSlip && <TradeReceipt slip={openSlip} onClose={() => setOpenSlip(null)} />}
      </Panel>
      <Panel code="Holdings" title="Portfolio" edge bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left">
            <thead>
              <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                <th className="font-normal px-5 py-3">Holding</th>
                <th className="font-normal px-3 py-3">Sleeve</th>
                <th className="font-normal px-3 py-3 text-right">Market value</th>
                <th className="font-normal px-3 py-3 text-right">Cost</th>
                <th className="font-normal px-3 py-3 text-right">Gain</th>
                <th className="font-normal px-5 py-3 text-right">Weight</th>
              </tr>
            </thead>
            <tbody className="sim-num text-[12px]">
              {sleeves.map((s) => {
                const pnl = s.value - s.cost;
                const weight = (s.value / total) * 100;
                return (
                  <tr key={s.id} className="border-b border-white/[0.04]">
                    <td className="px-5 py-3">
                      <span className="text-white font-semibold">{s.label}</span>
                      {s.id === "fleet" && account.fleet && (
                        <span className="block text-[10px] text-emerald-300/80 font-sans">
                          +{fmtUsdc(incomePerMinute(account.fleet.cost), { decimals: 4 })} USD / minute
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-white/45">{s.kind}</td>
                    <td className="px-3 py-3 text-right text-white">{fmtUsdc(s.value)}</td>
                    <td className="px-3 py-3 text-right text-white/55">{fmtUsdc(s.cost)}</td>
                    <td className={cn("px-3 py-3 text-right", s.kind === "Cash" || s.kind === "Fleet" || s.kind === "Atelier" ? "text-white/40" : signClass(pnl))}>
                      {s.kind === "Cash" || s.kind === "Fleet" || s.kind === "Atelier" ? "—" : `${pnl >= 0 ? "+" : ""}${fmtUsdc(pnl)}`}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-white/70">{weight.toFixed(1)}%</span>
                      <span className="mt-1 block h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, weight)}%`, background: s.color }} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

const ACTIVE_SLEEVES = [
  { id: "NVDA", name: "NVIDIA", line: "Equity sleeve", symbol: "NVDA" },
  { id: "TSLA", name: "Tesla", line: "Equity sleeve", symbol: "TSLA" },
  { id: "SPACEX", name: "SpaceX", line: "Private sleeve", symbol: "SPACEX" },
  { id: "XAI", name: "xAI", line: "Private sleeve", symbol: "XAI" },
] as const;

const TAPE_PAGE = 36;

function BookTape({
  quotes,
  liveCount,
}: {
  quotes: Record<string, { mid: number; change24h: number; source: string } | undefined>;
  liveCount: number;
}) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(TAPE_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const listed = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return INSTRUMENTS;
    return INSTRUMENTS.filter(
      (inst) => inst.symbol.toLowerCase().includes(needle) || inst.name.toLowerCase().includes(needle),
    );
  }, [query]);

  useEffect(() => {
    setVisible(TAPE_PAGE);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [query]);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || visible >= listed.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((count) => Math.min(listed.length, count + TAPE_PAGE));
        }
      },
      { root, rootMargin: "280px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [listed.length, visible]);

  const rows = listed.slice(0, visible);

  return (
    <Panel code="Tape" title={`${INSTRUMENTS.length} listed names`} edge bodyClassName="p-0">
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <p className="text-[12px] leading-relaxed text-white/50">
          {liveCount} names with a market print. The rest show their reference mark. NVIDIA, Tesla, SpaceX, and xAI stay active on every account.
        </p>
        <label className="mt-3 block">
          <span className="sr-only">Find a listed name</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a name or symbol"
            autoComplete="off"
            enterKeyHint="search"
            className="sim-input w-full text-[16px] sm:text-[13px]"
          />
        </label>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Active on every account">
          {ACTIVE_SLEEVES.map((sleeve) => {
            const quote = sleeve.symbol === "NVDA" || sleeve.symbol === "TSLA" ? quotes[sleeve.symbol] : undefined;
            return (
              <li key={sleeve.id} className="flex min-w-0 items-center gap-2 border border-white/12 bg-[#070b09] px-2 py-2">
                {sleeve.symbol === "SPACEX" || sleeve.symbol === "XAI" ? (
                  <PrivatePlate label={sleeve.symbol === "SPACEX" ? "SX" : "xAI"} />
                ) : (
                  <ListedMark symbol={sleeve.symbol} name={sleeve.name} cls="equity" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-white">{sleeve.name}</p>
                  <p className="truncate text-[10px] uppercase tracking-[0.12em] text-white/45">Active</p>
                  {quote ? (
                    <p className="truncate text-[11px] tabular-nums text-white">
                      {fmtUsdc(quote.mid, { decimals: quote.mid >= 100 ? 2 : 4 })}
                      <span className={cn("ml-1", signClass(quote.change24h))}>
                        {quote.change24h >= 0 ? "+" : ""}
                        {quote.change24h.toFixed(2)}%
                      </span>
                    </p>
                  ) : (
                    <p className="truncate text-[11px] text-white/55">{sleeve.line}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div ref={scrollRef} className="mt-3 max-h-[min(70vh,34rem)] overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#121816] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/40 sm:px-4">
          <span>{listed.length} names</span>
          <span>Last · session</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-[13px] text-white/45 sm:px-4">No listed name matches.</p>
        ) : (
          <ul>
            {rows.map((inst) => (
              <TapeRow key={inst.symbol} inst={inst} quote={quotes[inst.symbol]} />
            ))}
            {visible < listed.length && <li ref={sentinelRef} className="h-8" aria-hidden />}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function TapeRow({
  inst,
  quote,
}: {
  inst: Instrument;
  quote: { mid: number; change24h: number; source: string } | undefined;
}) {
  const change = quote?.change24h ?? 0;
  return (
    <li
      className="flex items-center gap-3 border-t border-white/10 px-3 py-2.5 sm:px-4"
      style={{ contentVisibility: "auto", containIntrinsicSize: "3.5rem" }}
    >
      <ListedMark symbol={inst.symbol} name={inst.name} cls={inst.cls} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight text-white">{inst.symbol}</p>
        <p className="truncate text-[11px] leading-tight text-white/45">{inst.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[13px] font-medium tabular-nums leading-tight text-white">
          {quote ? fmtUsdc(quote.mid, { decimals: quote.mid >= 100 ? 2 : 4 }) : "—"}
        </p>
        <p className={cn("text-[11px] tabular-nums leading-tight", quote ? signClass(change) : "text-white/35")}>
          {quote ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—"}
          <span className="ml-1 text-[9px] uppercase tracking-[0.12em] text-white/35">
            {quote?.source === "LIVE" ? "Last" : "Ref"}
          </span>
        </p>
      </div>
    </li>
  );
}

function PrivatePlate({ label }: { label: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-[10px] font-black tracking-tight text-[#111816]">
      {label}
    </span>
  );
}

function ListedMark({ symbol, name, cls }: { symbol: string; name: string; cls: string }) {
  const sources = useMemo(() => markSources(symbol, cls), [symbol, cls]);
  const [index, setIndex] = useState(0);
  const failed = index >= sources.length;
  const letters = (symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 3) || name.slice(0, 2)).toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white" title={name}>
      {failed ? (
        <span className="text-[9px] font-black tracking-tight text-[#111816]">{letters}</span>
      ) : (
        <img
          src={sources[index]}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-7 w-7 object-contain"
          onError={() => setIndex((n) => n + 1)}
        />
      )}
    </span>
  );
}

function markSources(symbol: string, cls: string): string[] {
  if (cls === "crypto") {
    const slug = symbol.toLowerCase();
    return [
      `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@0.18.1/svg/color/${slug}.svg`,
      `https://cdn.jsdelivr.net/gh/davidepalazzo/ticker-logos/crypto_icons/${symbol}.png`,
    ];
  }
  const dashed = symbol.replace(/\./g, "-");
  return [
    `https://cdn.jsdelivr.net/gh/davidepalazzo/ticker-logos/ticker_icons/${symbol}.png`,
    `https://cdn.jsdelivr.net/gh/davidepalazzo/ticker-logos/ticker_icons/${dashed}.png`,
    `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol)}`,
    `https://financialmodelingprep.com/image-stock/${encodeURIComponent(dashed)}.png`,
  ];
}
