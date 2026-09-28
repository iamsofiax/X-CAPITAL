export type SimAsset = "sUSDC" | "sXC";

export type LedgerKind =
  | "GENESIS"
  | "RESET"
  | "VAULT_DEPOSIT"
  | "VAULT_WITHDRAW"
  | "TRADE_BUY"
  | "TRADE_SELL"
  | "SPREAD"
  | "FEE_SHARE"
  | "COMPOUND"
  | "EMISSION"
  | "LOCK"
  | "UNLOCK"
  | "CARRY"
  | "YIELD"
  | "DEPOSIT"
  | "JOURNAL";

export interface LedgerEntry {
  id: string;
  hash: string;
  epoch: number;
  ts: number;
  kind: LedgerKind;
  asset: SimAsset;
  /** Signed change to the account's free balance of `asset`. */
  amount: number;
  from: string;
  to: string;
  memo: string;
}

export interface VaultPosition {
  shares: number;
  costBasis: number;
  /** Epoch of the most recent deposit (drives RWA redemption windows). */
  lastDepositEpoch: number;
  autoCompound: boolean;
}

export interface TradePosition {
  qty: number;
  avgCost: number;
}

export interface ConvictionLock {
  id: string;
  amount: number;
  startTs: number;
  endTs: number;
}

export interface NavPoint {
  epoch: number;
  nav: number;
}

export interface CommerceHolding {
  sku: string;
  qty: number;
  cost: number;
}

export interface FleetBook {
  units: number;
  cost: number;
  accruedAt: number;
}

export interface SimAccount {
  userId: string;
  createdAt: number;
  genesisClaimedAt: number | null;
  resets: number;
  cash: number;
  sxc: number;
  lastSettledEpoch: number;
  vaults: Record<string, VaultPosition>;
  positions: Record<string, TradePosition>;
  /** Last mid price seen per traded symbol, used to mark positions between sessions. */
  marks: Record<string, number>;
  locks: ConvictionLock[];
  ledger: LedgerEntry[];
  navHistory: NavPoint[];
  xp: number;
  streak: { count: number; lastDay: string | null };
  achievements: string[];
  season: { index: number; startNav: number; startEpoch: number };
  totals: {
    feeShare: number;
    spreadPaid: number;
    sxcEmitted: number;
    trades: number;
  };
  pendingSpreadFee: number;
  /** Admin freeze — blocks Execution fills only. */
  tradingHalted?: boolean;
  /** Robotaxi units held at cost. Occupancy credits cash. */
  fleet?: FleetBook;
  /** Atelier orders held at cost. */
  commerce?: CommerceHolding[];
}
