// ─────────────────────────────────────────────────────────────────────────────
// X-CAPITAL — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserTier = "CORE" | "GOLD" | "BLACK";
export type UserRole = "USER" | "ADMIN" | "GOD_ADMIN";
export type KYCStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED";
export type AccreditationStatus = "NOT_ACCREDITED" | "PENDING" | "ACCREDITED";
export type AssetType =
  | "STOCK"
  | "ETF"
  | "CRYPTO"
  | "TOKEN"
  | "FUND"
  | "PRIVATE_EQUITY"
  | "INFRASTRUCTURE"
  | "COMMODITY"
  | "REAL_ESTATE";
export type OrderType = "BUY" | "SELL";
export type OrderStatus =
  | "PENDING"
  | "FILLED"
  | "PARTIALLY_FILLED"
  | "CANCELLED"
  | "REJECTED";
export type ExecutionSource =
  | "BROKER"
  | "BLOCKCHAIN"
  | "INTERNAL"
  | "SECONDARY_MARKET";
export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRADE"
  | "DIVIDEND"
  | "FEE"
  | "CONVERSION"
  | "FUND_INVESTMENT"
  | "FUND_REDEMPTION";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  role?: UserRole;
  tier: UserTier;
  kycStatus: KYCStatus;
  accreditationStatus: AccreditationStatus;
  createdAt: string;
  // Admin control fields
  isFrozen?: boolean;
  isSuspended?: boolean;
  isBlocked?: boolean;
  tradingEnabled?: boolean;
  profitHold?: boolean;
  profitMultiplier?: number;
  profitRate?: number; // Daily profit % (e.g. 1.5 = 1.5%/day)
  profitMode?: "linear" | "compound" | "stepped" | "random";
  profitSchedule?: "daily" | "weekly" | "monthly";
  // Node Advancement Ladder — admin sets the funding goal and the rate the
  // user unlocks by reaching it; users climb node → node as they scale.
  nodeTier?: number; // current ladder tier (1 = CORE)
  nodeGoal?: number; // admin-set funding goal ($) for the NEXT node
  nextNodeRate?: number; // daily % unlocked once the goal is funded
  passwordHash?: string;
  balance?: number;
  lastLogin?: string;
  country?: string;
  trades?: number;
  // Admin-unlocked rails (bypasses phase check for specific rails)
  unlockedRails?: string[];
  // Transaction ledger
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  type:
    | "CREDIT"
    | "DEBIT"
    | "PROFIT"
    | "FEE"
    | "ADJUSTMENT"
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "TRADE"
    | "FUND_INVESTMENT"
    | "FUND_REDEMPTION";
  amount: number;
  note: string;
  timestamp: string;
  performedBy: string;
}

export interface Wallet {
  id: string;
  fiatBalance: number;
  cryptoBalance: number;
  lockedBalance: number;
  walletAddress?: string;
}

/** Admin-editable crypto deposit address shown on the wallet page. */
export interface DepositAddress {
  symbol: string;
  address: string;
  tag?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  priceChange24h?: number;
  priceChange7d?: number;
  volume24h?: number;
  marketCap?: number;
  liquidityScore?: number;
  description?: string;
  imageUrl?: string;
  sector?: string;
  exchange?: string;
  isTradable: boolean;
}

export interface Order {
  id: string;
  userId: string;
  assetId: string;
  type: OrderType;
  amount: number;
  quantity?: number;
  price?: number;
  filledPrice?: number;
  status: OrderStatus;
  executionSource: ExecutionSource;
  brokerOrderId?: string;
  txHash?: string;
  filledAt?: string;
  createdAt: string;
  asset?: Pick<Asset, "symbol" | "name" | "type" | "imageUrl">;
}

export interface PortfolioHolding {
  id: string;
  portfolioId: string;
  assetId: string;
  quantity: number;
  avgCost: number;
  currentValue: number;
  unrealizedPnL?: number;
  asset: Asset;
}

export interface Portfolio {
  id: string;
  userId: string;
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  riskScore?: number;
  performanceYTD?: number;
  cashBalance: number;
  holdings: PortfolioHolding[];
}

export interface Investment {
  id: string;
  name: string;
  description?: string;
  category: string;
  minInvestment: number;
  lockPeriodDays: number;
  targetReturn: number;
  currentAUM: number;
  maxCapacity?: number;
  isOpen: boolean;
  riskLevel: string;
  imageUrl?: string;
  highlights?: string[];
  allocation?: Record<string, number>;
}

export interface UserInvestment {
  id: string;
  userId: string;
  investmentId: string;
  amount: number;
  status: string;
  investedAt: string;
  maturesAt?: string;
  investment: Investment;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  status: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Forecast {
  symbol: string;
  horizon: string;
  projectedChange: number;
  projectedPrice: number;
  confidence: number;
  signals: string[];
  generatedAt: string;
}

export interface OptimalAllocation {
  AI: number;
  Energy: number;
  Space: number;
  PrivateEquity: number;
  Cash: number;
  rationale: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ msg: string; path: string }>;
}
