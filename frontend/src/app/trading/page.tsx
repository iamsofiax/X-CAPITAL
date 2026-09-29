"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Radio } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel, Notice } from "@/components/sim/Panel";
import { useSim } from "@/hooks/useSim";
import { useStore } from "@/store/useStore";
import { nodeActivated, nodeFace, nodeFaceLine, nodeFaceTitle, pushNotice, readMandate, saveReceipt, tradesPaused, type TradeReceipt as Slip } from "@/lib/yieldDesk";
import { TradeReceipt } from "@/components/desk/TradeReceipt";
import { RaiseCash } from "@/components/desk/RaiseCash";
import { useSimQuotes } from "@/hooks/useSimQuotes";
import { ListedMark, markClass } from "@/components/desk/ListedMark";
import { INSTRUMENTS, INSTRUMENT_BY_SYMBOL, type InstrumentClass } from "@/lib/sim/instruments";
import { nodeTradeFill } from "@/lib/nodeTrade";
import { fmtNum, fmtPct, fmtPrice, fmtUsdc, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

const CLASSES: { id: InstrumentClass | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Digital assets" },
  { id: "equity", label: "Equities" },
  { id: "etf", label: "ETFs" },
];

export default function ExecutionPage() {
  return (
    <DashboardLayout title="Execution" subtitle="R2 · Spot fills at bid/ask · spread feeds the protocol fee pool" wide requireGenesis>
      <Execution />
    </DashboardLayout>
  );
}

function Execution() {
  const { account, actions, metrics } = useSim();
  const userId = useStore((s) => s.user?.id);
  const { quotes, liveCount, markedCount } = useSimQuotes();
  const [cls, setCls] = useState<InstrumentClass | "all">("all");
  const [symbol, setSymbol] = useState("BTC");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [slip, setSlip] = useState<Slip | null>(null);
  const [liveNode, setLiveNode] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const pull = () => {
      const mandate = userId ? readMandate(userId) : null;
      setPaused(tradesPaused(mandate));
      setLiveNode(nodeActivated(mandate) && !tradesPaused(mandate));
    };
    pull();
    window.addEventListener("xc-yield", pull);
    return () => window.removeEventListener("xc-yield", pull);
  }, [userId]);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("symbol");
    if (s && INSTRUMENT_BY_SYMBOL[s]) setSymbol(s);
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return INSTRUMENTS.filter((i) => {
      if (cls !== "all" && i.cls !== cls) return false;
      if (!s) return true;
      return i.symbol.toLowerCase().includes(s) || i.name.toLowerCase().includes(s) || i.sector.toLowerCase().includes(s);
    });
  }, [cls, q]);
  const pageSize = 20;
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const view = list.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const inst = INSTRUMENT_BY_SYMBOL[symbol];
  const quote = quotes[symbol];
  const pos = account?.positions[symbol];
  const value = Number(amount) || 0;

  if (!account || !quote) {
    return (
      <div className="sim-glass p-6 text-sm text-white/55">
        Opening the book
      </div>
    );
  }

  const preview =
    side === "BUY"
      ? { qty: value / quote.ask, notional: value, spread: (value / quote.ask) * (quote.ask - quote.mid) }
      : { qty: value, notional: value * quote.bid, spread: value * (quote.mid - quote.bid) };

  const submit = () => {
    setMsg(null);
    if (paused || account.tradingHalted) {
      setMsg({ tone: "error", text: "This node is halted. Fills stay closed until the desk reopens it." });
      return;
    }
    if (!liveNode) {
      setMsg({ tone: "error", text: "Execution opens when the desk takes this node live." });
      return;
    }
    const res = actions.trade(quote, side, side === "BUY" ? { notional: value } : { qty: value });
    if (res.ok) {
      const fillPx = side === "BUY" ? quote.ask : quote.bid;
      const text = `${side === "BUY" ? "Bought" : "Sold"} ${fmtNum(preview.qty, 6)} ${symbol} @ ${fmtPrice(fillPx)} (${quote.source}).`;
      setMsg({ tone: "success", text });
      if (userId) {
        const saved = saveReceipt({
          userId,
          side,
          symbol,
          name: inst.name,
          qty: preview.qty,
          price: fillPx,
          notional: preview.notional,
          spread: preview.spread,
        });
        setSlip(saved);
        pushNotice(userId, side === "SELL" ? "Settlement receipt" : "Fill receipt", `${saved.id} · ${text}`);
      }
      setAmount("");
    } else {
      setMsg({ tone: "error", text: res.error });
    }
  };

  const positions = Object.entries(account.positions);

  const fill = nodeTradeFill(account);
  const face = nodeFace(
    userId ? readMandate(userId) : null,
    metrics?.nav ?? account.cash,
    paused || !!account.tradingHalted,
  );

  return (
    <div className="space-y-5">
      {face !== "live" && (
        <section className="sim-glass p-4 md:p-5">
          <p className="sim-label">{nodeFaceTitle(face)}</p>
          <p className="mt-1 text-sm text-white/70">{nodeFaceLine(face)}</p>
        </section>
      )}
      <section className="sim-glass p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="sim-label">Node trade</p>
            <p className="mt-1 text-sm text-white/70">
              {fill >= 0.999
                ? "Filled 100%. Treasury can release a withdrawal."
                : `${(fill * 100).toFixed(0)}% of the node is deployed. Withdrawals stay paused until this is 100%.`}
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums">{(fill * 100).toFixed(0)}%</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, fill * 100)}%` }} />
        </div>
      </section>
      <RaiseCash />
    <div className="grid xl:grid-cols-[1fr_380px] gap-5">
      <div className="space-y-5 min-w-0">
        <Panel
          code="Order book"
          title="Instruments"
          action={
            <span className={cn("sim-chip", liveCount > 0 ? "sim-chip-live" : "sim-chip-warn")}>
              <Radio className="w-3 h-3" /> {liveCount} last{markedCount > 0 ? ` · ${markedCount} reference` : ""}
            </span>
          }
          bodyClassName="p-0"
        >
          <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
            {CLASSES.map((c) => (
              <button key={c.id} type="button" onClick={() => { setCls(c.id); setPage(0); }} className={cn("sim-chip cursor-pointer", cls === c.id && "sim-chip-live")}>
                {c.label}
              </button>
            ))}
            <input
              className="sim-input ml-auto max-w-xs text-[16px] sm:text-[13px]"
              placeholder="Search the book"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
            />
          </div>
          <p className="px-5 pt-3 text-[11px] font-mono text-white/35">
            {list.length} names · {safePage * pageSize + 1}–{Math.min(list.length, safePage * pageSize + pageSize)}
          </p>
          <div className="mt-3 md:hidden">
            <ul>
              {view.map((i) => {
                const q = quotes[i.symbol];
                if (!q) return null;
                return (
                  <li key={i.symbol}>
                    <button
                      type="button"
                      onClick={() => setSymbol(i.symbol)}
                      className={cn(
                        "flex w-full items-center gap-3 border-t border-white/10 px-4 py-2.5 text-left",
                        symbol === i.symbol ? "bg-white/[0.05]" : "",
                      )}
                    >
                      <ListedMark symbol={i.symbol} name={i.name} cls={markClass(i.symbol, i.cls)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-white">{i.symbol}</span>
                        <span className="block truncate text-[11px] text-white/45">{i.name}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[13px] tabular-nums text-white">{fmtPrice(q.mid)}</span>
                        <span className={cn("block text-[11px] tabular-nums", signClass(q.change24h))}>
                          {q.change24h >= 0 ? "+" : ""}{q.change24h.toFixed(2)}%
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                  <th className="font-normal px-5 py-2">Instrument</th>
                  <th className="font-normal px-2 py-2 text-right">Last</th>
                  <th className="font-normal px-2 py-2 text-right">Bid</th>
                  <th className="font-normal px-2 py-2 text-right">Ask</th>
                  <th className="font-normal px-2 py-2 text-right">Spread</th>
                  <th className="font-normal px-2 py-2 text-right">24h</th>
                  <th className="font-normal px-5 py-2 text-right">Feed</th>
                </tr>
              </thead>
              <tbody className="sim-num text-[12px]">
                {view.map((i) => {
                  const q = quotes[i.symbol];
                  if (!q) return null;
                  return (
                    <tr
                      key={i.symbol}
                      tabIndex={0}
                      onClick={() => setSymbol(i.symbol)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSymbol(i.symbol);
                        }
                      }}
                      className={cn("border-b border-white/[0.03] cursor-pointer", symbol === i.symbol ? "bg-white/[0.05]" : "hover:bg-white/[0.02]")}
                    >
                      <td className="px-5 py-2.5">
                        <span className="flex min-w-0 items-center gap-3">
                          <ListedMark symbol={i.symbol} name={i.name} cls={markClass(i.symbol, i.cls)} />
                          <span className="min-w-0">
                            <span className="block text-white font-bold">{i.symbol}</span>
                            <span className="block text-[10px] text-white/35 font-sans truncate">{i.name}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right text-white font-semibold">{fmtPrice(q.mid)}</td>
                      <td className="px-2 py-2.5 text-right sim-neg">{fmtPrice(q.bid)}</td>
                      <td className="px-2 py-2.5 text-right sim-pos">{fmtPrice(q.ask)}</td>
                      <td className="px-2 py-2.5 text-right text-white/45">{i.spreadBps} bp</td>
                      <td className={cn("px-2 py-2.5 text-right", signClass(q.change24h))}>{q.change24h >= 0 ? "+" : ""}{q.change24h.toFixed(2)}%</td>
                      <td className={cn("px-5 py-2.5 text-right text-[9px] tracking-widest", q.source === "LIVE" ? "text-emerald-400/70" : "text-white/35")}>
                        {q.source === "LIVE" ? "Last" : "Ref"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05]">
            <button type="button" className="sim-btn sim-btn-ghost" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
            <span className="text-[11px] font-mono text-white/35">{safePage + 1} / {pages}</span>
            <button type="button" className="sim-btn sim-btn-ghost" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        </Panel>

        <Panel code="Positions" title="Open spot positions">
          {positions.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">No open positions.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-5 lg:-mx-6">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="sim-label text-[9px] border-b border-white/[0.05]">
                    <th className="font-normal px-5 py-2">Symbol</th>
                    <th className="font-normal px-2 py-2 text-right">Qty</th>
                    <th className="font-normal px-2 py-2 text-right">Avg cost</th>
                    <th className="font-normal px-2 py-2 text-right">Mark</th>
                    <th className="font-normal px-2 py-2 text-right">Value</th>
                    <th className="font-normal px-5 py-2 text-right">Unrealized</th>
                  </tr>
                </thead>
                <tbody className="sim-num text-[12px]">
                  {positions.map(([sym, p]) => {
                    const mark = quotes[sym]?.mid ?? account.marks[sym] ?? p.avgCost;
                    const pnl = (mark - p.avgCost) * p.qty;
                    return (
                      <tr key={sym} onClick={() => { setSymbol(sym); setSide("SELL"); }} className="border-b border-white/[0.03] cursor-pointer hover:bg-white/[0.02]">
                        <td className="px-5 py-2.5">
                          <span className="flex items-center gap-3">
                            <ListedMark symbol={sym} name={INSTRUMENT_BY_SYMBOL[sym]?.name ?? sym} cls={markClass(sym, INSTRUMENT_BY_SYMBOL[sym]?.cls ?? "equity")} />
                            <span className="text-white font-bold">{sym}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right text-white/80">{fmtNum(p.qty, 6)}</td>
                        <td className="px-2 py-2.5 text-right text-white/60">{fmtPrice(p.avgCost)}</td>
                        <td className="px-2 py-2.5 text-right text-white/80">{fmtPrice(mark)}</td>
                        <td className="px-2 py-2.5 text-right text-white">{fmtUsdc(p.qty * mark)}</td>
                        <td className={cn("px-5 py-2.5 text-right", signClass(pnl))}>
                          {pnl >= 0 ? "+" : ""}{fmtUsdc(pnl)} ({fmtPct(mark / p.avgCost - 1)})
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

      <div className="space-y-5">
        <Panel code={`Ticket · ${inst.sector}`} title={`${inst.symbol} · ${inst.name}`} edge className="xl:sticky xl:top-20">
          <div className="mb-4 flex items-center gap-3">
            <ListedMark symbol={inst.symbol} name={inst.name} cls={markClass(inst.symbol, inst.cls)} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{inst.name}</p>
              <p className="text-[11px] text-white/45">{inst.symbol} · {inst.sector}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button type="button" onClick={() => setSide("BUY")} className={cn("sim-btn", side === "BUY" ? "sim-btn-primary" : "sim-btn-ghost")}>
              <ArrowUpRight className="w-4 h-4" /> Buy
            </button>
            <button type="button" onClick={() => setSide("SELL")} className={cn("sim-btn", side === "SELL" ? "bg-red-500/90 text-white" : "sim-btn-ghost")}>
              <ArrowDownRight className="w-4 h-4" /> Sell
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sim-num text-[11px] mb-4">
            <div className="rounded-lg border border-white/[0.06] p-2"><p className="sim-label text-[8px]">Bid</p><p className="sim-neg font-bold">{fmtPrice(quote.bid)}</p></div>
            <div className="rounded-lg border border-white/[0.06] p-2"><p className="sim-label text-[8px]">Mid</p><p className="text-white font-bold">{fmtPrice(quote.mid)}</p></div>
            <div className="rounded-lg border border-white/[0.06] p-2"><p className="sim-label text-[8px]">Ask</p><p className="sim-pos font-bold">{fmtPrice(quote.ask)}</p></div>
          </div>

          <label className="sim-label block mb-1.5" htmlFor="amt">{side === "BUY" ? "Notional (USD)" : `Quantity (${symbol})`}</label>
          <input
            id="amt"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="sim-input sim-num"
          />
          <div className="flex gap-1.5 mt-2">
            {[0.1, 0.25, 0.5, 1].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() =>
                  setAmount(
                    side === "BUY"
                      ? (Math.floor(account.cash * f * 100) / 100).toString()
                      : ((pos?.qty ?? 0) * f).toPrecision(8),
                  )
                }
                className="sim-chip cursor-pointer flex-1 justify-center"
              >
                {f === 1 ? "Max" : `${f * 100}%`}
              </button>
            ))}
          </div>

          <dl className="sim-num text-[11.5px] space-y-1.5 mt-4 border-t border-white/[0.05] pt-3">
            <div className="flex justify-between"><dt className="text-white/40">Fill price</dt><dd className="text-white">{fmtPrice(side === "BUY" ? quote.ask : quote.bid)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Est. quantity</dt><dd className="text-white">{fmtNum(preview.qty, 6)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">{side === "BUY" ? "Cost" : "Proceeds"}</dt><dd className="text-white">{fmtUsdc(preview.notional)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">Spread paid</dt><dd className="text-amber-300">{fmtUsdc(preview.spread)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/40">{side === "BUY" ? "Free USD" : "Position"}</dt><dd className="text-white/70">{side === "BUY" ? fmtUsdc(account.cash) : `${fmtNum(pos?.qty ?? 0, 6)} ${symbol}`}</dd></div>
          </dl>

          {account.tradingHalted && (
            <Notice tone="error" className="mt-4">
              Trading is frozen on this desk. Vaults and the ledger stay readable.
            </Notice>
          )}
          {msg && <Notice tone={msg.tone} className="mt-4">{msg.text}</Notice>}

          <button
            type="button"
            onClick={submit}
            disabled={!(value > 0) || !!account.tradingHalted || !liveNode}
            className={cn("sim-btn w-full mt-4", side === "BUY" ? "sim-btn-primary" : "bg-red-500/90 text-white")}
          >
            {side === "BUY" ? "Execute buy" : "Execute sell"}
          </button>
          <p className="text-[11px] text-white/35 mt-3 leading-relaxed">
            Fills are at the quoted side. Half of every spread is booked to the protocol fee pool
            and accrues to conviction locks at the next settlement.
          </p>
        </Panel>
      </div>
    </div>
    {slip && <TradeReceipt slip={slip} onClose={() => setSlip(null)} />}
    </div>
  );
}
