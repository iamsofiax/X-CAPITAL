"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, type AuditEntry, type UserNotification, type KYCSubmission } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { adminAPI } from "@/lib/api";
import { hasApiToken } from "@/lib/apiUser";
import { Toast, type AdminTab } from "@/components/admin/deskUi";
import { AdminDeskHeader, AdminDeskStats, AdminTabNav } from "@/components/admin/AdminDeskChrome";
import { TransactionsTab } from "@/components/admin/TransactionsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import {
  AuditTab,
  CommerceTab,
  CreateUserTab,
  DepositAddressesTab,
  KycTab,
  NotificationsTab,
  RailsTab,
  SpikesTab,
  TosTab,
} from "@/components/admin/deskTabs";
import { OperatorDeskModals } from "@/components/admin/AdminDeskModals";
import { approveDeskTransaction, rejectDeskTransaction, applyKycApprove } from "@/components/admin/operatorMutations";
import { Shield, Activity } from "lucide-react";
import type { User, Transaction } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const {
    user: currentUser,
    isAuthenticated,
    registeredUsers,
    updateUserById,
    deleteUserById,
    createUserAsAdmin,
    addAuditEntry,
    auditLog,
    logout,
    pendingTransactions,
    approvePendingTransaction,
    rejectPendingTransaction,
    notifications,
    addNotification,
    deleteNotification,
    termsOfService,
    setTermsOfService,
    kycSubmissions,
    approveKYC,
    rejectKYC,
    loadAdminUsersFromApi,
    syncSessionFromApi,
  } = useStore();

  const isAdmin =
    isAuthenticated &&
    currentUser &&
    (currentUser.role === "GOD_ADMIN" || currentUser.role === "ADMIN");

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("transactions");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [serverUnreachable, setServerUnreachable] = useState(false);
  const [deskAudit, setDeskAudit] = useState<AuditEntry[]>([]);
  const [userNextCursor, setUserNextCursor] = useState<string | null>(null);
  const [userTotal, setUserTotal] = useState<number | null>(null);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [auditNextCursor, setAuditNextCursor] = useState<string | null>(null);
  const [loadingMoreAudit, setLoadingMoreAudit] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [fundModal, setFundModal] = useState<{ userId: string; mode: "fund" | "debit" } | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [fundAsUser, setFundAsUser] = useState(false);
  const [fundTxType, setFundTxType] = useState<"auto" | "DEPOSIT" | "WITHDRAWAL" | "TRADE" | "FUND_INVESTMENT" | "FUND_REDEMPTION" | "FEE">("auto");
  const [editModal, setEditModal] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "", tier: "CORE", country: "" });
  const [profitModal, setProfitModal] = useState<User | null>(null);
  const [profitForm, setProfitForm] = useState({ profitRate: 1.5, profitMode: "compound", profitSchedule: "daily", profitMultiplier: 1, profitHold: false });
  const [backdateModal, setBackdateModal] = useState<User | null>(null);
  const [backdateValue, setBackdateValue] = useState("");
  const [createForm, setCreateForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "USER", tier: "CORE" });
  const [notifForm, setNotifForm] = useState({ userId: "", title: "", message: "", type: "congratulations" as UserNotification["type"], externalLink: "", externalLinkLabel: "" });
  const [tosContent, setTosContent] = useState(termsOfService);
  const [tosEditing, setTosEditing] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") =>
      setToast({ message, type }),
    [],
  );

  const allUsers = useMemo(() => {
    const users = registeredUsers || [];
    if (hasApiToken() || !search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q),
    );
  }, [registeredUsers, search]);

  const pendingCount = useMemo(
    () => pendingTransactions.filter((t) => t.status === "PENDING").length,
    [pendingTransactions],
  );

  const stats = useMemo(() => {
    const users = registeredUsers || [];
    return {
      total: userTotal ?? users.length,
      totalBalance: users.reduce((s, u) => s + (u.balance ?? 0), 0),
      frozenCount: users.filter((u) => u.isFrozen).length,
      blockedCount: users.filter((u) => u.isBlocked).length,
      tradingCount: users.filter((u) => u.tradingEnabled !== false).length,
    };
  }, [registeredUsers, userTotal]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isAdmin || !hasApiToken()) return;
    void loadAdminUsersFromApi({ q: debouncedSearch || undefined }).then((result) => {
      setUserNextCursor(result.nextCursor);
      setUserTotal(result.total);
    });
  }, [isAdmin, debouncedSearch, loadAdminUsersFromApi]);

  useEffect(() => {
    if (!isAdmin || !hasApiToken() || activeTab !== "audit") return;
    void adminAPI.listAudit({ limit: 50 }).then((res) => {
      const rows = (res.data?.data ?? []) as Array<{
        id: string; createdAt: string; actorEmail: string; action: string; target: string; level: string;
      }>;
      setDeskAudit(rows.map((r) => ({
        id: r.id, time: r.createdAt, actor: r.actorEmail, action: r.action, target: r.target,
        level: (r.level as AuditEntry["level"]) || "action",
      })));
      setAuditNextCursor(typeof res.data?.nextCursor === "string" ? res.data.nextCursor : null);
    }).catch(() => undefined);
  }, [isAdmin, activeTab]);

  const audit = useCallback((action: string, target: string, level: AuditEntry["level"] = "action") => {
    addAuditEntry({
      id: Math.random().toString(36).slice(2, 10),
      time: new Date().toISOString(),
      actor: currentUser?.email || "admin",
      action, target, level,
    });
  }, [addAuditEntry, currentUser]);

  const handleLoadMoreUsers = async () => {
    if (!userNextCursor || loadingMoreUsers) return;
    setLoadingMoreUsers(true);
    try {
      const result = await loadAdminUsersFromApi({ cursor: userNextCursor, q: debouncedSearch || undefined, append: true });
      setUserNextCursor(result.nextCursor);
      if (result.total != null) setUserTotal(result.total);
    } finally {
      setLoadingMoreUsers(false);
    }
  };

  const handleLoadMoreAudit = async () => {
    if (!auditNextCursor || loadingMoreAudit) return;
    setLoadingMoreAudit(true);
    try {
      const res = await adminAPI.listAudit({ limit: 50, cursor: auditNextCursor });
      const rows = (res.data?.data ?? []) as Array<{ id: string; createdAt: string; actorEmail: string; action: string; target: string; level: string }>;
      setDeskAudit((prev) => [...prev, ...rows.map((r) => ({ id: r.id, time: r.createdAt, actor: r.actorEmail, action: r.action, target: r.target, level: (r.level as AuditEntry["level"]) || "action" }))]);
      setAuditNextCursor(typeof res.data?.nextCursor === "string" ? res.data.nextCursor : null);
    } catch { /* keep page */ } finally {
      setLoadingMoreAudit(false);
    }
  };

  const handleApprove = async (txId: string) => {
    const tx = pendingTransactions.find((t) => t.id === txId);
    if (!tx) return;
    const result = await approveDeskTransaction({
      tx,
      adminEmail: currentUser?.email || "admin",
      approveLocal: approvePendingTransaction,
      addNotification,
      loadUsers: () => loadAdminUsersFromApi(),
      syncSession: syncSessionFromApi,
    });
    if (!result.ok) {
      setServerUnreachable(true);
      showToast(result.error || "Approval was not posted.", "error");
      return;
    }
    audit(`Approved ${tx.type.toLowerCase()}`, tx.userEmail, "success");
    showToast(`${tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} approved for ${tx.userName}`);
  };

  const handleRejectTx = async (txId: string) => {
    const tx = pendingTransactions.find((t) => t.id === txId);
    if (!tx) return;
    const posted = await rejectDeskTransaction(txId, "Signal denied by operator");
    if (!posted.ok) {
      setServerUnreachable(true);
      showToast("Desk did not accept the denial.", "error");
      return;
    }
    rejectPendingTransaction(txId, currentUser?.email || "admin", "Signal denied by operator");
    addNotification({
      id: `n-${Math.random().toString(36).slice(2, 10)}`,
      userId: tx.userId,
      title: "Signal denied",
      message: `Your ${tx.type.toLowerCase()} was not cleared.`,
      type: "transaction",
      read: false,
      createdAt: new Date().toISOString(),
    });
    audit(`Rejected ${tx.type} for ${tx.userEmail}`, tx.userEmail, "warning");
    showToast(`Signal denied for ${tx.userName}`, "error");
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const tx = pendingTransactions.find((t) => t.id === rejectModal);
    if (!tx) return;
    const posted = await rejectDeskTransaction(rejectModal, rejectReason || undefined);
    if (!posted.ok) {
      setServerUnreachable(true);
      showToast("Desk did not accept the denial.", "error");
      return;
    }
    rejectPendingTransaction(rejectModal, currentUser?.email || "admin", rejectReason);
    addNotification({
      id: `n-${Math.random().toString(36).slice(2, 10)}`,
      userId: tx.userId,
      title: `${tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} Rejected`,
      message: `Your ${tx.method} ${tx.type.toLowerCase()} of ${tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`} was rejected.${rejectReason ? ` Reason: ${rejectReason}` : ""}`,
      type: "transaction",
      read: false,
      createdAt: new Date().toISOString(),
    });
    audit(`Rejected ${tx.type.toLowerCase()}`, tx.userEmail, "danger");
    showToast("Transaction rejected", "error");
    setRejectModal(null);
    setRejectReason("");
  };

  const handleKycApprove = (u: User) => {
    const sub = kycSubmissions.find((s) => s.userId === u.id && s.status === "PENDING");
    applyKycApprove(sub, u, currentUser?.email || "admin", { approveKYC, updateUserById, addNotification });
    audit("KYC_APPROVED", u.email, "success");
    showToast(`KYC approved for ${u.firstName}`);
  };

  const handleKycReject = (u: User) => {
    const sub = kycSubmissions.find((s) => s.userId === u.id && s.status === "PENDING");
    if (sub) rejectKYC(sub.id, currentUser?.email || "admin", "Rejected by admin");
    else updateUserById(u.id, { kycStatus: "REJECTED" });
    showToast(`KYC rejected for ${u.firstName}`, "error");
  };

  const handleKycApproveUser = (sub: KYCSubmission) => {
    const u = registeredUsers.find((x) => x.id === sub.userId) ?? {
      id: sub.userId, email: sub.userEmail, firstName: sub.userName, lastName: "",
    } as User;
    applyKycApprove(sub, u, currentUser?.email || "admin", { approveKYC, updateUserById, addNotification });
    audit("KYC_APPROVED", sub.userEmail, "success");
    showToast(`KYC approved for ${sub.userEmail}`);
  };

  const handleKycRejectSub = (sub: KYCSubmission, reason: string) => {
    rejectKYC(sub.id, currentUser?.email || "admin", reason);
    addNotification({
      id: Math.random().toString(36).slice(2, 10),
      userId: sub.userId,
      title: "KYC Rejected",
      message: `Your identity verification was not approved. Reason: ${reason}. Please resubmit.`,
      type: "system",
      read: false,
      createdAt: new Date().toISOString(),
    });
    audit("KYC_REJECTED", sub.userEmail, "danger");
    showToast(`KYC rejected for ${sub.userEmail}`, "error");
  };

  const handleSendNotification = () => {
    if (!notifForm.title || !notifForm.message) {
      showToast("Title and message required", "error");
      return;
    }
    const targets = notifForm.userId
      ? registeredUsers.filter((u) => u.id === notifForm.userId)
      : registeredUsers.filter((u) => u.role !== "GOD_ADMIN" && u.role !== "ADMIN");
    targets.forEach((u) => {
      addNotification({
        id: `n-${Math.random().toString(36).slice(2, 10)}`,
        userId: u.id,
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
        externalLink: notifForm.externalLink || undefined,
        externalLinkLabel: notifForm.externalLinkLabel || undefined,
        read: false,
        createdAt: new Date().toISOString(),
      });
    });
    showToast(`Notification sent to ${notifForm.userId ? "user" : `${targets.length} users`}`);
    setNotifForm({ userId: "", title: "", message: "", type: "congratulations", externalLink: "", externalLinkLabel: "" });
  };

  const handleCreateUser = async () => {
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
      showToast("Fill all required fields", "error");
      return;
    }
    const result = await createUserAsAdmin({
      firstName: createForm.firstName,
      lastName: createForm.lastName,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
      tier: createForm.tier,
    });
    if (result.success) {
      audit("Created user", createForm.email, "success");
      showToast(`User ${createForm.firstName} created`);
      setCreateForm({ firstName: "", lastName: "", email: "", password: "", role: "USER", tier: "CORE" });
      setActiveTab("users");
    } else {
      showToast(result.error || "Failed to create user", "error");
    }
  };

  const handleFundDebit = async () => {
    if (!fundModal) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    const user = registeredUsers.find((u) => u.id === fundModal.userId);
    if (!user) return;
    const isFund = fundModal.mode === "fund";
    if (hasApiToken()) {
      try {
        const dbTxType = fundTxType === "auto" ? undefined : fundTxType;
        const { data: res } = await adminAPI.adjustBalance(user.id, {
          amount,
          direction: isFund ? "credit" : "debit",
          note: fundNote || (isFund ? "Deposit" : "Withdrawal") + (fundAsUser ? " (as user)" : ""),
          txType: dbTxType,
        });
        updateUserById(fundModal.userId, { balance: Number(res.data?.fiatBalance ?? 0) });
        await loadAdminUsersFromApi();
        await syncSessionFromApi();
      } catch {
        setServerUnreachable(true);
        showToast("Network unreachable. Balance was not changed.", "error");
        return;
      }
    } else {
      const newBalance = (user.balance ?? 0) + (isFund ? amount : -amount);
      const txn: Transaction = {
        id: Math.random().toString(36).slice(2, 10),
        type: fundTxType === "auto" ? (isFund ? "CREDIT" : "DEBIT") : fundTxType as Transaction["type"],
        amount: isFund ? amount : -amount,
        note: fundNote || (isFund ? "Deposit" : "Withdrawal"),
        timestamp: new Date().toISOString(),
        performedBy: fundAsUser ? user.email : currentUser?.email || "admin",
      };
      updateUserById(fundModal.userId, { balance: Math.max(0, newBalance), transactions: [...(user.transactions || []), txn] });
    }
    audit(`${isFund ? "Funded" : "Debited"} ${formatCurrency(amount)}`, user.email, isFund ? "success" : "warning");
    showToast(`${isFund ? "Funded" : "Debited"} ${formatCurrency(amount)} ${isFund ? "to" : "from"} ${user.firstName}`);
    setFundModal(null);
    setFundAmount("");
    setFundNote("");
    setFundAsUser(false);
    setFundTxType("auto");
  };

  const handleProfitSave = async () => {
    if (!profitModal) return;
    const mode = profitForm.profitMode === "linear" ? "linear" : "compound";
    if (hasApiToken()) {
      try {
        await adminAPI.putYieldConfig(profitModal.id, {
          profitRate: profitForm.profitRate,
          profitMode: mode,
          profitMultiplier: profitForm.profitMultiplier,
          profitHold: profitForm.profitHold,
        });
        await loadAdminUsersFromApi();
      } catch {
        showToast("Network unreachable. Profit config was not saved.", "error");
        return;
      }
    } else {
      updateUserById(profitModal.id, {
        profitRate: profitForm.profitRate,
        profitMode: mode as User["profitMode"],
        profitSchedule: profitForm.profitSchedule as User["profitSchedule"],
        profitMultiplier: profitForm.profitMultiplier,
        profitHold: profitForm.profitHold,
      });
    }
    audit(`Set profit: ${profitForm.profitRate}%/daily (${mode})`, profitModal.email, "action");
    showToast(`Profit config updated for ${profitModal.firstName}`);
    setProfitModal(null);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
        <div className="bg-[#0f0f14] border border-white/10 rounded-2xl p-10 text-center max-w-md">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm mb-6">Operator clearance required.</p>
          <button
            onClick={() => router.push("/admin/login")}
            className="px-6 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-sm font-medium transition"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <AdminDeskHeader
        email={currentUser?.email}
        onLogout={() => {
          logout();
          router.push("/auth/login");
        }}
      />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {serverUnreachable && (
          <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-300">
            <Activity size={14} className="shrink-0" />
            <span>Desk unreachable. Local view only — mutations wait for the book.</span>
          </div>
        )}
        <AdminDeskStats
          pendingCount={pendingCount}
          total={stats.total}
          totalBalance={stats.totalBalance}
          frozenCount={stats.frozenCount}
          blockedCount={stats.blockedCount}
          tradingCount={stats.tradingCount}
        />
        <AdminTabNav
          activeTab={activeTab}
          onChange={setActiveTab}
          pendingCount={pendingCount}
          kycPending={kycSubmissions.filter((s: KYCSubmission) => s.status === "PENDING").length}
        />
        {activeTab === "transactions" && (
          <TransactionsTab
            pendingTransactions={pendingTransactions}
            onApprove={(id) => void handleApprove(id)}
            onReject={(id) => void handleRejectTx(id)}
            onOpenReject={(id) => { setRejectModal(id); setRejectReason(""); }}
          />
        )}
        {activeTab === "users" && (
          <UsersTab
            search={search}
            onSearch={setSearch}
            users={allUsers}
            expandedUser={expandedUser}
            onToggleExpand={(id) => setExpandedUser(expandedUser === id ? null : id)}
            hasMore={Boolean(userNextCursor)}
            loadingMore={loadingMoreUsers}
            onLoadMore={() => void handleLoadMoreUsers()}
            onFreeze={(u) => { updateUserById(u.id, { isFrozen: !u.isFrozen }); showToast(`${u.firstName} ${u.isFrozen ? "unfrozen" : "frozen"}`); }}
            onBlock={(u) => { updateUserById(u.id, { isBlocked: !u.isBlocked }); showToast(`${u.firstName} ${u.isBlocked ? "unblocked" : "blocked"}`); }}
            onTrade={(u) => { const enabled = u.tradingEnabled === false; updateUserById(u.id, { tradingEnabled: enabled }); showToast(`Trading ${enabled ? "started" : "stopped"} for ${u.firstName}`); }}
            onFund={(u) => setFundModal({ userId: u.id, mode: "fund" })}
            onDebit={(u) => setFundModal({ userId: u.id, mode: "debit" })}
            onEdit={(u) => { setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || "", tier: u.tier, country: u.country || "" }); setEditModal(u); }}
            onProfit={(u) => { setProfitForm({ profitRate: u.profitRate ?? 1.5, profitMode: u.profitMode === "linear" ? "linear" : "compound", profitSchedule: u.profitSchedule ?? "daily", profitMultiplier: u.profitMultiplier ?? 1, profitHold: u.profitHold === true }); setProfitModal(u); }}
            onBackdate={(u) => { setBackdateValue(u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : ""); setBackdateModal(u); }}
            onDelete={(u) => { if (!confirm(`Permanently delete ${u.firstName} ${u.lastName}?`)) return; deleteUserById(u.id); showToast(`Deleted ${u.firstName}`, "error"); }}
            onVerifyKYC={(u) => handleKycApprove(u)}
            onRejectKYC={(u) => handleKycReject(u)}
          />
        )}
        {activeTab === "kyc" && (
          <KycTab
            submissions={kycSubmissions}
            onApprove={(sub) => handleKycApproveUser(sub)}
            onReject={(sub, reason) => handleKycRejectSub(sub, reason)}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab notifForm={notifForm} setNotifForm={setNotifForm} users={registeredUsers} notifications={notifications} onSend={handleSendNotification} onDelete={deleteNotification} />
        )}
        {activeTab === "tos" && (
          <TosTab
            termsOfService={termsOfService}
            tosContent={tosContent}
            tosEditing={tosEditing}
            onToggleEdit={() => { if (tosEditing) { setTermsOfService(tosContent); setTosEditing(false); showToast("Terms of Service updated"); } else { setTosContent(termsOfService); setTosEditing(true); } }}
            onChange={setTosContent}
            onSave={() => { setTermsOfService(tosContent); setTosEditing(false); showToast("Terms of Service updated"); }}
            onCancel={() => setTosEditing(false)}
          />
        )}
        {activeTab === "audit" && (
          <AuditTab
            entries={deskAudit.length > 0 ? deskAudit : auditLog}
            hasMore={Boolean(auditNextCursor)}
            loadingMore={loadingMoreAudit}
            onLoadMore={() => void handleLoadMoreAudit()}
          />
        )}
        {activeTab === "rails" && (
          <RailsTab
            search={search}
            onSearch={setSearch}
            users={allUsers}
            onToggleRail={(u, rail) => {
              const unlocked = u.unlockedRails ?? [];
              const already = unlocked.includes(rail);
              updateUserById(u.id, { unlockedRails: already ? unlocked.filter((r) => r !== rail) : [...unlocked, rail] });
              showToast(`${rail} ${already ? "locked" : "unlocked"} for ${u.firstName}`);
            }}
            onUnlockAll={(u) => { updateUserById(u.id, { unlockedRails: ["trading", "portfolio", "funds", "commerce", "oracle"] }); showToast(`All rails unlocked for ${u.firstName}`); }}
            onLockAll={(u) => { updateUserById(u.id, { unlockedRails: [] }); showToast(`All rails locked for ${u.firstName}`); }}
          />
        )}
        {activeTab === "create" && (
          <CreateUserTab createForm={createForm} setCreateForm={setCreateForm} onCreate={() => void handleCreateUser()} />
        )}
        {activeTab === "bullish" && <SpikesTab />}
        {activeTab === "commerce" && <CommerceTab />}
        {activeTab === "deposit_addresses" && <DepositAddressesTab />}
      </main>
      <OperatorDeskModals
        rejectModal={rejectModal}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        onCloseReject={() => { setRejectModal(null); setRejectReason(""); }}
        onConfirmReject={() => void handleConfirmReject()}
        fundModal={fundModal}
        fundAmount={fundAmount}
        setFundAmount={setFundAmount}
        fundNote={fundNote}
        setFundNote={setFundNote}
        fundTxType={fundTxType}
        setFundTxType={setFundTxType}
        fundAsUser={fundAsUser}
        setFundAsUser={setFundAsUser}
        onCloseFund={() => { setFundModal(null); setFundAmount(""); setFundNote(""); setFundAsUser(false); setFundTxType("auto"); }}
        onConfirmFund={() => void handleFundDebit()}
        editModal={editModal}
        editForm={editForm}
        setEditForm={setEditForm}
        onCloseEdit={() => setEditModal(null)}
        onSaveEdit={() => {
          if (!editModal) return;
          updateUserById(editModal.id, {
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            email: editForm.email,
            phone: editForm.phone || undefined,
            tier: editForm.tier as User["tier"],
            country: editForm.country || undefined,
          });
          audit("Edited profile", editModal.email, "action");
          showToast(`Updated ${editForm.firstName}'s profile`);
          setEditModal(null);
        }}
        profitModal={profitModal}
        profitForm={profitForm}
        setProfitForm={setProfitForm}
        onCloseProfit={() => setProfitModal(null)}
        onSaveProfit={() => void handleProfitSave()}
        backdateModal={backdateModal}
        backdateValue={backdateValue}
        setBackdateValue={setBackdateValue}
        onCloseBackdate={() => { setBackdateModal(null); setBackdateValue(""); }}
        onSaveBackdate={() => {
          if (!backdateModal || !backdateValue) return;
          updateUserById(backdateModal.id, { createdAt: new Date(backdateValue).toISOString() });
          audit(`Backdated account to ${backdateValue}`, backdateModal.email, "warning");
          showToast(`Account date updated for ${backdateModal.firstName}`);
          setBackdateModal(null);
          setBackdateValue("");
        }}
      />
    </div>
  );
}
