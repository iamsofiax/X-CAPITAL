"use client";

import { AdminModal, Field, SelectField } from "./deskUi";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

type FundTxType =
  | "auto"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRADE"
  | "FUND_INVESTMENT"
  | "FUND_REDEMPTION"
  | "FEE";

type EditForm = { firstName: string; lastName: string; email: string; phone: string; tier: string; country: string };
type ProfitForm = { profitRate: number; profitMode: string; profitSchedule: string; profitMultiplier: number; profitHold: boolean };

export function OperatorDeskModals({
  rejectModal,
  rejectReason,
  setRejectReason,
  onCloseReject,
  onConfirmReject,
  fundModal,
  fundAmount,
  setFundAmount,
  fundNote,
  setFundNote,
  fundTxType,
  setFundTxType,
  fundAsUser,
  setFundAsUser,
  onCloseFund,
  onConfirmFund,
  editModal,
  editForm,
  setEditForm,
  onCloseEdit,
  onSaveEdit,
  profitModal,
  profitForm,
  setProfitForm,
  onCloseProfit,
  onSaveProfit,
  backdateModal,
  backdateValue,
  setBackdateValue,
  onCloseBackdate,
  onSaveBackdate,
}: {
  rejectModal: string | null;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  onCloseReject: () => void;
  onConfirmReject: () => void;
  fundModal: { userId: string; mode: "fund" | "debit" } | null;
  fundAmount: string;
  setFundAmount: (v: string) => void;
  fundNote: string;
  setFundNote: (v: string) => void;
  fundTxType: FundTxType;
  setFundTxType: (v: FundTxType) => void;
  fundAsUser: boolean;
  setFundAsUser: (v: boolean) => void;
  onCloseFund: () => void;
  onConfirmFund: () => void;
  editModal: User | null;
  editForm: EditForm;
  setEditForm: (v: EditForm) => void;
  onCloseEdit: () => void;
  onSaveEdit: () => void;
  profitModal: User | null;
  profitForm: ProfitForm;
  setProfitForm: (v: ProfitForm) => void;
  onCloseProfit: () => void;
  onSaveProfit: () => void;
  backdateModal: User | null;
  backdateValue: string;
  setBackdateValue: (v: string) => void;
  onCloseBackdate: () => void;
  onSaveBackdate: () => void;
}) {
  return (
    <>
      {rejectModal && (
        <AdminModal title="Reject Transaction" onClose={onCloseReject}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Provide a reason for rejecting this transaction (optional).</p>
            <Field label="Reason" value={rejectReason} onChange={setRejectReason} placeholder="e.g. Suspicious activity, invalid details..." />
            <button onClick={onConfirmReject} className="w-full py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition">
              Reject Transaction
            </button>
          </div>
        </AdminModal>
      )}
      {fundModal && (
        <AdminModal
          title={fundModal.mode === "fund" ? "Fund Account" : "Debit Account"}
          onClose={onCloseFund}
        >
          <div className="space-y-4">
            <Field label="Amount (USD)" value={fundAmount} type="number" onChange={setFundAmount} placeholder="0.00" />
            <Field
              label="Note / Description"
              value={fundNote}
              onChange={setFundNote}
              placeholder={fundModal.mode === "fund" ? "e.g. Wire transfer — JPMorgan Chase" : "e.g. ACH withdrawal — Chase ····8291"}
            />
            <SelectField
              label="Transaction Type"
              value={fundTxType}
              options={["auto", "DEPOSIT", "WITHDRAWAL", "TRADE", "FUND_INVESTMENT", "FUND_REDEMPTION", "FEE"]}
              onChange={(v) => setFundTxType(v as FundTxType)}
            />
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-white">Show as user activity</p>
                  <p className="text-xs text-gray-500">Hides admin identity — appears as organic user action</p>
                </div>
                <button
                  onClick={() => setFundAsUser(!fundAsUser)}
                  className={cn("relative w-11 h-6 rounded-full transition-colors", fundAsUser ? "bg-emerald-600" : "bg-white/10")}
                >
                  <div className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform", fundAsUser && "translate-x-5")} />
                </button>
              </div>
            </div>
            <button
              onClick={onConfirmFund}
              className={cn("w-full py-2.5 rounded-lg text-sm font-medium transition", fundModal.mode === "fund" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500")}
            >
              {fundModal.mode === "fund" ? "Credit Funds" : "Debit Funds"}
            </button>
          </div>
        </AdminModal>
      )}
      {editModal && (
        <AdminModal title="Edit User Profile" onClose={onCloseEdit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={editForm.firstName} onChange={(v) => setEditForm({ ...editForm, firstName: v })} />
              <Field label="Last Name" value={editForm.lastName} onChange={(v) => setEditForm({ ...editForm, lastName: v })} />
            </div>
            <Field label="Email" value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} />
            <Field label="Phone" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Tier" value={editForm.tier} options={["CORE", "GOLD", "BLACK"]} onChange={(v) => setEditForm({ ...editForm, tier: v })} />
              <Field label="Country" value={editForm.country} onChange={(v) => setEditForm({ ...editForm, country: v })} />
            </div>
            <button onClick={onSaveEdit} className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition">
              Save Changes
            </button>
          </div>
        </AdminModal>
      )}
      {profitModal && (
        <AdminModal title={`Profit Config — ${profitModal.firstName}`} onClose={onCloseProfit}>
          <div className="space-y-4">
            <Field label="Daily Profit Rate (%)" value={String(profitForm.profitRate)} type="number" onChange={(v) => setProfitForm({ ...profitForm, profitRate: parseFloat(v) || 0 })} placeholder="1.5" />
            <SelectField label="Profit Mode" value={profitForm.profitMode} options={["linear", "compound"]} onChange={(v) => setProfitForm({ ...profitForm, profitMode: v })} />
            <Field label="Multiplier" value={String(profitForm.profitMultiplier)} type="number" onChange={(v) => setProfitForm({ ...profitForm, profitMultiplier: parseFloat(v) || 1 })} placeholder="1.0" />
            <button
              type="button"
              onClick={() => setProfitForm({ ...profitForm, profitHold: !profitForm.profitHold })}
              className={cn("w-full py-2.5 rounded-lg text-sm font-medium border transition", profitForm.profitHold ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-white/[0.03] border-white/[0.08] text-white/60")}
            >
              {profitForm.profitHold ? "Yield on hold — accrual paused" : "Yield running — click to hold"}
            </button>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-xs text-gray-400">
              <p className="font-medium text-white/60 mb-1">Accrual Core</p>
              <p><strong>Linear</strong> — flat % of approved capital. <strong>Compound</strong> — yield on the running cash balance. Hold advances the clock without a lump when released.</p>
            </div>
            <button onClick={onSaveProfit} className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition">
              Apply Profit Config
            </button>
          </div>
        </AdminModal>
      )}
      {backdateModal && (
        <AdminModal title={`Backdate — ${backdateModal.firstName}`} onClose={onCloseBackdate}>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Change when this account appears to have been created.</p>
            <Field label="Account Creation Date" value={backdateValue} type="date" onChange={setBackdateValue} />
            <button onClick={onSaveBackdate} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition">
              Update Creation Date
            </button>
          </div>
        </AdminModal>
      )}
    </>
  );
}
