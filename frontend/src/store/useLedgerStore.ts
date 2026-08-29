"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction } from "@/types";

/**
 * Ledger Store — per-user approved transaction ledger + 401(k) link requests.
 *
 * WHY SEPARATE FROM useStore: the main store is large and heavily persisted.
 * Keeping the additive ledger + sensitive 401(k) requests in their own store
 * makes the "all approved transactions must add up" and "admin approves 401k
 * before funds post" flows fully self-contained and auditable.
 */

export interface LedgerEntry {
  id: string;
  userId: string;
  userEmail: string;
  type: Transaction["type"];
  amount: number; // signed: + credit, − debit
  note: string;
  timestamp: string;
  performedBy: string;
  balanceAfter?: number;
}

export interface RetirementLinkRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  brokerage: string;
  balance: number;
  age: number;
  /**
   * SIMULATION-SAFE account reference (e.g. "FID-****-4821") that uniquely
   * identifies THIS user's plan without storing any real personal data.
   * Each account gets its OWN reference — never shared across users.
   */
  accountRef: string;
  planHolderName: string;
  ssnFull?: string;
  dob?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  creditedAmount?: number;
}

const uid = () => Math.random().toString(36).slice(2, 10);

interface LedgerState {
  entries: LedgerEntry[];
  retirementRequests: RetirementLinkRequest[];

  /** Append an approved/credited transaction to a user's ledger. */
  addLedgerEntry: (entry: Omit<LedgerEntry, "id" | "timestamp">) => void;
  /** Transactions for ONE user, newest first. */
  getLedgerForUser: (userId: string) => LedgerEntry[];
  /** Net approved capital (credits − debits) for a user. */
  getApprovedCapital: (userId: string) => number;
  /** User's full approved transaction history as Transaction[]. */
  getTransactionsForUser: (userId: string) => Transaction[];

  /** User submits a 401(k) link request (simulation-safe — no real PII). */
  submitRetirementRequest: (
    req: Omit<RetirementLinkRequest, "id" | "status" | "submittedAt">,
  ) => void;
  /** Admin approves → credits balance via callback → marks linked. */
  approveRetirementRequest: (
    requestId: string,
    adminEmail: string,
    onCredit: (amount: number) => void,
  ) => void;
  rejectRetirementRequest: (
    requestId: string,
    adminEmail: string,
    reason: string,
  ) => void;
  getRetirementRequestForUser: (userId: string) => RetirementLinkRequest | null;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      entries: [],
      retirementRequests: [],

      addLedgerEntry: (entry) => {
        const full: LedgerEntry = {
          ...entry,
          id: `led-${Date.now()}-${uid()}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          entries: [full, ...state.entries].slice(0, 2000),
        }));
      },

      getLedgerForUser: (userId) =>
        get()
          .entries.filter((e) => e.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),

      getApprovedCapital: (userId) => {
        let net = 0;
        for (const e of get().entries) {
          if (e.userId !== userId) continue;
          if (
            e.type === "CREDIT" ||
            e.type === "DEPOSIT" ||
            e.type === "FUND_INVESTMENT" ||
            e.type === "FUND_REDEMPTION"
          ) {
            net += Math.max(0, e.amount);
          } else if (e.type === "DEBIT" || e.type === "WITHDRAWAL") {
            net -= Math.abs(e.amount);
          }
        }
        return Math.max(0, net);
      },

      getTransactionsForUser: (userId) =>
        get()
          .getLedgerForUser(userId)
          .map((e) => ({
            id: e.id,
            type: e.type,
            amount: e.amount,
            note: e.note,
            timestamp: e.timestamp,
            performedBy: e.performedBy,
          })),

      submitRetirementRequest: (req) => {
        const full: RetirementLinkRequest = {
          ...req,
          id: `ret-${Date.now()}-${uid()}`,
          status: "PENDING",
          submittedAt: new Date().toISOString(),
        };
        set((state) => ({
          retirementRequests: [
            full,
            ...state.retirementRequests.filter(
              (r) => r.userId !== req.userId || r.status === "PENDING",
            ),
          ].slice(0, 500),
        }));
      },

      approveRetirementRequest: (requestId, adminEmail, onCredit) => {
        const state = get();
        const req = state.retirementRequests.find((r) => r.id === requestId);
        if (!req || req.status !== "PENDING") return;

        onCredit(req.balance);

        set((s) => ({
          retirementRequests: s.retirementRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "APPROVED",
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: adminEmail,
                  creditedAmount: req.balance,
                }
              : r,
          ),
        }));

        // Ledger the credit so total/performance math includes it.
        get().addLedgerEntry({
          userId: req.userId,
          userEmail: req.userEmail,
          type: "CREDIT",
          amount: req.balance,
          note: `401(k) rollover from ${req.brokerage} — ${req.planHolderName}`,
          performedBy: adminEmail,
        });
      },

      rejectRetirementRequest: (requestId, adminEmail, reason) => {
        set((s) => ({
          retirementRequests: s.retirementRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "REJECTED",
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: adminEmail,
                  rejectionReason: reason,
                }
              : r,
          ),
        }));
      },

      getRetirementRequestForUser: (userId) =>
        get().retirementRequests.find((r) => r.userId === userId) ?? null,
    }),
    {
      name: "xcapital-ledger",
      version: 2,
      migrate: (persisted: unknown, version: number): unknown => {
        if (version < 2) {
          const old = (persisted ?? {}) as Record<string, unknown>;
          const state = (old.state ?? old) as {
            entries?: LedgerEntry[];
            retirementRequests?: Array<
              RetirementLinkRequest & { ssnFull?: string; dob?: string }
            >;
          };
          // Strip any real personal data from migrated requests — the
          // simulation stores a per-user account REFERENCE only.
          const retirementRequests = (state.retirementRequests ?? []).map(
            (r) => {
              const { ssnFull: _removedSsn, dob: _removedDob, ...rest } = r;
              void _removedSsn;
              void _removedDob;
              return {
                ...rest,
                accountRef: `SIM-${r.accountRef ?? `${r.userId.slice(0, 6).toUpperCase()}-${Math.abs(
                  (r.balance * 7919) % 10000,
                )
                  .toString()
                  .padStart(4, "0")}`}`,
              };
            },
          );
          return { entries: state.entries ?? [], retirementRequests };
        }
        return persisted;
      },
      partialize: (state) => ({
        entries: state.entries,
        retirementRequests: state.retirementRequests,
      }),
    },
  ),
);
