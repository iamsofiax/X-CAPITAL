"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSim } from "@/hooks/useSim";
import { useStore } from "@/store/useStore";
import { pushNotice, queueDelivery } from "@/lib/yieldDesk";
import {
  CATALOG,
  CATALOG_BY_SKU,
  FLEET_SKU,
  cabListPrice,
  cabUnitPrice,
  cartTicket,
  incomePerMinute,
  lineName,
  lineTicket,
  loadCart,
  saveCart,
  type CartLine,
} from "@/lib/commerceDesk";
import { fmtUsdc } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

function CatalogShot({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return <div className={cn(className, "bg-gradient-to-br from-[#10241c] via-[#0a0e0c] to-black")} aria-hidden />;
  }
  return <img src={src} alt={alt} className={cn(className, "bg-[#0c1210]")} onError={() => setOk(false)} />;
}

type DeliveryForm = {
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
};

const emptyDelivery: DeliveryForm = {
  name: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  notes: "",
};

export function CommerceDesk() {
  const router = useRouter();
  const { account, actions } = useSim();
  const user = useStore((s) => s.user);
  const userId = user?.id;
  const [cabs, setCabs] = useState(1);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [pendingShip, setPendingShip] = useState<CartLine[] | null>(null);
  const [ship, setShip] = useState<DeliveryForm>(emptyDelivery);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  const writeCart = (next: CartLine[]) => {
    setCart(next);
    saveCart(next);
  };

  const unit = cabUnitPrice(cabs);
  const unitList = cabListPrice(cabs);
  const ticket = unit * cabs;
  const ticketList = unitList * cabs;
  const perMin = incomePerMinute(ticket);
  const owned = account?.fleet?.units ?? 0;
  const ownedIncome = incomePerMinute(account?.fleet?.cost ?? 0);
  const cash = account?.cash ?? 0;
  const due = cartTicket(cart);
  const short = due > cash + 1e-6;

  const lines = useMemo(() => CATALOG, []);

  const addLine = (sku: string, n: number) => {
    const qtyN = Math.max(1, Math.floor(n));
    const next = [...cart];
    const i = next.findIndex((l) => l.sku === sku);
    if (i >= 0) next[i] = { sku, qty: next[i].qty + qtyN };
    else next.push({ sku, qty: qtyN });
    writeCart(next);
    setMsg(`${lineName(sku)} added to the cart.`);
    setErr("");
  };

  const setLineQty = (sku: string, n: number) => {
    const qtyN = Math.max(0, Math.floor(n));
    writeCart(qtyN <= 0 ? cart.filter((l) => l.sku !== sku) : cart.map((l) => (l.sku === sku ? { sku, qty: qtyN } : l)));
  };

  const goFund = () => {
    router.push("/wallet?from=commerce");
  };

  const orderCabs = () => {
    setErr("");
    setMsg("");
    if (ticket > cash + 1e-6) {
      addLine(FLEET_SKU, cabs);
      goFund();
      return;
    }
    const res = actions.buyFleet(cabs);
    if (!res.ok) {
      if (/below/i.test(res.error)) {
        addLine(FLEET_SKU, cabs);
        goFund();
        return;
      }
      setErr(res.error);
      return;
    }
    const text = `${cabs} robotaxi unit${cabs === 1 ? "" : "s"} booked at ${fmtUsdc(unit)} each. Occupancy credits cash every minute.`;
    setMsg(text);
    if (userId) pushNotice(userId, "Fleet order filled", text);
  };

  const fillCart = () => {
    setErr("");
    setMsg("");
    if (cart.length === 0) {
      setErr("Select a vehicle first.");
      return;
    }
    if (short) {
      goFund();
      return;
    }
    const shipped: CartLine[] = [];
    for (const line of cart) {
      const res = line.sku === FLEET_SKU ? actions.buyFleet(line.qty) : actions.buyCatalog(line.sku, line.qty);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      if (line.sku !== FLEET_SKU) shipped.push(line);
    }
    writeCart([]);
    setCheckout(false);
    if (shipped.length > 0) {
      setPendingShip(shipped);
      setShip({
        ...emptyDelivery,
        name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
      });
      setMsg("Order posted. Enter delivery so the desk can distribute.");
    } else {
      const text = "Fleet order posted to the book.";
      setMsg(text);
      if (userId) pushNotice(userId, "Fleet order filled", text);
    }
  };

  const submitDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !pendingShip) return;
    if (!ship.name.trim() || !ship.phone.trim() || !ship.address.trim() || !ship.city.trim() || !ship.country.trim()) {
      setErr("Name, phone, address, city, and country are required.");
      return;
    }
    const items = pendingShip.map((line) => ({
      sku: line.sku,
      name: lineName(line.sku),
      qty: line.qty,
      price: CATALOG_BY_SKU[line.sku]?.price ?? lineTicket(line.sku, 1),
    }));
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    queueDelivery({
      userId,
      email: user?.email ?? "",
      name: ship.name.trim(),
      phone: ship.phone.trim(),
      address: ship.address.trim(),
      city: ship.city.trim(),
      country: ship.country.trim(),
      notes: ship.notes.trim(),
      items,
      total,
    });
    pushNotice(userId, "Delivery on file", "The desk has the delivery packet for this order.");
    setPendingShip(null);
    setShip(emptyDelivery);
    setErr("");
    setMsg("Delivery sent to the desk for distribution.");
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
            <button type="button" className="sim-btn sim-btn-ghost mt-3" onClick={() => addLine(FLEET_SKU, cabs)}>
              Add fleet to cart
            </button>
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

      {pendingShip && (
        <section className="sim-glass p-5 md:p-6">
          <p className="font-black">Delivery</p>
          <p className="text-sm text-white/50 mt-1 mb-4">The order is on the book. Send the packet so the desk can distribute.</p>
          <form onSubmit={submitDelivery} className="grid sm:grid-cols-2 gap-3">
            <input className="sim-input" placeholder="Name" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} required />
            <input className="sim-input" placeholder="Phone" value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} required />
            <input className="sim-input sm:col-span-2" placeholder="Address" value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} required />
            <input className="sim-input" placeholder="City" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} required />
            <input className="sim-input" placeholder="Country" value={ship.country} onChange={(e) => setShip({ ...ship, country: e.target.value })} required />
            <textarea className="sim-input sm:col-span-2 min-h-[88px]" placeholder="Notes" value={ship.notes} onChange={(e) => setShip({ ...ship, notes: e.target.value })} />
            <button type="submit" className="sim-btn sim-btn-primary sm:col-span-2">Send to the desk</button>
          </form>
        </section>
      )}

      <div>
        <p className="sim-label">Atelier</p>
        <h3 className="mt-1 text-2xl font-black tracking-tight">Vehicles, robots, and energy</h3>
        <p className="mt-2 max-w-2xl text-sm text-white/45">Select one or more. Checkout compares the ticket to free USD. If cash is short, Treasury opens so you can fund the node.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {lines.map((item) => {
          const n = qty[item.sku] || 1;
          const held = account?.commerce?.find((h) => h.sku === item.sku)?.qty ?? 0;
          const inCart = cart.find((l) => l.sku === item.sku)?.qty ?? 0;
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
                {inCart > 0 && <p className="text-[11px] text-white/55 mt-1">In cart · {inCart}</p>}
                <div className="pnl-split mt-3" aria-hidden>
                  <span style={{ width: "70%" }} />
                  <span style={{ width: "30%" }} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button type="button" className="sim-btn sim-btn-ghost px-3" onClick={() => setQty((q) => ({ ...q, [item.sku]: Math.max(1, n - 1) }))}>−</button>
                  <span className="sim-num w-6 text-center text-sm">{n}</span>
                  <button type="button" className="sim-btn sim-btn-ghost px-3" onClick={() => setQty((q) => ({ ...q, [item.sku]: Math.min(12, n + 1) }))}>+</button>
                  <button type="button" className="sim-btn sim-btn-primary flex-1" onClick={() => addLine(item.sku, n)}>
                    Select
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {cart.length > 0 && (
        <section className="sim-glass p-5 md:p-6 sticky bottom-3 z-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-black">Cart</p>
              <p className="text-sm text-white/50 mt-1">
                Ticket ${fmtUsdc(due, { decimals: 0 })} · free USD ${fmtUsdc(cash, { decimals: 0 })}
                {short ? " · fund the node to cover this order" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="sim-btn sim-btn-ghost" onClick={() => setCheckout((v) => !v)}>
                {checkout ? "Hide checkout" : "Checkout"}
              </button>
              {short ? (
                <button type="button" className="sim-btn sim-btn-primary" onClick={goFund}>Fund node</button>
              ) : (
                <button type="button" className="sim-btn sim-btn-primary" onClick={fillCart}>Pay from free USD</button>
              )}
            </div>
          </div>
          {checkout && (
            <ul className="mt-4 space-y-2">
              {cart.map((line) => (
                <li key={line.sku} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{lineName(line.sku)}</span>
                  <span className="flex items-center gap-2">
                    <button type="button" className="sim-btn sim-btn-ghost px-3 py-1" onClick={() => setLineQty(line.sku, line.qty - 1)}>−</button>
                    <span className="tabular-nums w-6 text-center">{line.qty}</span>
                    <button type="button" className="sim-btn sim-btn-ghost px-3 py-1" onClick={() => setLineQty(line.sku, line.qty + 1)}>+</button>
                    <span className="tabular-nums w-24 text-right">${fmtUsdc(lineTicket(line.sku, line.qty), { decimals: 0 })}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
