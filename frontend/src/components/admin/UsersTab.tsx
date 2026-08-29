"use client";

import { Search, Users } from "lucide-react";
import type { User } from "@/types";
import { UserRow } from "./AdminUserRow";

export function UsersTab({
  search,
  onSearch,
  users,
  expandedUser,
  onToggleExpand,
  hasMore,
  loadingMore,
  onLoadMore,
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
  search: string;
  onSearch: (q: string) => void;
  users: User[];
  expandedUser: string | null;
  onToggleExpand: (id: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onFreeze: (u: User) => void;
  onBlock: (u: User) => void;
  onTrade: (u: User) => void;
  onFund: (u: User) => void;
  onDebit: (u: User) => void;
  onEdit: (u: User) => void;
  onProfit: (u: User) => void;
  onBackdate: (u: User) => void;
  onDelete: (u: User) => void;
  onVerifyKYC: (u: User) => void;
  onRejectKYC: (u: User) => void;
}) {
  return (
    <div>
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, email, or ID…"
          className="w-full md:w-96 pl-10 pr-4 py-2.5 bg-[#12121a] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      {users.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p>No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isExpanded={expandedUser === u.id}
              onToggleExpand={() => onToggleExpand(u.id)}
              onFreeze={() => onFreeze(u)}
              onBlock={() => onBlock(u)}
              onTrade={() => onTrade(u)}
              onFund={() => onFund(u)}
              onDebit={() => onDebit(u)}
              onEdit={() => onEdit(u)}
              onProfit={() => onProfit(u)}
              onBackdate={() => onBackdate(u)}
              onDelete={() => onDelete(u)}
              onVerifyKYC={() => onVerifyKYC(u)}
              onRejectKYC={() => onRejectKYC(u)}
            />
          ))}
        </div>
      )}
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="mt-5 w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.10] rounded-lg text-sm text-white/70 disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more nodes"}
        </button>
      )}
    </div>
  );
}
