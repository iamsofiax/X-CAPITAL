"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { useSimStore } from "@/store/useSimStore";
import { useSim } from "@/hooks/useSim";
import { accountNav } from "@/lib/sim/engine";
import { liveAccrual, pushNotice, readMandate, touchMandate, type YieldMandate } from "@/lib/yieldDesk";
import { FLEET_APR, YEAR_MS, incomePerMinute } from "@/lib/commerceDesk";

export function useLiveYield() {
  const userId = useStore((s) => s.user?.id ?? null);
  const { account, metrics } = useSim();
  const creditYield = useSimStore((s) => s.creditYield);
  const settleFleet = useSimStore((s) => s.settleFleet);
  const [now, setNow] = useState(0);
  const [mandate, setMandate] = useState<YieldMandate | null>(null);
  const postedKey = useRef("");
  const fleetKey = useRef("");

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const pull = () => setMandate(userId ? readMandate(userId) : null);
    pull();
    window.addEventListener("xc-yield", pull);
    window.addEventListener("storage", pull);
    return () => {
      window.removeEventListener("xc-yield", pull);
      window.removeEventListener("storage", pull);
    };
  }, [userId]);

  const posted = metrics?.nav ?? (account ? accountNav(account) : 0);

  useEffect(() => {
    if (!userId || !mandate || mandate.dailyPct <= 0 || !account?.genesisClaimedAt) return;
    if (mandate.principal <= 0 && posted > 0) {
      touchMandate(userId, { principal: posted });
      return;
    }
    const { wholeDays } = liveAccrual(mandate, now);
    if (wholeDays < 1 || mandate.principal <= 0) return;
    const key = `${userId}:${mandate.lastSettledAt}:${wholeDays}`;
    if (postedKey.current === key) return;
    postedKey.current = key;
    const profit = mandate.principal * (mandate.dailyPct / 100) * wholeDays;
    const res = creditYield(
      userId,
      profit,
      `Daily growth ${mandate.dailyPct}% posted for ${wholeDays} day${wholeDays === 1 ? "" : "s"}`,
    );
    if (!res.ok) {
      postedKey.current = "";
      return;
    }
    touchMandate(userId, {
      lastSettledAt: mandate.lastSettledAt + wholeDays * 86_400_000,
      principal: mandate.principal + profit,
    });
    pushNotice(
      userId,
      "Daily profit posted",
      `+${profit.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD at ${mandate.dailyPct}% was booked to cash and the portfolio.`,
    );
  }, [userId, mandate, now, account?.genesisClaimedAt, posted, creditYield]);

  useEffect(() => {
    const fleet = account?.fleet;
    if (!userId || !fleet || fleet.cost <= 0 || !account?.genesisClaimedAt) return;
    const minutes = Math.floor((now - fleet.accruedAt) / 60_000);
    if (minutes < 1) return;
    const key = `${userId}:${fleet.accruedAt}:${minutes}`;
    if (fleetKey.current === key) return;
    fleetKey.current = key;
    const res = settleFleet(userId);
    if (!res.ok) {
      fleetKey.current = "";
      return;
    }
    pushNotice(
      userId,
      "Fleet income posted",
      `Robotaxi occupancy for ${minutes} minute${minutes === 1 ? "" : "s"} was booked to cash.`,
    );
  }, [userId, account?.fleet, account?.genesisClaimedAt, now, settleFleet]);

  const rate = mandate?.dailyPct ?? 0;
  const principal = mandate?.principal || posted;
  const accruing = mandate && rate > 0 ? liveAccrual(mandate, now).accruing : 0;
  const fleetCost = account?.fleet?.cost ?? 0;
  const fleetPending = fleetCost > 0 ? fleetCost * FLEET_APR * Math.max(0, now - (account?.fleet?.accruedAt ?? now)) / YEAR_MS : 0;
  const fleetPerMin = incomePerMinute(fleetCost);
  const live = posted + (mandate && rate > 0 ? liveAccrual({ ...mandate, principal }, now).accruing : 0) + fleetPending;

  return { live, posted, accruing, rate, principal, mandate, fleetPending, fleetPerMin };
}
