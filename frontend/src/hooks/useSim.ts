"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { useSimStore } from "@/store/useSimStore";
import { currentEpoch, msUntilNextEpoch } from "@/lib/sim/clock";
import { totalWeight, lockedAmount } from "@/lib/sim/conviction";
import {
  accountNav,
  positionsValue,
  vaultsValue,
} from "@/lib/sim/engine";
import { verifyReserves } from "@/lib/sim/ledger";
import {
  annualizedVol,
  maxDrawdown,
  nextTier,
  sortino,
  tierFor,
  tierProgress,
} from "@/lib/sim/scoring";
import { FEE_SWITCH, avgNetworkFees, navAt, networkVeWeightAt, regimeAt } from "@/lib/sim/vaults";
import type { ProjectionInput } from "@/lib/sim/projection";
import { EPOCHS_PER_YEAR } from "@/lib/sim/clock";
import type { Quote } from "@/lib/sim/instruments";

/** Re-renders when the simulation crosses an epoch boundary. */
export function useEpoch(): number {
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    setEpoch(currentEpoch());
    let t: ReturnType<typeof setTimeout>;
    const arm = () => {
      t = setTimeout(() => {
        setEpoch(currentEpoch());
        arm();
      }, msUntilNextEpoch() + 250);
    };
    arm();
    return () => clearTimeout(t);
  }, []);
  return epoch;
}

/** Stable Monte Carlo input for the current book; recomputed only when holdings or the epoch change. */
export function useProjectionInput(horizonDays: number): ProjectionInput | null {
  const { account, epoch, metrics } = useSim();
  const vaults = account?.vaults;
  const cash = account?.cash ?? 0;
  // Rounded so 5-second mark-to-market ticks don't re-run 400 Monte Carlo paths.
  const positions = Math.round(metrics?.positions ?? 0);
  const apr = Math.round((metrics?.feeShareApr ?? 0) * 1e4) / 1e4;
  const userId = account?.userId;
  return useMemo(() => {
    if (!vaults || !userId) return null;
    const values: Record<string, number> = {};
    for (const [id, p] of Object.entries(vaults)) values[id] = p.shares * navAt(id, epoch);
    return {
      vaults: values,
      idle: cash + positions,
      feeShareApr: apr,
      horizonEpochs: horizonDays * 3,
      startRegime: regimeAt(epoch),
      paths: 400,
      seedKey: `${userId}:${epoch}`,
    };
  }, [vaults, cash, positions, apr, epoch, userId, horizonDays]);
}

export function useSim() {
  const userId = useStore((s) => s.user?.id ?? null);
  const epoch = useEpoch();
  const account = useSimStore((s) => (userId ? s.accounts[userId] : undefined));
  const report = useSimStore((s) => (userId ? s.lastReport[userId] : undefined));
  const store = useSimStore;

  useEffect(() => {
    if (!userId) return;
    const s = store.getState();
    s.ensure(userId);
    s.sync(userId);
  }, [userId, epoch, store]);

  const metrics = useMemo(() => {
    if (!account) return null;
    const now = Date.now();
    const nav = accountNav(account, epoch);
    const weight = totalWeight(account.locks, now);
    const netWeight = networkVeWeightAt(epoch);
    const share = weight > 0 ? weight / (netWeight + weight) : 0;
    const epochPool = avgNetworkFees(epoch) * FEE_SWITCH;
    const feeShareApr = nav > 0 ? (epochPool * share * EPOCHS_PER_YEAR) / nav : 0;
    const history = account.navHistory;
    const seasonHistory = history.filter((p) => p.epoch >= account.season.startEpoch);
    const seasonReturn =
      account.season.startNav > 0 ? nav / account.season.startNav - 1 : 0;
    const lifetimeReturn = account.season.startNav > 0 ? nav / account.season.startNav - 1 : 0;
    return {
      nav,
      cash: account.cash,
      vaults: vaultsValue(account, epoch),
      positions: positionsValue(account),
      sxc: account.sxc,
      locked: lockedAmount(account.locks),
      veWeight: weight,
      poolShare: share,
      feeShareApr,
      sortino: sortino(seasonHistory),
      maxDrawdown: maxDrawdown(seasonHistory),
      seasonEpochs: Math.max(0, seasonHistory.length - 1),
      lifetimeSortino: sortino(history),
      lifetimeMaxDrawdown: maxDrawdown(history),
      vol: annualizedVol(history),
      seasonReturn,
      lifetimeReturn,
      tier: tierFor(account.xp),
      nextTier: nextTier(account.xp),
      tierProgress: tierProgress(account.xp),
      regime: regimeAt(epoch),
      reserves: verifyReserves(account),
    };
  }, [account, epoch]);

  const actions = useMemo(() => {
    const s = store.getState();
    const id = userId ?? "";
    return {
      claimGenesis: () => s.claimGenesis(id),
      buyFleet: (units: number) => s.buyFleet(id, units),
      buyCatalog: (sku: string, units: number) => s.buyCatalog(id, sku, units),
      reset: () => s.reset(id),
      deposit: (vaultId: string, amount: number) => s.deposit(id, vaultId, amount),
      withdraw: (vaultId: string, amount: number) => s.withdraw(id, vaultId, amount),
      toggleCompound: (vaultId: string, on: boolean) => s.toggleCompound(id, vaultId, on),
      trade: (quote: Quote, side: "BUY" | "SELL", input: { notional?: number; qty?: number }) =>
        s.trade(id, quote, side, input),
      lock: (amount: number, days: number) => s.lock(id, amount, days),
      unlock: (lockId: string) => s.unlock(id, lockId),
      checkIn: () => s.checkIn(id),
      clearReport: () => s.clearReport(id),
      mark: (mids: Record<string, number>) => s.mark(id, mids),
      setHalt: (halted: boolean) => s.setHalt(id, halted),
    };
  }, [store, userId]);

  return {
    userId,
    epoch,
    account,
    report,
    metrics,
    actions,
    ready: !!account,
    claimed: !!account?.genesisClaimedAt,
  };
}
