import { walletAPI, fundsAPI } from "@/lib/api";
import type { PendingTransaction, AdminAlert } from "@/store/useStore";

type EmitParams = {
  tx: PendingTransaction;
  addPendingTransaction: (tx: PendingTransaction) => void;
  addAdminAlert: (
    alert: Omit<AdminAlert, "id" | "createdAt" | "read" | "status">,
  ) => string;
};

/** Hybrid: API when live, always local admin alert + pending queue */
export async function emitCapitalSignal({
  tx,
  addPendingTransaction,
  addAdminAlert,
}: EmitParams): Promise<void> {
  addPendingTransaction(tx);

  addAdminAlert({
    type:
      tx.type === "FUND_INVEST"
        ? "FUND_INVEST"
        : tx.type === "WITHDRAWAL"
          ? "WITHDRAW"
          : "DEPOSIT",
    userId: tx.userId,
    userEmail: tx.userEmail,
    userName: tx.userName,
    amount: tx.amount,
    method: tx.method,
    priority: "HIGH",
    pendingTxId: tx.id,
    metadata: {
      ...tx.details,
      fundId: tx.fundId ?? "",
      fundName: tx.fundName ?? "",
    },
  });

  if (tx.type === "DEPOSIT") {
    try {
      await walletAPI.deposit(tx.amount, tx.method);
    } catch {
      /* API offline — local queue handles approval */
    }
  } else if (tx.type === "WITHDRAWAL") {
    try {
      await walletAPI.withdraw(tx.amount, tx.details.bankAccountId ?? "default");
    } catch {
      /* local queue */
    }
  } else if (tx.type === "FUND_INVEST" && tx.fundId) {
    try {
      await fundsAPI.invest(tx.fundId, tx.amount);
    } catch {
      /* local queue */
    }
  }
}

/** Instant detection when user enters amount (before final submit) */
export function detectCapitalSignalPreview(
  amount: string,
  user: { id: string; email: string; firstName?: string; lastName?: string } | null,
  method: string,
  addAdminAlert: EmitParams["addAdminAlert"],
  type: AdminAlert["type"] = "DEPOSIT",
): void {
  const parsed = parseFloat(amount);
  if (!parsed || parsed <= 0 || !user) return;

  addAdminAlert({
    type,
    userId: user.id,
    userEmail: user.email,
    userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    amount: parsed,
    method,
    priority: "HIGH",
    metadata: { stage: "DETECTED", note: "Amount entered — awaiting confirmation" },
  });
}
