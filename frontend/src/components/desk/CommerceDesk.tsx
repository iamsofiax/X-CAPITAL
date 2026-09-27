"use client";

import { useMemo, useState } from "react";
import { useSim } from "@/hooks/useSim";
import { useStore } from "@/store/useStore";
import { pushNotice } from "@/lib/yieldDesk";
import { CATALOG, cabListPrice, cabUnitPrice, incomePerMinute } from "@/lib/commerceDesk";
import { fmtUsdc } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

function CatalogShot({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return <div className={cn(className, "bg-gradient-to-br from-[#10241c] via-[#0a0e0c] to-black")} aria-hidden />;
  }
  return <img src={src} alt={alt} className={cn(className, "bg-[#0c1210]")} onError={() => setOk(false)} />;
}

export function CommerceDesk() {
  const { account, actions } = useSim();
  const userId = useStore((s) => s.user?.id);
  const [cabs, setCabs] = useState(1);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const unit = cabUnitPrice(cabs);
  const unitList = cabListPrice(cabs);
  const ticket = unit * cabs;
  const ticketList = unitList * cabs;
  const perMin = incomePerMinute(ticket);
  const owned = account?.fleet?.units ?? 0;
  const ownedIncome = incomePerMinute(account?.fleet?.cost ?? 0);

  const lines = useMemo(() => CATALOG, []);

  const orderCabs = () => {
    setErr("");
    setMsg("");
    const res = actions.buyFleet(cabs);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    const text = `${cabs} robotaxi unit${cabs === 1 ? "" : "s"} booked at ${fmtUsdc(unit)} each. Occupancy credits cash every minute.`;
    setMsg(text);
    if (userId) pushNotice(userId, "Fleet order filled", text);
  };

  const orderItem = (sku: string, name: string, price: number) => {
    setErr("");
    setMsg("");
    const n = Math.max(1, Math.floor(qty[sku] || 1));
    const res = actions.buyCatalog(sku, n);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    const text = `${n} × ${name} posted to the book at ${fmtUsdc(price)} each.`;
    setMsg(text);
    if (userId) pushNotice(userId, "Atelier order filled", text);
  };

  return (
    <div className="space-y-8">
      <section className="pnl-stage overflow-hidden">
        <div className="grid lg:grid-cols-[1.3fr_0.9fr]">
          <CatalogShot src="/catalog/catalog-cab.png" alt="Robotaxi fleet unit" className="h-72 w-full object-cover lg:h-full min-h-[320px]" />
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <p className="sim-label text-emerald-300/80">Robotaxi fleet</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Tesla cabs on the book</h2>
            <p className="mt-3 text-sm text-white/55 leading-relaxed">
              A fleet unit lists at ${fmtUsdc(15000, { decimals: 0 })} and is 30% off on this desk, from ${fmtUsdc(unit, { decimals: 0 })}.
              The price still steps up with the size of the order. Occupancy income credits free cash every minute and shows on the portfolio.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="pnl-card pnl-card-pos">
                <dt className="sim-label">This order</dt>
                <dd className="pnl-figure text-white">${fmtUsdc(ticket, { decimals: 0 })}</dd>
                <dd className="mt-2 text-[12px] text-white/40">
                  <span className="line-through">${fmtUsdc(ticketList, { decimals: 0 })}</span>
                  {" "}· ${fmtUsdc(unit, { decimals: 0 })} each · {cabs} unit{cabs === 1 ? "" : "s"}
                </dd>
              </div>
              <div className="pnl-card pnl-card-pos">
                <dt className="sim-label">Each minute</dt>
                <dd className="pnl-figure text-emerald-300">{fmtUsdc(perMin, { decimals: 4 })}</dd>
                <dd className="mt-2 text-[12px] text-white/40">on this order, posted to cash</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-center gap-3">
              <button type="button" className="sim-btn sim-btn-ghost px-4" onClick={() => setCabs((n) => Math.max(1, n - 1))}>−</button>
              <span className="sim-num text-lg font-bold w-10 text-center">{cabs}</span>
              <button type="button" className="sim-btn sim-btn-ghost px-4" onClick={() => setCabs((n) => Math.min(40, n + 1))}>+</button>
              <button type="button" onClick={orderCabs} className="sim-btn sim-btn-primary flex-1">Order the fleet</button>
            </div>
            {owned > 0 && (
              <p className="mt-4 text-[12px] text-white/50">
                You hold {owned} unit{owned === 1 ? "" : "s"}. Open income is {fmtUsdc(ownedIncome, { decimals: 4 })} USD per minute.
              </p>
            )}
          </div>
        </div>
      </section>

      {(msg || err) && (
        <p className={cn("text-sm", err ? "text-red-300" : "text-emerald-300")}>{err || msg}</p>
      )}

      <div>
        <p className="sim-label">Atelier</p>
        <h3 className="mt-1 text-2xl font-black tracking-tight">Vehicles, robots, and energy</h3>
        <p className="mt-2 max-w-2xl text-sm text-white/45">Whole units. The purchase posts to the portfolio at the price you pay. Free USD is the limit.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {lines.map((item) => {
          const n = qty[item.sku] || 1;
          const held = account?.commerce?.find((h) => h.sku === item.sku)?.qty ?? 0;
          return (
            <article key={item.sku} className="pnl-sleeve overflow-hidden !p-0" style={{ ["--sleeve" as string]: "#34d399" }}>
              <div className="relative">
                <CatalogShot src={item.image} alt={item.name} className="h-52 w-full object-cover" />
                <p className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-sm font-black text-white">
                  ${fmtUsdc(item.price, { decimals: 0 })}
                  <span className="ml-2 text-[11px] font-medium text-white/45 line-through">${fmtUsdc(item.list, { decimals: 0 })}</span>
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <span className="pnl-mark text-[12px] text-[#03140d]" style={{ background: "#34d399" }}>
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="sim-label">{item.line}</p>
                    <h4 className="text-lg font-black truncate">{item.name}</h4>
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-white/45 leading-snug">{item.blurb}</p>
                <p className="mt-3 text-2xl font-black text-emerald-300">${fmtUsdc(item.price, { decimals: 0 })}</p>
                <p className="text-[12px] text-white/40"><span className="line-through">${fmtUsdc(item.list, { decimals: 0 })}</span> · 30% off</p>
                {held > 0 && <p className="text-[11px] text-emerald-300/80 mt-1">On the book · {held}</p>}
                <div className="pnl-split mt-3" aria-hidden>
                  <span style={{ width: "70%" }} />
                  <span style={{ width: "30%" }} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button type="button" className="sim-btn sim-btn-ghost px-3" onClick={() => setQty((q) => ({ ...q, [item.sku]: Math.max(1, n - 1) }))}>−</button>
                  <span className="sim-num w-6 text-center text-sm">{n}</span>
                  <button type="button" className="sim-btn sim-btn-ghost px-3" onClick={() => setQty((q) => ({ ...q, [item.sku]: Math.min(12, n + 1) }))}>+</button>
                  <button type="button" className="sim-btn sim-btn-primary flex-1" onClick={() => orderItem(item.sku, item.name, item.price)}>
                    Buy
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
