import { adminAPI } from "@/lib/api";
import { hasApiToken } from "@/lib/apiUser";
import { generateWithdrawalReceiptPdf } from "@/lib/withdrawalPdf";
import { CRYPTO_RATES } from "@/components/admin/cryptoRates";
import { formatCurrency } from "@/lib/utils";
import type { PendingTransaction, KYCSubmission } from "@/store/useStore";
import type { User } from "@/types";

export function trackOfflineAdminEvent() {
  try {
    const key = "xc_admin_offline_events";
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
    existing.push(new Date().toISOString());
    localStorage.setItem(key, JSON.stringify(existing.slice(-20)));
  } catch {
    /* storage unavailable */
  }
}

export async function approveDeskTransaction(opts: {
  tx: PendingTransaction;
  adminEmail: string;
  approveLocal: (
    txId: string,
    adminEmail: string,
    serverBalance?: number,
    forceLocal?: boolean,
    skipNotification?: boolean,
  ) => void;
  addNotification: (n: {
    id: string; userId: string; title: string; message: string; type: "transaction";
    externalLink?: string; externalLinkLabel?: string; read: boolean; createdAt: string;
  }) => void;
  loadUsers: () => Promise<unknown>;
  syncSession: () => Promise<unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const { tx, adminEmail } = opts;
  const usdAmount = tx.currency === "USD" ? tx.amount : tx.amount * (CRYPTO_RATES[tx.currency] || 1);
  if (hasApiToken()) {
    try {
      await adminAPI.adjustBalance(tx.userId, {
        amount: usdAmount,
        direction: tx.type === "DEPOSIT" ? "credit" : "debit",
        note: `${tx.method.toUpperCase()} ${tx.type.toLowerCase()} approved`,
        txType: tx.type === "DEPOSIT" ? "DEPOSIT" : "WITHDRAWAL",
      });
      opts.approveLocal(tx.id, adminEmail, undefined, false, true);
      await opts.loadUsers();
      await opts.syncSession();
    } catch {
      trackOfflineAdminEvent();
      return { ok: false, error: "Network unreachable. Approval was not posted." };
    }
  } else {
    opts.approveLocal(tx.id, adminEmail, undefined, false, true);
  }

  let pdfUrl: string | undefined;
  if (tx.type === "WITHDRAWAL") {
    try {
      pdfUrl = generateWithdrawalReceiptPdf({
        reference: tx.details?.reference ?? `XCW-${tx.id.slice(-8).toUpperCase()}`,
        userName: tx.userName,
        userEmail: tx.userEmail,
        amount: tx.amount,
        currency: tx.currency,
        method: tx.method,
        destination: tx.method === "wire" ? tx.details?.destinationBank ?? "ACH · JPMorgan Chase ···· 8291" : tx.details?.coin ? `Crypto wallet (${tx.details.coin})` : "Crypto wallet",
        swift: tx.method === "wire" ? tx.details?.swift ?? "CHASUS33" : undefined,
        coin: tx.method === "crypto" ? tx.details?.coin : undefined,
        network: tx.method === "crypto" ? tx.details?.network : undefined,
        address: tx.method === "crypto" ? tx.details?.withdrawAddress : undefined,
        approvedAt: new Date().toISOString(),
        adminEmail,
      });
    } catch {
      pdfUrl = undefined;
    }
  }

  opts.addNotification({
    id: `n-${Math.random().toString(36).slice(2, 10)}`,
    userId: tx.userId,
    title: `${tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} Approved`,
    message: `Your ${tx.method} ${tx.type.toLowerCase()} of ${tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`} has been approved.`,
    type: "transaction",
    ...(pdfUrl && { externalLink: pdfUrl, externalLinkLabel: "Download Receipt (PDF)" }),
    read: false,
    createdAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function rejectDeskTransaction(txId: string, reason?: string): Promise<{ ok: boolean }> {
  if (!hasApiToken()) return { ok: true };
  try {
    await adminAPI.rejectByTransactionId(txId, reason || "Signal denied by operator");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function applyKycApprove(sub: KYCSubmission | undefined, user: User, actor: string, store: {
  approveKYC: (id: string, actor: string) => void;
  updateUserById: (id: string, u: Partial<User>) => void;
  addNotification: (n: { id: string; userId: string; title: string; message: string; type: "system"; read: boolean; createdAt: string }) => void;
}) {
  if (sub) store.approveKYC(sub.id, actor);
  else store.updateUserById(user.id, { kycStatus: "APPROVED" });
  store.addNotification({
    id: Math.random().toString(36).slice(2, 10),
    userId: user.id,
    title: "KYC Approved",
    message: "Your identity has been verified. All rails are now accessible.",
    type: "system",
    read: false,
    createdAt: new Date().toISOString(),
  });
}
