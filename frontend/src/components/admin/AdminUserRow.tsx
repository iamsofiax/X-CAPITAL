"use client";

import {
  Ban,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit3,
  Pause,
  Percent,
  Play,
  Shield,
  Snowflake,
  Trash2,
  TrendingUp,
  Unlock,
  XCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { User } from "@/types";

export function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-600 uppercase tracking-wider text-[10px]">{label}</p>
      <p className="text-gray-300 mt-0.5 truncate">{value}</p>
    </div>
  );
}

export function ActionBtn({
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

export function UserRow({
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
  onVerifyKYC,
  onRejectKYC,
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
  onVerifyKYC?: () => void;
  onRejectKYC?: () => void;
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
        <span className={cn("text-[10px] px-2 py-0.5 rounded font-medium", tierColor)}>
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
      {isExpanded && <UserRowExpanded user={user} onFreeze={onFreeze} onBlock={onBlock} onTrade={onTrade} onFund={onFund} onDebit={onDebit} onEdit={onEdit} onProfit={onProfit} onBackdate={onBackdate} onDelete={onDelete} onVerifyKYC={onVerifyKYC} onRejectKYC={onRejectKYC} />}
    </div>
  );
}

function UserRowExpanded(props: {
  user: User;
  onFreeze: () => void;
  onBlock: () => void;
  onTrade: () => void;
  onFund: () => void;
  onDebit: () => void;
  onEdit: () => void;
  onProfit: () => void;
  onBackdate: () => void;
  onDelete: () => void;
  onVerifyKYC?: () => void;
  onRejectKYC?: () => void;
}) {
  const {
    user,
    onFreeze,
    onBlock,
    onTrade,
    onFund,
    onDebit,
    onEdit,
    onProfit,
    onBackdate,
    onDelete,
    onVerifyKYC,
    onRejectKYC,
  } = props;
  return (
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
            <ActionBtn icon={DollarSign} label="Fund" color="bg-green-600/20 text-green-400 hover:bg-green-600/30" onClick={onFund} />
            <ActionBtn icon={TrendingUp} label="Debit" color="bg-red-600/20 text-red-400 hover:bg-red-600/30" onClick={onDebit} />
            <ActionBtn icon={Edit3} label="Edit" color="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" onClick={onEdit} />
            <ActionBtn icon={Percent} label="Profit" color="bg-white/[0.08] text-white/60 hover:bg-white/[0.12]" onClick={onProfit} />
            <ActionBtn icon={Calendar} label="Backdate" color="bg-amber-600/20 text-white/50 hover:bg-amber-600/30" onClick={onBackdate} />
            <div className="border-l border-white/10 mx-1" />
            <ActionBtn
              icon={user.isFrozen ? Unlock : Snowflake}
              label={user.isFrozen ? "Unfreeze" : "Freeze"}
              color={user.isFrozen ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" : "bg-white/[0.08] text-white/50 hover:bg-white/[0.12]"}
              onClick={onFreeze}
            />
            <ActionBtn
              icon={user.isBlocked ? CheckCircle : Ban}
              label={user.isBlocked ? "Unblock" : "Block"}
              color={user.isBlocked ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" : "bg-red-600/20 text-red-400 hover:bg-red-600/30"}
              onClick={onBlock}
            />
            <ActionBtn
              icon={user.tradingEnabled === false ? Play : Pause}
              label={user.tradingEnabled === false ? "Start Trade" : "Stop Trade"}
              color={user.tradingEnabled === false ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" : "bg-orange-600/20 text-orange-400 hover:bg-orange-600/30"}
              onClick={onTrade}
            />
            <div className="border-l border-white/10 mx-1" />
            <ActionBtn icon={Trash2} label="Delete" color="bg-red-600/20 text-red-500 hover:bg-red-600/40" onClick={onDelete} />
          </div>
          {(user.kycStatus === "PENDING" || user.kycStatus === "NOT_STARTED") && (onVerifyKYC || onRejectKYC) && (
            <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-center gap-3 flex-wrap">
              <Shield size={14} className="text-amber-400 shrink-0" />
              <span className="text-xs text-amber-300 flex-1">
                KYC Status: <strong>{user.kycStatus}</strong> — review and verify identity
              </span>
              {onVerifyKYC && (
                <button onClick={onVerifyKYC} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-bold transition">
                  <CheckCircle size={12} /> Approve KYC
                </button>
              )}
              {onRejectKYC && (
                <button onClick={onRejectKYC} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-xs font-bold transition">
                  <XCircle size={12} /> Reject
                </button>
              )}
            </div>
          )}
          {user.kycStatus === "APPROVED" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={12} /> <span>Identity Verified</span>
            </div>
          )}
          {user.transactions && user.transactions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Transaction History</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {user.transactions.slice(-10).reverse().map((txn) => (
                  <div key={txn.id} className="flex items-center gap-3 text-xs px-3 py-1.5 bg-white/[0.02] rounded">
                    <span className={cn("font-medium w-14", txn.type === "CREDIT" || txn.type === "PROFIT" ? "text-green-400" : "text-red-400")}>{txn.type}</span>
                    <span className={cn("w-24 text-right", txn.amount >= 0 ? "text-green-400" : "text-red-400")}>
                      {txn.amount >= 0 ? "+" : ""}
                      {formatCurrency(txn.amount)}
                    </span>
                    <span className="text-gray-500 flex-1 truncate">{txn.note}</span>
                    <span className="text-gray-600">{new Date(txn.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
  );
}
