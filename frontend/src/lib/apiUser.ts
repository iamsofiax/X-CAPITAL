import type { User, Transaction, KYCStatus, UserTier } from "@/types";

const ADMIN_EMAILS = new Set([
  "admin@xcapital.io",
  "demo@xcapital.investments",
]);

export function hasApiToken(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("xc_access_token");
  return !!token && token.split(".").length === 3;
}

function mapKycStatus(status: string): KYCStatus {
  if (status === "VERIFIED") return "APPROVED";
  return status as KYCStatus;
}

function mapDbTransaction(
  tx: {
    id: string;
    amount: unknown;
    type: string;
    metadata?: unknown;
    createdAt: string;
  },
  adminEmail?: string,
): Transaction {
  const meta =
    tx.metadata && typeof tx.metadata === "object"
      ? (tx.metadata as Record<string, string>)
      : {};
  const amount = Number(tx.amount);
  const isCredit =
    tx.type === "DEPOSIT" ||
    tx.type === "DIVIDEND" ||
    tx.type === "FUND_REDEMPTION" ||
    meta.direction === "credit";
  const signed = isCredit ? Math.abs(amount) : -Math.abs(amount);

  let type: Transaction["type"] = "CREDIT";
  if (tx.type === "WITHDRAWAL") type = "DEBIT";
  else if (tx.type === "TRADE") type = "TRADE";
  else if (tx.type === "FEE") type = "DEBIT";
  else if (!isCredit) type = "DEBIT";

  return {
    id: tx.id,
    type,
    amount: signed,
    note: meta.note ?? tx.type,
    timestamp: tx.createdAt,
    performedBy: meta.performedBy ?? adminEmail ?? "system",
  };
}

export type ApiUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  tier: string;
  kycStatus: string;
  accreditationStatus: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  wallet?: { fiatBalance: unknown } | null;
  transactions?: Array<{
    id: string;
    amount: unknown;
    type: string;
    metadata?: unknown;
    createdAt: string;
  }>;
};

export function mapApiUserRow(row: ApiUserRow, adminEmail?: string): User {
  const balance = Number(row.wallet?.fiatBalance ?? 0);
  const isAdmin = ADMIN_EMAILS.has(row.email.toLowerCase());

  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone ?? undefined,
    role: isAdmin ? "GOD_ADMIN" : "USER",
    tier: row.tier as UserTier,
    kycStatus: mapKycStatus(row.kycStatus),
    accreditationStatus: row.accreditationStatus as User["accreditationStatus"],
    createdAt: row.createdAt,
    isFrozen: false,
    isSuspended: !row.isActive,
    isBlocked: !row.isActive,
    tradingEnabled: true,
    profitHold: false,
    profitMultiplier: 1,
    balance,
    lastLogin: row.lastLoginAt ?? undefined,
    country: "",
    trades: 0,
    transactions: (row.transactions ?? []).map((t) =>
      mapDbTransaction(t, adminEmail),
    ),
  };
}

export function mapMeToUser(
  me: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    tier: string;
    kycStatus: string;
    accreditationStatus: string;
    createdAt: string;
    wallet?: { fiatBalance: unknown } | null;
  },
): User {
  return mapApiUserRow({
    ...me,
    isActive: true,
    transactions: [],
  });
}

/** Preserve client-only admin fields; overwrite server-backed fields. */
export function mergeUsersFromServer(
  localUsers: User[],
  serverRows: ApiUserRow[],
  adminEmail?: string,
): User[] {
  const byEmail = new Map(
    localUsers.map((u) => [u.email.toLowerCase(), u]),
  );
  const byId = new Map(localUsers.map((u) => [u.id, u]));

  return serverRows.map((row) => {
    const fromServer = mapApiUserRow(row, adminEmail);
    const local =
      byId.get(row.id) ?? byEmail.get(row.email.toLowerCase());
    if (!local) return fromServer;
    return {
      ...local,
      ...fromServer,
      profitRate: local.profitRate,
      profitMode: local.profitMode,
      profitSchedule: local.profitSchedule,
      profitMultiplier: local.profitMultiplier,
      profitHold: local.profitHold,
      unlockedRails: local.unlockedRails,
      isFrozen: local.isFrozen,
      isBlocked: local.isBlocked,
      isSuspended: local.isSuspended,
      tradingEnabled: local.tradingEnabled,
      transactions: fromServer.transactions?.length
        ? fromServer.transactions
        : local.transactions,
    };
  });
}

export function mapAuthLoginUser(
  apiUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tier: string;
    kycStatus: string;
    accreditationStatus?: string;
  },
  balance = 0,
): User {
  const isAdmin = ADMIN_EMAILS.has(apiUser.email.toLowerCase());
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    role: isAdmin ? "GOD_ADMIN" : "USER",
    tier: apiUser.tier as UserTier,
    kycStatus: mapKycStatus(apiUser.kycStatus),
    accreditationStatus:
      (apiUser.accreditationStatus as User["accreditationStatus"]) ??
      "NOT_ACCREDITED",
    createdAt: new Date().toISOString(),
    isFrozen: false,
    isSuspended: false,
    isBlocked: false,
    tradingEnabled: true,
    profitHold: false,
    profitMultiplier: 1,
    balance,
    country: "",
    trades: 0,
  };
}
