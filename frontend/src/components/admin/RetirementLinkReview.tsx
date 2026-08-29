"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Landmark,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLedgerStore } from "@/store/useLedgerStore";
import { useStore } from "@/store/useStore";
import { adminAPI } from "@/lib/api";
import { hasApiToken } from "@/lib/apiUser";

/**
 * RetirementLinkReview — admin review queue for 401(k) link requests.
 *
 * The user submits their full SSN + DOB + plan holder name. The admin:
 *   1. Reviews the FULL SSN (masked by default, click to reveal)
 *   2. Verifies the provider details
 *   3. Approves → the ledger store credits the user's balance + adds the
 *      CREDIT ledger entry (funds then appear on the user's wallet/portfolio)
 *   4. Or Rejects with a reason → user is returned to the details form
 */

function maskSsn(ssn: string): string {
  const digits = ssn.replace(/\D/g, "");
  if (digits.length !== 9) return "•••-••-••••";
  return `•••-••-${digits.slice(5)}`;
}

export default function RetirementLinkReview() {
  const {
    user: adminUser,
    registeredUsers,
    updateUserById,
    addNotification,
    loadAdminUsersFromApi,
  } = useStore();
  const {
    retirementRequests,
    approveRetirementRequest,
    rejectRetirementRequest,
  } = useLedgerStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedSsn, setRevealedSsn] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState("");

  const sorted = useMemo(
    () =>
      [...retirementRequests].sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;
        return (
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime()
        );
      }),
    [retirementRequests],
  );

  const pendingCount = retirementRequests.filter(
    (r) => r.status === "PENDING",
  ).length;

  const handleApprove = async (requestId: string) => {
    const req = retirementRequests.find((r) => r.id === requestId);
    if (!req || req.status !== "PENDING") return;
    setNotice("");

    if (hasApiToken()) {
      try {
        await adminAPI.adjustBalance(req.userId, {
          amount: req.balance,
          direction: "credit",
          note: `401(k) ${req.brokerage} link approved`,
          txType: "DEPOSIT",
        });
        await loadAdminUsersFromApi();
      } catch {
        setNotice("Network unreachable. 401(k) was not funded.");
        return;
      }
    }

    approveRetirementRequest(
      requestId,
      adminUser?.email ?? "admin",
      (amount) => {
        if (!hasApiToken()) {
          const target = registeredUsers.find((u) => u.id === req.userId);
          updateUserById(req.userId, {
            balance: (target?.balance ?? 0) + amount,
          });
        }
        addNotification({
          id: `notif-401k-approved-${Date.now()}`,
          userId: req.userId,
          title: "401(k) link approved & funded",
          message: `${req.brokerage} — ${formatCurrency(amount)} has been credited to your cash. Your plan is now compounding.`,
          type: "congratulations" as const,
          read: false,
          createdAt: new Date().toISOString(),
        });
      },
    );
    setExpandedId(null);
  };

  const handleReject = (requestId: string) => {
    if (!rejectReason.trim()) return;
    const req = retirementRequests.find((r) => r.id === requestId);
    rejectRetirementRequest(requestId, adminUser?.email ?? "admin", rejectReason.trim());
    if (req) {
      addNotification({
        id: `notif-401k-rejected-${Date.now()}`,
        userId: req.userId,
        title: "401(k) link not approved",
        message: `Your ${req.brokerage} link request was not approved. Reason: ${rejectReason.trim()}. Please resubmit with correct details.`,
        type: "system",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    setRejectTarget(null);
    setRejectReason("");
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-12 text-center">
        <Landmark size={40} className="text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No 401(k) link requests</p>
        <p className="text-gray-600 text-xs mt-1">
          When users submit plan details for linking, they appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <p className="text-xs text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300">
          <Clock size={14} className="shrink-0" />
          <span>
            <strong>{pendingCount}</strong> 401(k) link request
            {pendingCount > 1 ? "s" : ""} awaiting your approval.
          </span>
        </div>
      )}

      {sorted.map((req) => {
        const expanded = expandedId === req.id;
        const revealed = revealedSsn === req.id;
        return (
          <div
            key={req.id}
            className={cn(
              "bg-[#12121a] border rounded-xl overflow-hidden",
              req.status === "PENDING"
                ? "border-amber-500/30"
                : req.status === "APPROVED"
                  ? "border-emerald-500/30"
                  : "border-red-500/20",
            )}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedId(expanded ? null : req.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition text-left"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
                <Landmark size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">
                    {req.userName}
                  </span>
                  <span className="text-xs text-gray-500">{req.userEmail}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    {req.brokerage} · {formatCurrency(req.balance)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                      req.status === "PENDING"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : req.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30",
                    )}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
              {expanded ? (
                <ChevronUp size={16} className="text-gray-500" />
              ) : (
                <ChevronDown size={16} className="text-gray-500" />
              )}
            </button>

            {/* Expanded review */}
            {expanded && (
              <div className="px-5 pb-5 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 text-xs">
                  {[
                    ["Provider", req.brokerage],
                    ["Plan Holder", req.planHolderName],
                    ["Balance", formatCurrency(req.balance)],
                    ["Age", `${req.age} yrs`],
                    ["Date of Birth", req.dob],
                    ["Submitted", new Date(req.submittedAt).toLocaleString()],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-gray-600 uppercase tracking-wider text-[10px]">
                        {label}
                      </p>
                      <p className="text-gray-300 mt-0.5 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* FULL SSN — masked by default, reveal for verification */}
                <div className="mb-4 bg-black/30 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                      Full SSN (verification)
                    </p>
                    <p className="text-sm font-mono font-bold text-white mt-0.5">
                      {revealed ? req.ssnFull ?? "—" : maskSsn(req.ssnFull ?? "")}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setRevealedSsn(revealed ? null : req.id)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition"
                  >
                    {revealed ? (
                      <>
                        <EyeOff size={12} /> Hide SSN
                      </>
                    ) : (
                      <>
                        <Eye size={12} /> Reveal SSN
                      </>
                    )}
                  </button>
                </div>

                {req.status === "APPROVED" && (
                  <div className="mb-4 text-xs text-emerald-400 flex items-center gap-2">
                    <ShieldCheck size={14} />
                    Linked & funded {formatCurrency(req.creditedAmount ?? req.balance)} · reviewed by {req.reviewedBy} on{" "}
                    {req.reviewedAt
                      ? new Date(req.reviewedAt).toLocaleString()
                      : ""}
                  </div>
                )}
                {req.status === "REJECTED" && (
                  <div className="mb-4 text-xs text-red-400">
                    Rejected by {req.reviewedBy}: {req.rejectionReason}
                  </div>
                )}

                {req.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition"
                    >
                      <CheckCircle size={14} />
                      Verify Link & Credit Funds
                    </button>
                    {rejectTarget === req.id ? (
                      <div className="flex-1 space-y-2 min-w-[240px]">
                        <input
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason (required)…"
                          className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={!rejectReason.trim()}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-xs font-bold transition",
                              rejectReason.trim()
                                ? "bg-red-600 text-white hover:bg-red-500"
                                : "bg-red-600/20 text-red-400/50 cursor-not-allowed",
                            )}
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => {
                              setRejectTarget(null);
                              setRejectReason("");
                            }}
                            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectTarget(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
