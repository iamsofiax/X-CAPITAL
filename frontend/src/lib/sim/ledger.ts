import { hexDigest } from "./prng";
import type { LedgerEntry, LedgerKind, SimAccount, SimAsset } from "./types";

export const LEDGER_CAP = 1500;
export const TREASURY = "treasury";

let seq = 0;

export function makeEntry(
  account: Pick<SimAccount, "userId">,
  e: {
    epoch: number;
    kind: LedgerKind;
    asset: SimAsset;
    amount: number;
    from: string;
    to: string;
    memo: string;
    ts?: number;
  },
): LedgerEntry {
  const ts = e.ts ?? Date.now();
  const id = `${ts.toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...e,
    ts,
    id,
    hash: hexDigest(`${account.userId}|${id}|${e.kind}|${e.amount}|${ts}`),
  };
}

/** Appends entries newest-first, folding the oldest into a CARRY entry so balances stay provable. */
export function appendLedger(ledger: LedgerEntry[], entries: LedgerEntry[]): LedgerEntry[] {
  const next = [...entries.slice().reverse(), ...ledger];
  if (next.length <= LEDGER_CAP) return next;

  const keep = next.slice(0, LEDGER_CAP - 2);
  const folded = next.slice(LEDGER_CAP - 2);
  const carry = (asset: SimAsset): LedgerEntry | null => {
    const sum = folded.filter((x) => x.asset === asset).reduce((a, x) => a + x.amount, 0);
    if (folded.every((x) => x.asset !== asset)) return null;
    const last = folded[0];
    return {
      id: `carry-${asset}-${last.id}`,
      hash: hexDigest(`carry|${asset}|${last.hash}|${sum}`),
      epoch: last.epoch,
      ts: last.ts,
      kind: "CARRY",
      asset,
      amount: sum,
      from: "ledger",
      to: TREASURY,
      memo: `Carried balance from ${folded.length} archived entries`,
    };
  };
  return [...keep, ...[carry("sUSDC"), carry("sXC")].filter((x): x is LedgerEntry => !!x)];
}

export function ledgerBalance(ledger: LedgerEntry[], asset: SimAsset): number {
  return ledger.filter((x) => x.asset === asset).reduce((a, x) => a + x.amount, 0);
}

/** Proof of reserves: the free balances must equal the sum of every signed ledger entry. */
export function verifyReserves(account: SimAccount): {
  ok: boolean;
  cashDelta: number;
  sxcDelta: number;
} {
  const cashDelta = ledgerBalance(account.ledger, "sUSDC") - account.cash;
  const sxcDelta = ledgerBalance(account.ledger, "sXC") - account.sxc;
  return {
    ok: Math.abs(cashDelta) < 0.01 && Math.abs(sxcDelta) < 0.01,
    cashDelta,
    sxcDelta,
  };
}
