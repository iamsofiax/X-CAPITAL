"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useStore,
  type AuditEntry,
  type PendingTransaction, 
  type UserNotification,
  type KYCSubmission,
} from "@/store/useStore";
import { cn, formatCurrency } from "@/lib/utils";
import type { User, Transaction } from "@/types";
import {
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Lock,
  Unlock,
  Ban,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  UserPlus,
  Edit3,
  Trash2,
  Snowflake,
  Play,
  Pause,
  X,
  AlertTriangle,
  Calendar,
  Percent,
  Activity,
  LogOut,
  FileText,
  Bell,
  Gift,
  ExternalLink,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  XCircle,
  CheckCircle2,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════════
   X-CAPITAL — GOD ADMIN PANEL (Standalone)
   Completely separate from broker dashboard. Own layout & auth.
   Full control panel with:
   - Transaction Approval Queue
   - User Management
   - Notifications & Congratulations
   - Editable Terms of Service
   - Audit Log
   ═══════════════════════════════════════════════════════════════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 10);

type AdminTab =
  | "transactions"
  | "users"
  | "kyc"
  | "notifications"
  | "tos"
  | "audit"
  | "create";

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg =
    type === "success"
      ? "bg-emerald-600"
      : type === "error"
        ? "bg-red-600"
        : "bg-blue-600";
  return (
    <div
      className={`fixed top-6 right-6 z-[9999] ${bg} text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Modal Shell ─────────────────────────────────────────────────────────────
function AdminModal({
  title,
  onClose,
  children,
  width = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`${width} w-full bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-[#12121a] border border-white/5 rounded-xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
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
    adminAlerts,
    markAdminAlertRead,
    getUnreadAdminAlertCount,
    notifications,
    addNotification,
    deleteNotification,
    termsOfService,
    setTermsOfService,
    kycSubmissions,
    approveKYC,
    rejectKYC,
  } = useStore();

  const isAdmin =
    isAuthenticated &&
    currentUser &&
    (currentUser.role === "GOD_ADMIN" || currentUser.role === "ADMIN");

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("transactions");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Fund/Debit
  const [fundModal, setFundModal] = useState<{
    userId: string;
    mode: "fund" | "debit";
  } | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [fundAsUser, setFundAsUser] = useState(false);
  const [fundTxType, setFundTxType] = useState<
    | "auto"
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "TRADE"
    | "FUND_INVESTMENT"
    | "FUND_REDEMPTION"
    | "FEE"
  >("auto");

  // Edit
  const [editModal, setEditModal] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    tier: "CORE" as string,
    country: "",
  });

  // Profit Config
  const [profitModal, setProfitModal] = useState<User | null>(null);
  const [profitForm, setProfitForm] = useState({
    profitRate: 1.5,
    profitMode: "linear" as string,
    profitSchedule: "daily" as string,
    profitMultiplier: 1,
  });

  // Backdate
  const [backdateModal, setBackdateModal] = useState<User | null>(null);
  const [backdateValue, setBackdateValue] = useState("");

  // Create User
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "USER",
    tier: "CORE",
  });

  // Rejection reason
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Notification composer
  const [notifForm, setNotifForm] = useState({
    userId: "",
    title: "",
    message: "",
    type: "congratulations" as UserNotification["type"],
    externalLink: "",
    externalLinkLabel: "",
  });

  // TOS editor
  const [tosContent, setTosContent] = useState(termsOfService);
  const [tosEditing, setTosEditing] = useState(false);

  // ── Filtered data ─────────────────────────────────────────────────────────
  const allUsers = useMemo(() => {
    const users = registeredUsers || [];
    if (!search.trim()) return users;
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

  const unreadAlerts = getUnreadAdminAlertCount();

  const stats = useMemo(() => {
    const users = registeredUsers || [];
    const totalBalance = users.reduce((s, u) => s + (u.balance ?? 0), 0);
    const frozenCount = users.filter((u) => u.isFrozen).length;
    const blockedCount = users.filter((u) => u.isBlocked).length;
    const tradingCount = users.filter((u) => u.tradingEnabled !== false).length;
    return {
      total: users.length,
      totalBalance,
      frozenCount,
      blockedCount,
      tradingCount,
    };
  }, [registeredUsers]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") =>
      setToast({ message, type }),
    [],
  );

  const audit = useCallback(
    (action: string, target: string, level: AuditEntry["level"] = "action") => {
      addAuditEntry({
        id: uid(),
        time: new Date().toISOString(),
        actor: currentUser?.email || "admin",
        action,
        target,
        level,
      });
    },
    [addAuditEntry, currentUser],
  );

  // ── User Actions ──────────────────────────────────────────────────────────
  const handleToggleFreeze = (u: User) => {
    const frozen = !u.isFrozen;
    updateUserById(u.id, { isFrozen: frozen });
    audit(
      frozen ? "Froze account" : "Unfroze account",
      u.email,
      frozen ? "warning" : "success",
    );
    showToast(`${u.firstName} ${frozen ? "frozen" : "unfrozen"}`);
  };

  const handleToggleBlock = (u: User) => {
    const blocked = !u.isBlocked;
    updateUserById(u.id, { isBlocked: blocked });
    audit(
      blocked ? "Blocked account" : "Unblocked account",
      u.email,
      blocked ? "danger" : "success",
    );
    showToast(`${u.firstName} ${blocked ? "blocked" : "unblocked"}`);
  };

  const handleToggleTrading = (u: User) => {
    const enabled = u.tradingEnabled === false;
    updateUserById(u.id, { tradingEnabled: enabled });
    audit(enabled ? "Enabled trading" : "Disabled trading", u.email, "action");
    showToast(`Trading ${enabled ? "started" : "stopped"} for ${u.firstName}`);
  };

  const handleFundDebit = () => {
    if (!fundModal) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    const user = registeredUsers.find((u) => u.id === fundModal.userId);
    if (!user) return;
    const isFund = fundModal.mode === "fund";
    const newBalance = (user.balance ?? 0) + (isFund ? amount : -amount);

    // Determine transaction type
    let txType: Transaction["type"];
    if (fundTxType === "auto") {
      txType = isFund ? "CREDIT" : "DEBIT";
    } else {
      txType = fundTxType as Transaction["type"];
    }

    const txn: Transaction = {
      id: uid(),
      type: txType,
      amount: isFund ? amount : -amount,
      note: fundNote || (isFund ? "Deposit" : "Withdrawal"),
      timestamp: new Date().toISOString(),
      performedBy: fundAsUser ? user.email : currentUser?.email || "admin",
    };
    updateUserById(fundModal.userId, {
      balance: Math.max(0, newBalance),
      transactions: [...(user.transactions || []), txn],
    });
    audit(
      `${isFund ? "Funded" : "Debited"} ${formatCurrency(amount)}${fundAsUser ? " (as user)" : ""}`,
      user.email,
      isFund ? "success" : "warning",
    );
    showToast(
      `${isFund ? "Funded" : "Debited"} ${formatCurrency(amount)} ${isFund ? "to" : "from"} ${user.firstName}`,
    );
    setFundModal(null);
    setFundAmount("");
    setFundNote("");
    setFundAsUser(false);
    setFundTxType("auto");
  };

  const handleEditSave = () => {
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
  };

  const handleProfitSave = () => {
    if (!profitModal) return;
    updateUserById(profitModal.id, {
      profitRate: profitForm.profitRate,
      profitMode: profitForm.profitMode as User["profitMode"],
      profitSchedule: profitForm.profitSchedule as User["profitSchedule"],
      profitMultiplier: profitForm.profitMultiplier,
    });
    audit(
      `Set profit: ${profitForm.profitRate}%/${profitForm.profitSchedule} (${profitForm.profitMode})`,
      profitModal.email,
      "action",
    );
    showToast(`Profit config updated for ${profitModal.firstName}`);
    setProfitModal(null);
  };

  const handleBackdateSave = () => {
    if (!backdateModal || !backdateValue) return;
    updateUserById(backdateModal.id, {
      createdAt: new Date(backdateValue).toISOString(),
    });
    audit(
      `Backdated account to ${backdateValue}`,
      backdateModal.email,
      "warning",
    );
    showToast(`Account date updated for ${backdateModal.firstName}`);
    setBackdateModal(null);
    setBackdateValue("");
  };

  const handleDeleteUser = (u: User) => {
    if (!confirm(`Permanently delete ${u.firstName} ${u.lastName}?`)) return;
    deleteUserById(u.id);
    audit("Deleted account", u.email, "danger");
    showToast(`Deleted ${u.firstName}`, "error");
  };

  const handleCreateUser = async () => {
    if (
      !createForm.firstName ||
      !createForm.lastName ||
      !createForm.email ||
      !createForm.password
    ) {
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
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "USER",
        tier: "CORE",
      });
      setActiveTab("users");
    } else {
      showToast(result.error || "Failed to create user", "error");
    }
  };

  // ── Transaction Actions ───────────────────────────────────────────────────
  const handleApprove = (txId: string) => {
    const tx = pendingTransactions.find((t) => t.id === txId);
    if (!tx) return;
    approvePendingTransaction(txId, currentUser?.email || "admin");

    // Credit or debit user balance
    const targetUser = registeredUsers.find((u) => u.id === tx.userId);
    if (targetUser) {
      const usdAmount =
        tx.currency === "USD"
          ? tx.amount
          : tx.amount * (CRYPTO_RATES[tx.currency] || 1);
      if (tx.type === "DEPOSIT") {
        const txn: Transaction = {
          id: uid(),
          type: "CREDIT",
          amount: usdAmount,
          note: `${tx.method.toUpperCase()} deposit approved`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser?.email || "admin",
        };
        updateUserById(tx.userId, {
          balance: (targetUser.balance ?? 0) + usdAmount,
          transactions: [...(targetUser.transactions || []), txn],
        });
      } else {
        const txn: Transaction = {
          id: uid(),
          type: "DEBIT",
          amount: -usdAmount,
          note: `${tx.method.toUpperCase()} withdrawal approved`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser?.email || "admin",
        };
        updateUserById(tx.userId, {
          balance: Math.max(0, (targetUser.balance ?? 0) - usdAmount),
          transactions: [...(targetUser.transactions || []), txn],
        });
      }
    }

    // Notify user
    addNotification({
      id: `n-${uid()}`,
      userId: tx.userId,
      title: `${tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} Approved`,
      message: `Your ${tx.method} ${tx.type.toLowerCase()} of ${tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`} has been approved.`,
      type: "transaction",
      read: false,
      createdAt: new Date().toISOString(),
    });

    audit(
      `Approved ${tx.type.toLowerCase()} ${tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`}`,
      tx.userEmail,
      "success",
    );
    showToast(
      `${tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} approved for ${tx.userName}`,
    );
  };

  const handleReject = () => {
    if (!rejectModal) return;
    const tx = pendingTransactions.find((t) => t.id === rejectModal);
    if (!tx) return;
    rejectPendingTransaction(
      rejectModal,
      currentUser?.email || "admin",
      rejectReason,
    );

    addNotification({
      id: `n-${uid()}`,
      userId: tx.userId,
      title: `${tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} Rejected`,
      message: `Your ${tx.method} ${tx.type.toLowerCase()} of ${tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`} was rejected.${rejectReason ? ` Reason: ${rejectReason}` : ""}`,
      type: "transaction",
      read: false,
      createdAt: new Date().toISOString(),
    });

    audit(
      `Rejected ${tx.type.toLowerCase()} ${tx.currency === "USD" ? formatCurrency(tx.amount) : `${tx.amount} ${tx.currency}`}`,
      tx.userEmail,
      "danger",
    );
    showToast(`Transaction rejected`, "error");
    setRejectModal(null);
    setRejectReason("");
  };

  // ── Notification Actions ──────────────────────────────────────────────────
  const handleSendNotification = () => {
    if (!notifForm.title || !notifForm.message) {
      showToast("Title and message required", "error");
      return;
    }

    // If no specific user, send to all
    const targetUsers = notifForm.userId
      ? registeredUsers.filter((u) => u.id === notifForm.userId)
      : registeredUsers.filter(
          (u) => u.role !== "GOD_ADMIN" && u.role !== "ADMIN",
        );

    targetUsers.forEach((u) => {
      addNotification({
        id: `n-${uid()}`,
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

    audit(
      `Sent ${notifForm.type} notification to ${notifForm.userId ? "1 user" : `${targetUsers.length} users`}`,
      notifForm.title,
      "action",
    );
    showToast(
      `Notification sent to ${notifForm.userId ? "user" : `${targetUsers.length} users`}`,
    );
    setNotifForm({
      userId: "",
      title: "",
      message: "",
      type: "congratulations",
      externalLink: "",
      externalLinkLabel: "",
    });
  };

  // ── TOS Actions ───────────────────────────────────────────────────────────
  const handleSaveTos = () => {
    setTermsOfService(tosContent);
    setTosEditing(false);
    audit("Updated Terms of Service", "TOS", "action");
    showToast("Terms of Service updated");
  };

  // ── If not admin ──────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
        <div className="bg-[#0f0f14] border border-white/10 rounded-2xl p-10 text-center max-w-md">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm mb-6">
            You must be logged in as a God Admin to access this panel.
          </p>
          <button
            onClick={() => router.push("/admin/login")}
            className="px-6 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-lg text-sm font-medium transition"
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 bg-[#08080c]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                X-CAPITAL{" "}
                <span className="text-white/60 text-sm font-normal ml-1">
                  GOD ADMIN
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{currentUser?.email}</span>
            <button
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
              className="text-gray-400 hover:text-white transition p-2"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Pending Txns"
            value={pendingCount}
            icon={Clock}
            accent="bg-amber-600/20 text-amber-400"
          />
          <StatCard
            label="Total Users"
            value={stats.total}
            icon={Users}
            accent="bg-white/[0.08] text-white/60"
          />
          <StatCard
            label="Total Balance"
            value={formatCurrency(stats.totalBalance, true)}
            icon={DollarSign}
            accent="bg-green-600/20 text-green-400"
          />
          <StatCard
            label="Frozen"
            value={stats.frozenCount}
            icon={Snowflake}
            accent="bg-white/[0.08] text-white/50"
          />
          <StatCard
            label="Blocked"
            value={stats.blockedCount}
            icon={Ban}
            accent="bg-red-600/20 text-red-400"
          />
          <StatCard
            label="Trading"
            value={stats.tradingCount}
            icon={Activity}
            accent="bg-white/[0.08] text-white/50"
          />
        </div>

        {/* ── Tab Nav ── */}
        <div className="flex items-center gap-1 mb-6 bg-[#12121a] rounded-lg p-1 w-fit flex-wrap">
          {[
            {
              key: "transactions" as const,
              label: "Transactions",
              icon: DollarSign,
              badge: pendingCount > 0 ? pendingCount : undefined,
            },
            { key: "users" as const, label: "Users", icon: Users },
            {
              key: "kyc" as const,
              label: "KYC Review",
              icon: Shield,
              badge:
                kycSubmissions.filter(
                  (s: KYCSubmission) => s.status === "PENDING",
                ).length > 0
                  ? kycSubmissions.filter(
                      (s: KYCSubmission) => s.status === "PENDING",
                    ).length
                  : undefined,
            },
            {
              key: "notifications" as const,
              label: "Notifications",
              icon: Bell,
            },
            { key: "tos" as const, label: "Terms of Service", icon: FileText },
            { key: "audit" as const, label: "Audit Log", icon: Clock },
            { key: "create" as const, label: "Create User", icon: UserPlus },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition relative",
                activeTab === t.key
                  ? "bg-white/[0.08] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <t.icon size={14} />
              {t.label}
              {t.badge && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TRANSACTIONS TAB                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Inbound Capital Signals */}
            {adminAlerts.filter((a) => a.status === "PENDING").length > 0 && (
              <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4">
                <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                  Inbound Capital Signals
                  {unreadAlerts > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500 text-black text-xs rounded-full">
                      {unreadAlerts}
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {adminAlerts
                    .filter((a) => a.status === "PENDING")
                    .slice(0, 8)
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="flex flex-wrap items-center justify-between gap-2 bg-black/30 rounded-lg px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="text-white font-medium">
                            {alert.userEmail}
                          </span>
                          <span className="text-gray-500 ml-2 node-telemetry">
                            {alert.type} · {alert.method}
                          </span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">
                          ${alert.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => markAdminAlertRead(alert.id)}
                          className="text-xs text-gray-500 hover:text-white"
                        >
                          Mark read
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <h3 className="text-sm font-semibold text-white mb-4">
              Transaction Approval Queue
            </h3>

            {/* Pending */}
            {pendingTransactions.filter((t) => t.status === "PENDING")
              .length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <CheckCircle2 size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No pending transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTransactions
                  .filter((t) => t.status === "PENDING")
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-[#12121a] border border-white/5 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center",
                              tx.type === "DEPOSIT"
                                ? "bg-emerald-600/20"
                                : "bg-red-600/20",
                            )}
                          >
                            {tx.type === "DEPOSIT" ? (
                              <ArrowDownLeft
                                size={16}
                                className="text-emerald-400"
                              />
                            ) : (
                              <ArrowUpRight
                                size={16}
                                className="text-red-400"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {tx.userName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tx.userEmail}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "text-lg font-bold font-mono",
                              tx.type === "DEPOSIT"
                                ? "text-emerald-400"
                                : "text-red-400",
                            )}
                          >
                            {tx.type === "DEPOSIT" ? "+" : "−"}
                            {tx.currency === "USD"
                              ? formatCurrency(tx.amount)
                              : `${tx.amount} ${tx.currency}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tx.type} · {tx.method.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {Object.entries(tx.details).map(([k, v]) => (
                          <div key={k}>
                            <p className="text-[10px] text-gray-600 uppercase">
                              {k.replace(/([A-Z])/g, " $1")}
                            </p>
                            <p className="text-xs text-gray-300 font-mono truncate">
                              {v}
                            </p>
                          </div>
                        ))}
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase">
                            Submitted
                          </p>
                          <p className="text-xs text-gray-300">
                            {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(tx.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectModal(tx.id);
                            setRejectReason("");
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-medium transition"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Recent resolved */}
            {pendingTransactions.filter((t) => t.status !== "PENDING").length >
              0 && (
              <div className="mt-8">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Recently Resolved
                </h4>
                <div className="space-y-2">
                  {pendingTransactions
                    .filter((t) => t.status !== "PENDING")
                    .slice(0, 20)
                    .map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between bg-[#12121a] border border-white/5 rounded-lg px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              tx.status === "APPROVED"
                                ? "bg-emerald-500"
                                : "bg-red-500",
                            )}
                          />
                          <span className="text-gray-400">{tx.userName}</span>
                          <span className="text-gray-600 text-xs">
                            {tx.type} · {tx.method}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-mono text-sm">
                            {tx.currency === "USD"
                              ? formatCurrency(tx.amount)
                              : `${tx.amount} ${tx.currency}`}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded",
                              tx.status === "APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400",
                            )}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* USERS TAB                                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div>
            <div className="relative mb-5">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or ID…"
                className="w-full md:w-96 pl-10 pr-4 py-2.5 bg-[#12121a] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>

            {allUsers.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <Users size={40} className="mx-auto mb-3 opacity-40" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allUsers.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isExpanded={expandedUser === u.id}
                    onToggleExpand={() =>
                      setExpandedUser(expandedUser === u.id ? null : u.id)
                    }
                    onFreeze={() => handleToggleFreeze(u)}
                    onBlock={() => handleToggleBlock(u)}
                    onTrade={() => handleToggleTrading(u)}
                    onFund={() => setFundModal({ userId: u.id, mode: "fund" })}
                    onDebit={() =>
                      setFundModal({ userId: u.id, mode: "debit" })
                    }
                    onEdit={() => {
                      setEditForm({
                        firstName: u.firstName,
                        lastName: u.lastName,
                        email: u.email,
                        phone: u.phone || "",
                        tier: u.tier,
                        country: u.country || "",
                      });
                      setEditModal(u);
                    }}
                    onProfit={() => {
                      setProfitForm({
                        profitRate: u.profitRate ?? 1.5,
                        profitMode: u.profitMode ?? "linear",
                        profitSchedule: u.profitSchedule ?? "daily",
                        profitMultiplier: u.profitMultiplier ?? 1,
                      });
                      setProfitModal(u);
                    }}
                    onBackdate={() => {
                      setBackdateValue(
                        u.createdAt
                          ? new Date(u.createdAt).toISOString().slice(0, 10)
                          : "",
                      );
                      setBackdateModal(u);
                    }}
                    onDelete={() => handleDeleteUser(u)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* KYC REVIEW TAB                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "kyc" && (
          <div className="space-y-4">
            {kycSubmissions.length === 0 ? (
              <div className="bg-[#12121a] border border-white/5 rounded-xl p-12 text-center">
                <Shield size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No KYC submissions yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  Submissions will appear here when users verify their identity.
                </p>
              </div>
            ) : (
              <>
                {/* Pending first, then reviewed */}
                {kycSubmissions
                  .slice()
                  .sort((a: KYCSubmission, b: KYCSubmission) => {
                    if (a.status === "PENDING" && b.status !== "PENDING")
                      return -1;
                    if (a.status !== "PENDING" && b.status === "PENDING")
                      return 1;
                    return (
                      new Date(b.submittedAt).getTime() -
                      new Date(a.submittedAt).getTime()
                    );
                  })
                  .map((sub: KYCSubmission) => (
                    <KYCReviewCard
                      key={sub.id}
                      submission={sub}
                      onApprove={() => {
                        approveKYC(sub.id, currentUser?.email || "admin");
                        addAuditEntry({
                          id: uid(),
                          time: new Date().toISOString(),
                          actor: currentUser?.email || "admin",
                          action: "KYC_APPROVED",
                          target: `Approved KYC for ${sub.userEmail}`,
                          level: "success",
                        });
                        addNotification({
                          id: uid(),
                          userId: sub.userId,
                          title: "KYC Approved",
                          message:
                            "Your identity has been verified. Full platform access is now unlocked.",
                          type: "system",
                          read: false,
                          createdAt: new Date().toISOString(),
                        });
                        setToast({
                          message: `KYC approved for ${sub.userEmail}`,
                          type: "success",
                        });
                      }}
                      onReject={(reason: string) => {
                        rejectKYC(
                          sub.id,
                          currentUser?.email || "admin",
                          reason,
                        );
                        addAuditEntry({
                          id: uid(),
                          time: new Date().toISOString(),
                          actor: currentUser?.email || "admin",
                          action: "KYC_REJECTED",
                          target: `Rejected KYC for ${sub.userEmail}: ${reason}`,
                          level: "danger",
                        });
                        addNotification({
                          id: uid(),
                          userId: sub.userId,
                          title: "KYC Rejected",
                          message: `Your identity verification was not approved. Reason: ${reason}. Please resubmit.`,
                          type: "system",
                          read: false,
                          createdAt: new Date().toISOString(),
                        });
                        setToast({
                          message: `KYC rejected for ${sub.userEmail}`,
                          type: "error",
                        });
                      }}
                    />
                  ))}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* NOTIFICATIONS TAB                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "notifications" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Compose */}
            <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-white/60" />
                <h3 className="text-sm font-semibold text-white">
                  Compose Notification
                </h3>
              </div>

              <SelectField
                label="Type"
                value={notifForm.type}
                options={["congratulations", "reward", "system", "transaction"]}
                onChange={(v) =>
                  setNotifForm({
                    ...notifForm,
                    type: v as UserNotification["type"],
                  })
                }
              />

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Send To
                </label>
                <select
                  value={notifForm.userId}
                  onChange={(e) =>
                    setNotifForm({ ...notifForm, userId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="">All Users</option>
                  {registeredUsers
                    .filter((u) => u.role !== "GOD_ADMIN")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <Field
                label="Title"
                value={notifForm.title}
                onChange={(v) => setNotifForm({ ...notifForm, title: v })}
                placeholder="Congratulations!"
              />

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Message
                </label>
                <textarea
                  value={notifForm.message}
                  onChange={(e) =>
                    setNotifForm({ ...notifForm, message: e.target.value })
                  }
                  placeholder="Write your message here..."
                  rows={4}
                  className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                />
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon size={14} className="text-white/40" />
                  <span className="text-xs text-gray-500 font-semibold">
                    External Link (optional)
                  </span>
                </div>
                <Field
                  label="Link URL"
                  value={notifForm.externalLink}
                  onChange={(v) =>
                    setNotifForm({ ...notifForm, externalLink: v })
                  }
                  placeholder="https://reward.example.com/claim"
                />
                <div className="mt-2">
                  <Field
                    label="Link Label"
                    value={notifForm.externalLinkLabel}
                    onChange={(v) =>
                      setNotifForm({ ...notifForm, externalLinkLabel: v })
                    }
                    placeholder="Claim Reward"
                  />
                </div>
              </div>

              <button
                onClick={handleSendNotification}
                className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Send size={14} /> Send Notification
              </button>
            </div>

            {/* Recent notifications */}
            <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Sent Notifications
                </h3>
                <span className="text-xs text-gray-500">
                  {notifications.length} total
                </span>
              </div>
              {notifications.length === 0 ? (
                <p className="text-center py-12 text-gray-600 text-sm">
                  No notifications sent yet
                </p>
              ) : (
                <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                  {notifications.slice(0, 50).map((n) => (
                    <div
                      key={n.id}
                      className="px-5 py-3 flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          n.type === "congratulations"
                            ? "bg-amber-500/20"
                            : n.type === "reward"
                              ? "bg-emerald-500/20"
                              : n.type === "transaction"
                                ? "bg-blue-500/20"
                                : "bg-white/5",
                        )}
                      >
                        {n.type === "congratulations" ? (
                          <Gift size={14} className="text-amber-400" />
                        ) : n.type === "reward" ? (
                          <Gift size={14} className="text-emerald-400" />
                        ) : n.type === "transaction" ? (
                          <DollarSign size={14} className="text-blue-400" />
                        ) : (
                          <Bell size={14} className="text-white/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        {n.externalLink && (
                          <a
                            href={n.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                          >
                            <ExternalLink size={10} />{" "}
                            {n.externalLinkLabel || "Open Link"}
                          </a>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1">
                          {new Date(n.createdAt).toLocaleString()} ·{" "}
                          {registeredUsers.find((u) => u.id === n.userId)
                            ?.email || n.userId}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-gray-600 hover:text-red-400 transition p-1 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TERMS OF SERVICE TAB                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "tos" && (
          <div className="max-w-3xl">
            <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-white/60" />
                  <h3 className="text-sm font-semibold text-white">
                    Terms of Service
                  </h3>
                </div>
                <button
                  onClick={() => {
                    if (tosEditing) {
                      handleSaveTos();
                    } else {
                      setTosContent(termsOfService);
                      setTosEditing(true);
                    }
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition",
                    tosEditing
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-white/[0.08] hover:bg-white/[0.12]",
                  )}
                >
                  {tosEditing ? "Save Changes" : "Edit"}
                </button>
              </div>
              <div className="p-6">
                {tosEditing ? (
                  <textarea
                    value={tosContent}
                    onChange={(e) => setTosContent(e.target.value)}
                    rows={20}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-4 text-sm text-white font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-white/20 resize-y min-h-[400px]"
                  />
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                      {termsOfService}
                    </pre>
                  </div>
                )}
                {tosEditing && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setTosEditing(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTos}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* AUDIT LOG TAB                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "audit" && (
          <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Recent Activity
              </h3>
              <span className="text-xs text-gray-500">
                {auditLog.length} entries
              </span>
            </div>
            {auditLog.length === 0 ? (
              <p className="text-center py-12 text-gray-600 text-sm">
                No audit entries yet
              </p>
            ) : (
              <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                {auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="px-5 py-3 flex items-center gap-4 text-sm"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        entry.level === "success" && "bg-green-500",
                        entry.level === "warning" && "bg-yellow-500",
                        entry.level === "danger" && "bg-red-500",
                        entry.level === "action" && "bg-white/30",
                        entry.level === "info" && "bg-blue-500",
                      )}
                    />
                    <span className="text-gray-500 text-xs w-36 flex-shrink-0">
                      {new Date(entry.time).toLocaleString()}
                    </span>
                    <span className="text-white font-medium flex-1">
                      {entry.action}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {entry.target}
                    </span>
                    <span className="text-gray-600 text-xs">{entry.actor}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CREATE USER TAB                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "create" && (
          <div className="max-w-lg">
            <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white mb-2">
                Create New User
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="First Name"
                  value={createForm.firstName}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, firstName: v })
                  }
                />
                <Field
                  label="Last Name"
                  value={createForm.lastName}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, lastName: v })
                  }
                />
              </div>
              <Field
                label="Email"
                value={createForm.email}
                type="email"
                onChange={(v) => setCreateForm({ ...createForm, email: v })}
              />
              <Field
                label="Password"
                value={createForm.password}
                type="password"
                onChange={(v) => setCreateForm({ ...createForm, password: v })}
              />
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Role"
                  value={createForm.role}
                  options={["USER", "ADMIN"]}
                  onChange={(v) => setCreateForm({ ...createForm, role: v })}
                />
                <SelectField
                  label="Tier"
                  value={createForm.tier}
                  options={["CORE", "GOLD", "BLACK"]}
                  onChange={(v) => setCreateForm({ ...createForm, tier: v })}
                />
              </div>
              <button
                onClick={handleCreateUser}
                className="w-full mt-2 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition"
              >
                Create User
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* Reject Modal */}
      {rejectModal && (
        <AdminModal
          title="Reject Transaction"
          onClose={() => {
            setRejectModal(null);
            setRejectReason("");
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Provide a reason for rejecting this transaction (optional).
            </p>
            <Field
              label="Reason"
              value={rejectReason}
              onChange={setRejectReason}
              placeholder="e.g. Suspicious activity, invalid details..."
            />
            <button
              onClick={handleReject}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition"
            >
              Reject Transaction
            </button>
          </div>
        </AdminModal>
      )}

      {/* Fund / Debit Modal */}
      {fundModal && (
        <AdminModal
          title={fundModal.mode === "fund" ? "Fund Account" : "Debit Account"}
          onClose={() => {
            setFundModal(null);
            setFundAmount("");
            setFundNote("");
            setFundAsUser(false);
            setFundTxType("auto");
          }}
        >
          <div className="space-y-4">
            <Field
              label="Amount (USD)"
              value={fundAmount}
              type="number"
              onChange={setFundAmount}
              placeholder="0.00"
            />
            <Field
              label="Note / Description"
              value={fundNote}
              onChange={setFundNote}
              placeholder={
                fundModal.mode === "fund"
                  ? "e.g. Wire transfer — JPMorgan Chase"
                  : "e.g. ACH withdrawal — Chase ····8291"
              }
            />
            <SelectField
              label="Transaction Type"
              value={fundTxType}
              options={[
                "auto",
                "DEPOSIT",
                "WITHDRAWAL",
                "TRADE",
                "FUND_INVESTMENT",
                "FUND_REDEMPTION",
                "FEE",
              ]}
              onChange={(v) => setFundTxType(v as typeof fundTxType)}
            />

            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-white">
                    Show as user activity
                  </p>
                  <p className="text-xs text-gray-500">
                    Hides admin identity — appears as organic user action
                  </p>
                </div>
                <button
                  onClick={() => setFundAsUser(!fundAsUser)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    fundAsUser ? "bg-emerald-600" : "bg-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                      fundAsUser && "translate-x-5",
                    )}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleFundDebit}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-medium transition",
                fundModal.mode === "fund"
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-red-600 hover:bg-red-500",
              )}
            >
              {fundModal.mode === "fund" ? "Credit Funds" : "Debit Funds"}
            </button>
          </div>
        </AdminModal>
      )}

      {/* Edit Profile Modal */}
      {editModal && (
        <AdminModal
          title="Edit User Profile"
          onClose={() => setEditModal(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="First Name"
                value={editForm.firstName}
                onChange={(v) => setEditForm({ ...editForm, firstName: v })}
              />
              <Field
                label="Last Name"
                value={editForm.lastName}
                onChange={(v) => setEditForm({ ...editForm, lastName: v })}
              />
            </div>
            <Field
              label="Email"
              value={editForm.email}
              onChange={(v) => setEditForm({ ...editForm, email: v })}
            />
            <Field
              label="Phone"
              value={editForm.phone}
              onChange={(v) => setEditForm({ ...editForm, phone: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Tier"
                value={editForm.tier}
                options={["CORE", "GOLD", "BLACK"]}
                onChange={(v) => setEditForm({ ...editForm, tier: v })}
              />
              <Field
                label="Country"
                value={editForm.country}
                onChange={(v) => setEditForm({ ...editForm, country: v })}
              />
            </div>
            <button
              onClick={handleEditSave}
              className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition"
            >
              Save Changes
            </button>
          </div>
        </AdminModal>
      )}

      {/* Profit Config Modal */}
      {profitModal && (
        <AdminModal
          title={`Profit Config — ${profitModal.firstName}`}
          onClose={() => setProfitModal(null)}
        >
          <div className="space-y-4">
            <Field
              label="Daily Profit Rate (%)"
              value={String(profitForm.profitRate)}
              type="number"
              onChange={(v) =>
                setProfitForm({ ...profitForm, profitRate: parseFloat(v) || 0 })
              }
              placeholder="1.5"
            />
            <SelectField
              label="Profit Mode"
              value={profitForm.profitMode}
              options={["linear", "compound", "stepped", "random"]}
              onChange={(v) => setProfitForm({ ...profitForm, profitMode: v })}
            />
            <SelectField
              label="Schedule"
              value={profitForm.profitSchedule}
              options={["daily", "weekly", "monthly"]}
              onChange={(v) =>
                setProfitForm({ ...profitForm, profitSchedule: v })
              }
            />
            <Field
              label="Multiplier"
              value={String(profitForm.profitMultiplier)}
              type="number"
              onChange={(v) =>
                setProfitForm({
                  ...profitForm,
                  profitMultiplier: parseFloat(v) || 1,
                })
              }
              placeholder="1.0"
            />
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-xs text-gray-400">
              <p className="font-medium text-white/60 mb-1">How it works</p>
              <p>
                <strong>Linear</strong> — flat % added daily.{" "}
                <strong>Compound</strong> — interest on interest.{" "}
                <strong>Stepped</strong> — increases at milestones.{" "}
                <strong>Random</strong> — realistic variance.
              </p>
              <p className="mt-1">
                Multiplier scales the base rate (e.g. 2× doubles profits).
              </p>
            </div>
            <button
              onClick={handleProfitSave}
              className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition"
            >
              Apply Profit Config
            </button>
          </div>
        </AdminModal>
      )}

      {/* Backdate Modal */}
      {backdateModal && (
        <AdminModal
          title={`Backdate — ${backdateModal.firstName}`}
          onClose={() => {
            setBackdateModal(null);
            setBackdateValue("");
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Change when this account appears to have been created.
            </p>
            <Field
              label="Account Creation Date"
              value={backdateValue}
              type="date"
              onChange={setBackdateValue}
            />
            <button
              onClick={handleBackdateSave}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition"
            >
              Update Creation Date
            </button>
          </div>
        </AdminModal>
      )}

      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTO RATES for USD conversion during approval
// ═══════════════════════════════════════════════════════════════════════════════
const CRYPTO_RATES: Record<string, number> = {
  BTC: 68420,
  ETH: 3840,
  USDT: 1,
  USDC: 1,
  SOL: 182,
  BNB: 428,
  XRP: 0.62,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function UserRow({
  user,
  isExpanded,
  onToggleExpand,
  onFreeze,
  onBlock,
  onTrade,
  onFund,
  onDebit,
  onEdit,
  onProfit,
  onBackdate,
  onDelete,
}: {
  user: User;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFreeze: () => void;
  onBlock: () => void;
  onTrade: () => void;
  onFund: () => void;
  onDebit: () => void;
  onEdit: () => void;
  onProfit: () => void;
  onBackdate: () => void;
  onDelete: () => void;
}) {
  const tierColor =
    user.tier === "BLACK"
      ? "text-white bg-white/10"
      : user.tier === "GOLD"
        ? "text-white/50 bg-white/[0.04]"
        : "text-white/60 bg-white/[0.04]";

  return (
    <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
      <div
        className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition"
        onClick={onToggleExpand}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user.firstName} {user.lastName}
            {user.role === "ADMIN" && (
              <span className="ml-2 text-[10px] text-white/50 bg-white/[0.04] px-1.5 py-0.5 rounded font-medium">
                ADMIN
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {user.isFrozen && (
            <span className="text-[10px] text-white/50 bg-white/[0.04] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Snowflake size={10} /> Frozen
            </span>
          )}
          {user.isBlocked && (
            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Ban size={10} /> Blocked
            </span>
          )}
          {user.tradingEnabled === false && (
            <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Pause size={10} /> No Trade
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded font-medium",
            tierColor,
          )}
        >
          {user.tier}
        </span>
        <span className="text-sm font-semibold text-green-400 w-28 text-right">
          {formatCurrency(user.balance ?? 0)}
        </span>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-xs">
            <InfoCell label="ID" value={user.id} />
            <InfoCell label="Phone" value={user.phone || "—"} />
            <InfoCell label="Country" value={user.country || "—"} />
            <InfoCell
              label="Joined"
              value={
                user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"
              }
            />
            <InfoCell label="KYC" value={user.kycStatus} />
            <InfoCell
              label="Profit Rate"
              value={
                user.profitRate != null ? `${user.profitRate}%` : "Default"
              }
            />
            <InfoCell label="Profit Mode" value={user.profitMode || "linear"} />
            <InfoCell
              label="Last Login"
              value={
                user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"
              }
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <ActionBtn
              icon={DollarSign}
              label="Fund"
              color="bg-green-600/20 text-green-400 hover:bg-green-600/30"
              onClick={onFund}
            />
            <ActionBtn
              icon={TrendingUp}
              label="Debit"
              color="bg-red-600/20 text-red-400 hover:bg-red-600/30"
              onClick={onDebit}
            />
            <ActionBtn
              icon={Edit3}
              label="Edit"
              color="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
              onClick={onEdit}
            />
            <ActionBtn
              icon={Percent}
              label="Profit"
              color="bg-white/[0.08] text-white/60 hover:bg-white/[0.12]"
              onClick={onProfit}
            />
            <ActionBtn
              icon={Calendar}
              label="Backdate"
              color="bg-amber-600/20 text-white/50 hover:bg-amber-600/30"
              onClick={onBackdate}
            />
            <div className="border-l border-white/10 mx-1" />
            <ActionBtn
              icon={user.isFrozen ? Unlock : Snowflake}
              label={user.isFrozen ? "Unfreeze" : "Freeze"}
              color={
                user.isFrozen
                  ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                  : "bg-white/[0.08] text-white/50 hover:bg-white/[0.12]"
              }
              onClick={onFreeze}
            />
            <ActionBtn
              icon={user.isBlocked ? CheckCircle : Ban}
              label={user.isBlocked ? "Unblock" : "Block"}
              color={
                user.isBlocked
                  ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                  : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
              }
              onClick={onBlock}
            />
            <ActionBtn
              icon={user.tradingEnabled === false ? Play : Pause}
              label={
                user.tradingEnabled === false ? "Start Trade" : "Stop Trade"
              }
              color={
                user.tradingEnabled === false
                  ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                  : "bg-orange-600/20 text-orange-400 hover:bg-orange-600/30"
              }
              onClick={onTrade}
            />
            <div className="border-l border-white/10 mx-1" />
            <ActionBtn
              icon={Trash2}
              label="Delete"
              color="bg-red-600/20 text-red-500 hover:bg-red-600/40"
              onClick={onDelete}
            />
          </div>

          {user.transactions && user.transactions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Transaction History
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {user.transactions
                  .slice(-10)
                  .reverse()
                  .map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center gap-3 text-xs px-3 py-1.5 bg-white/[0.02] rounded"
                    >
                      <span
                        className={cn(
                          "font-medium w-14",
                          txn.type === "CREDIT" || txn.type === "PROFIT"
                            ? "text-green-400"
                            : "text-red-400",
                        )}
                      >
                        {txn.type}
                      </span>
                      <span
                        className={cn(
                          "w-24 text-right",
                          txn.amount >= 0 ? "text-green-400" : "text-red-400",
                        )}
                      >
                        {txn.amount >= 0 ? "+" : ""}
                        {formatCurrency(txn.amount)}
                      </span>
                      <span className="text-gray-500 flex-1 truncate">
                        {txn.note}
                      </span>
                      <span className="text-gray-600">
                        {new Date(txn.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reusable micro-components ───────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-600 uppercase tracking-wider text-[10px]">
        {label}
      </p>
      <p className="text-gray-300 mt-0.5 truncate">{value}</p>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
        color,
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── KYC Review Card ─────────────────────────────────────────────────────────
function KYCReviewCard({
  submission,
  onApprove,
  onReject,
}: {
  submission: KYCSubmission;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [imageModal, setImageModal] = useState<string | null>(null);

  const statusColor =
    submission.status === "PENDING"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : submission.status === "APPROVED"
        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        : "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <>
      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition text-left"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-white/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                {submission.userName}
              </span>
              <span className="text-xs text-gray-500">
                {submission.userEmail}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">
                Submitted {new Date(submission.submittedAt).toLocaleString()}
              </span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                  statusColor,
                )}
              >
                {submission.status}
              </span>
            </div>
          </div>
          {expanded ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="px-5 pb-5 border-t border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-xs">
              <InfoCell
                label="Full Name"
                value={`${submission.firstName} ${submission.lastName}`}
              />
              {submission.maidenName && (
                <InfoCell label="Maiden Name" value={submission.maidenName} />
              )}
              <InfoCell label="Date of Birth" value={submission.dateOfBirth} />
              <InfoCell label="Nationality" value={submission.nationality} />
              <InfoCell label="Phone" value={submission.phone} />
              <InfoCell
                label="SSN"
                value={`***-**-${submission.ssn.replace(/\D/g, "").slice(-4)}`}
              />
              <InfoCell
                label="ID Type"
                value={submission.idType.replace(/_/g, " ").toUpperCase()}
              />
              <InfoCell label="ID Number" value={submission.idNumber} />
              <InfoCell
                label="Address"
                value={`${submission.address}, ${submission.city}`}
              />
              <InfoCell
                label="State/ZIP"
                value={`${submission.state} ${submission.zipCode}`}
              />
              <InfoCell label="Country" value={submission.country} />
            </div>

            {/* Document Images */}
            <div className="mt-2 mb-4">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
                Uploaded Documents
              </p>
              <div className="flex gap-3 flex-wrap">
                {submission.idFrontImage && (
                  <button
                    onClick={() => setImageModal(submission.idFrontImage)}
                    className="w-32 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition relative group"
                  >
                    <img
                      src={submission.idFrontImage}
                      alt="ID Front"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-[10px] text-white font-medium">
                        ID Front
                      </span>
                    </div>
                  </button>
                )}
                {submission.idBackImage && (
                  <button
                    onClick={() => setImageModal(submission.idBackImage!)}
                    className="w-32 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition relative group"
                  >
                    <img
                      src={submission.idBackImage}
                      alt="ID Back"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-[10px] text-white font-medium">
                        ID Back
                      </span>
                    </div>
                  </button>
                )}
                {submission.selfieImage && (
                  <button
                    onClick={() => setImageModal(submission.selfieImage)}
                    className="w-32 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition relative group"
                  >
                    <img
                      src={submission.selfieImage}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-[10px] text-white font-medium">
                        Selfie
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Review link */}
            <div className="mb-4 bg-white/[0.03] rounded-lg px-4 py-3">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
                Direct Link to User
              </p>
              <p className="text-xs text-blue-400 font-mono break-all">
                /admin → Users → {submission.userEmail}
              </p>
            </div>

            {submission.reviewedAt && (
              <div className="mb-4 text-xs text-gray-500">
                Reviewed by{" "}
                <span className="text-white/60">{submission.reviewedBy}</span>{" "}
                on {new Date(submission.reviewedAt).toLocaleString()}
                {submission.rejectionReason && (
                  <span className="block mt-1 text-red-400">
                    Reason: {submission.rejectionReason}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            {submission.status === "PENDING" && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                {!rejecting ? (
                  <>
                    <button
                      onClick={onApprove}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition"
                    >
                      <CheckCircle size={14} />
                      Approve KYC
                    </button>
                    <button
                      onClick={() => setRejecting(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </>
                ) : (
                  <div className="flex-1 space-y-2">
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Rejection reason (required)..."
                      className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (reason.trim()) {
                            onReject(reason.trim());
                            setRejecting(false);
                            setReason("");
                          }
                        }}
                        disabled={!reason.trim()}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-bold transition",
                          reason.trim()
                            ? "bg-red-600 text-white hover:bg-red-500"
                            : "bg-red-600/20 text-red-400/50 cursor-not-allowed",
                        )}
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setRejecting(false);
                          setReason("");
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image modal */}
      {imageModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <div
            className="relative max-w-3xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageModal}
              alt="Document"
              className="max-w-full max-h-[80vh] rounded-xl"
            />
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white hover:bg-black transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
