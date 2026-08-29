/**
 * userLedger — SINGLE SOURCE OF TRUTH for a user's live performance ledger.
 *
 *   liveBalance     = cash from Accrual Core (server clock + interpolator)
 *   approvedCapital = net completed deposits − withdrawals
 *   totalReturnUsd  = liveBalance − approvedCapital
 */

import type { Transaction } from "@/types";

export function approvedCapitalFromTransactions(
  transactions: Transaction[] | undefined,
): number {
  if (!Array.isArray(transactions)) return 0;
  let net = 0;
  for (const tx of transactions) {
    if (
      tx.type === "CREDIT" ||
      tx.type === "DEPOSIT" ||
      tx.type === "FUND_REDEMPTION"
    ) {
      net += Math.max(0, Number(tx.amount) || 0);
    } else if (tx.type === "DEBIT" || tx.type === "WITHDRAWAL") {
      net -= Math.abs(Number(tx.amount) || 0);
    }
  }
  return Math.max(0, net);
}

export interface LiveLedger {
  approvedCapital: number;
  compoundYield: number;
  liveBalance: number;
  totalReturnUsd: number;
  totalReturnPct: number;
  transactions: Transaction[];
  eventCount: number;
}

export function buildLiveLedger(input: {
  balance: number;
  transactions?: Transaction[];
  totalYieldGenerated?: number;
}): LiveLedger {
  const approvedCapital = approvedCapitalFromTransactions(input.transactions);
  const compoundYield = Math.max(0, Number(input.totalYieldGenerated ?? 0));
  const liveBalance = Math.max(0, Number(input.balance) || 0);
  const totalReturnUsd = liveBalance - approvedCapital;
  const totalReturnPct =
    approvedCapital > 0 ? (totalReturnUsd / approvedCapital) * 100 : 0;
  const transactions = [...(input.transactions ?? [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return {
    approvedCapital,
    compoundYield,
    liveBalance,
    totalReturnUsd,
    totalReturnPct,
    transactions,
    eventCount: transactions.length,
  };
}

export function buildLedgerSeries(input: {
  balance: number;
  transactions?: Transaction[];
  totalYieldGenerated?: number;
  days?: number;
}): Array<{ date: string; value: number }> {
  return buildLedgerSeriesFromEvents(
    (input.transactions ?? []).map((tx) => ({
      type: tx.type,
      amount: Number(tx.amount),
      status: "COMPLETED",
      timestamp: tx.timestamp,
    })),
    input.balance,
    input.days ?? 30,
  );
}

export function buildLedgerSeriesFromEvents(
  events: Array<{
    type: string;
    amount: number;
    status?: string;
    timestamp: string;
  }>,
  liveBalance: number,
  days = 30,
): Array<{ date: string; value: number }> {
  const windowDays = Math.max(1, Math.min(90, days));
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - windowDays);
  start.setHours(0, 0, 0, 0);

  const completed = [...events]
    .filter((tx) => !tx.status || tx.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  const credit = (type: string) =>
    type === "DEPOSIT" ||
    type === "CREDIT" ||
    type === "YIELD" ||
    type === "PROFIT" ||
    type === "DIVIDEND" ||
    type === "FUND_REDEMPTION";
  const debit = (type: string) =>
    type === "WITHDRAWAL" ||
    type === "DEBIT" ||
    type === "FEE" ||
    type === "FUND_INVESTMENT";

  let running = 0;
  for (const tx of completed) {
    if (new Date(tx.timestamp) < start) {
      const amount = Math.abs(Number(tx.amount) || 0);
      if (credit(tx.type)) running += amount;
      else if (debit(tx.type)) running -= amount;
    }
  }
  running = Math.max(0, running);

  const series: Array<{ date: string; value: number }> = [];
  for (let i = 0; i <= windowDays; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    for (const tx of completed) {
      const at = new Date(tx.timestamp);
      if (at < day || at > dayEnd) continue;
      const amount = Math.abs(Number(tx.amount) || 0);
      if (credit(tx.type)) running += amount;
      else if (debit(tx.type)) running -= amount;
    }
    running = Math.max(0, Math.round(running * 100) / 100);
    series.push({
      date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: running,
    });
  }
  if (series.length > 0) {
    series[series.length - 1].value = Math.max(
      0,
      Math.round(Number(liveBalance) * 100) / 100,
    );
  }
  return series;
}
