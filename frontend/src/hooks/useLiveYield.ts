"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { useSimStore } from "@/store/useSimStore";
import { useSim } from "@/hooks/useSim";
import { accountNav } from "@/lib/sim/engine";
import { liveAccrual, nodeActivated, operatedOf, pushNotice, readMandate, touchMandate, weeklyOf, type YieldMandate } from "@/lib/yieldDesk";
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
    const moving = nodeActivated(mandate) || (account?.fleet?.cost ?? 0) > 0;
    if (!moving) return;
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [mandate, account?.fleet?.cost]);

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
    if (!userId || !mandate || !nodeActivated(mandate) || mandate.dailyPct <= 0 || !account?.genesisClaimedAt) return;
    if (mandate.principal <= 0 && posted > 0) {
      touchMandate(userId, { principal: posted });
      return;
    }
    const { wholeDays } = liveAccrual(mandate, now);
    if (wholeDays < 1 || mandate.principal <= 0) return;
    const key = `${userId}:${mandate.lastSettledAt}:${wholeDays}`;
    if (postedKey.current === key) return;
    postedKey.current = key;
    const profit = mandate.principal * (operatedOf(mandate) / 100) * (mandate.dailyPct / 100) * wholeDays;
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
  const weekly = mandate ? weeklyOf(mandate) : 0;
  const principal = mandate?.principal || posted;
  const accruing = mandate && nodeActivated(mandate) && rate > 0 ? liveAccrual(mandate, now).accruing : 0;
  const fleetCost = account?.fleet?.cost ?? 0;
  const fleetPending = fleetCost > 0 ? fleetCost * FLEET_APR * Math.max(0, now - (account?.fleet?.accruedAt ?? now)) / YEAR_MS : 0;
  const fleetPerMin = incomePerMinute(fleetCost);
  const live = posted + accruing + fleetPending;

  return { live, posted, accruing, rate, weekly, active: nodeActivated(mandate), principal, mandate, fleetPending, fleetPerMin };
}
