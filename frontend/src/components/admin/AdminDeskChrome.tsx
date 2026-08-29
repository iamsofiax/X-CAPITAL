"use client";

import {
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Unlock,
  Ban,
  Clock,
  UserPlus,
  Snowflake,
  Activity,
  LogOut,
  FileText,
  Bell,
  Package,
  Wallet,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { StatCard, type AdminTab } from "./deskUi";

export function AdminDeskHeader({
  email,
  onLogout,
}: {
  email?: string;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 bg-[#08080c]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            X-CAPITAL{" "}
            <span className="text-white/60 text-sm font-normal ml-1">
              OPERATOR DESK
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{email}</span>
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-white transition p-2"
            title="Close session"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function AdminDeskStats({
  pendingCount,
  total,
  totalBalance,
  frozenCount,
  blockedCount,
  tradingCount,
}: {
  pendingCount: number;
  total: number;
  totalBalance: number;
  frozenCount: number;
  blockedCount: number;
  tradingCount: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      <StatCard
        label="Pending"
        value={pendingCount}
        icon={Clock}
        accent="bg-amber-600/20 text-amber-400"
      />
      <StatCard
        label="Nodes"
        value={total}
        icon={Users}
        accent="bg-white/[0.08] text-white/60"
      />
      <StatCard
        label="Book"
        value={formatCurrency(totalBalance, true)}
        icon={DollarSign}
        accent="bg-green-600/20 text-green-400"
      />
      <StatCard
        label="Frozen"
        value={frozenCount}
        icon={Snowflake}
        accent="bg-white/[0.08] text-white/50"
      />
      <StatCard
        label="Blocked"
        value={blockedCount}
        icon={Ban}
        accent="bg-red-600/20 text-red-400"
      />
      <StatCard
        label="Trading"
        value={tradingCount}
        icon={Activity}
        accent="bg-white/[0.08] text-white/50"
      />
    </div>
  );
}

const TABS: Array<{
  key: AdminTab;
  label: string;
  icon: React.ElementType;
}> = [
  { key: "transactions", label: "Transactions", icon: DollarSign },
  { key: "users", label: "Nodes", icon: Users },
  { key: "kyc", label: "KYC", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "tos", label: "Terms", icon: FileText },
  { key: "audit", label: "Audit", icon: Clock },
  { key: "create", label: "Create node", icon: UserPlus },
  { key: "rails", label: "Rail access", icon: Unlock },
  { key: "bullish", label: "Spikes", icon: TrendingUp },
  { key: "commerce", label: "Commerce", icon: Package },
  { key: "deposit_addresses", label: "Deposit addresses", icon: Wallet },
];

export function AdminTabNav({
  activeTab,
  onChange,
  pendingCount,
  kycPending,
}: {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
  pendingCount: number;
  kycPending: number;
}) {
  return (
    <div className="flex items-center gap-1 mb-6 bg-[#12121a] rounded-lg p-1 w-fit flex-wrap">
      {TABS.map((t) => {
        const badge =
          t.key === "transactions" && pendingCount > 0
            ? pendingCount
            : t.key === "kyc" && kycPending > 0
              ? kycPending
              : undefined;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition relative",
              activeTab === t.key
                ? "bg-white/[0.08] text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5",
            )}
          >
            <t.icon size={14} />
            {t.label}
            {badge !== undefined && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded-full">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
