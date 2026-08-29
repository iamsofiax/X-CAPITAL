"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ExternalLink,
  FileText,
  Gift,
  Link as LinkIcon,
  Lock,
  MessageSquare,
  Package,
  Search,
  Send,
  Shield,
  Trash2,
  TrendingUp,
  Unlock,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditEntry, KYCSubmission, UserNotification } from "@/store/useStore";
import type { User } from "@/types";
import { Field, SelectField } from "./deskUi";
import { InfoCell } from "./AdminUserRow";
import BullishSpikeControls from "./BullishSpikeControls";
import CommerceManager from "./CommerceManager";
import DepositAddressManager from "./DepositAddressManager";

export function KycTab({
  submissions,
  onApprove,
  onReject,
}: {
  submissions: KYCSubmission[];
  onApprove: (sub: KYCSubmission) => void;
  onReject: (sub: KYCSubmission, reason: string) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-12 text-center">
        <Shield size={40} className="text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No KYC submissions yet</p>
        <p className="text-gray-600 text-xs mt-1">Submissions will appear here when users verify their identity.</p>
      </div>
    );
  }
  const sorted = submissions.slice().sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
  return (
    <div className="space-y-4">
      {sorted.map((sub) => (
        <KYCReviewCard key={sub.id} submission={sub} onApprove={() => onApprove(sub)} onReject={(reason) => onReject(sub, reason)} />
      ))}
    </div>
  );
}

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
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition text-left">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-white/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{submission.userName}</span>
              <span className="text-xs text-gray-500">{submission.userEmail}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">Submitted {new Date(submission.submittedAt).toLocaleString()}</span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border", statusColor)}>{submission.status}</span>
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </button>
        {expanded && (
          <div className="px-5 pb-5 border-t border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-xs">
              <InfoCell label="Full Name" value={`${submission.firstName} ${submission.lastName}`} />
              {submission.maidenName && <InfoCell label="Maiden Name" value={submission.maidenName} />}
              <InfoCell label="Date of Birth" value={submission.dateOfBirth} />
              <InfoCell label="Nationality" value={submission.nationality} />
              <InfoCell label="Phone" value={submission.phone} />
              <InfoCell label="SSN" value={`***-**-${submission.ssn.replace(/\D/g, "").slice(-4)}`} />
              <InfoCell label="ID Type" value={submission.idType.replace(/_/g, " ").toUpperCase()} />
              <InfoCell label="ID Number" value={submission.idNumber} />
              <InfoCell label="Address" value={`${submission.address}, ${submission.city}`} />
              <InfoCell label="State/ZIP" value={`${submission.state} ${submission.zipCode}`} />
              <InfoCell label="Country" value={submission.country} />
            </div>
            <div className="mt-2 mb-4">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Uploaded Documents</p>
              <div className="flex gap-3 flex-wrap">
                {(["idFrontImage", "idBackImage", "selfieImage"] as const).map((key) => {
                  const src = submission[key];
                  if (!src) return null;
                  const label = key === "idFrontImage" ? "ID Front" : key === "idBackImage" ? "ID Back" : "Selfie";
                  return (
                    <button key={key} onClick={() => setImageModal(src)} className="w-32 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition relative group">
                      <img src={src} alt={label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium">{label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {submission.reviewedAt && (
              <div className="mb-4 text-xs text-gray-500">
                Reviewed by <span className="text-white/60">{submission.reviewedBy}</span> on {new Date(submission.reviewedAt).toLocaleString()}
                {submission.rejectionReason && <span className="block mt-1 text-red-400">Reason: {submission.rejectionReason}</span>}
              </div>
            )}
            {submission.status === "PENDING" && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                {!rejecting ? (
                  <>
                    <button onClick={onApprove} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition">
                      <CheckCircle size={14} /> Approve KYC
                    </button>
                    <button onClick={() => setRejecting(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition">
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                ) : (
                  <div className="flex-1 space-y-2">
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason (required)..." className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500/30" />
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
                        className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition", reason.trim() ? "bg-red-600 text-white hover:bg-red-500" : "bg-red-600/20 text-red-400/50 cursor-not-allowed")}
                      >
                        Confirm Reject
                      </button>
                      <button onClick={() => { setRejecting(false); setReason(""); }} className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition">
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
      {imageModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
          <div className="relative max-w-3xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img src={imageModal} alt="Document" className="max-w-full max-h-[80vh] rounded-xl" />
            <button onClick={() => setImageModal(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white hover:bg-black transition">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type NotifForm = {
  userId: string;
  title: string;
  message: string;
  type: UserNotification["type"];
  externalLink: string;
  externalLinkLabel: string;
};

export function NotificationsTab({
  notifForm,
  setNotifForm,
  users,
  notifications,
  onSend,
  onDelete,
}: {
  notifForm: NotifForm;
  setNotifForm: (next: NotifForm) => void;
  users: User[];
  notifications: UserNotification[];
  onSend: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={16} className="text-white/60" />
          <h3 className="text-sm font-semibold text-white">Compose Notification</h3>
        </div>
        <SelectField label="Type" value={notifForm.type} options={["congratulations", "reward", "system", "transaction"]} onChange={(v) => setNotifForm({ ...notifForm, type: v as UserNotification["type"] })} />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Send To</label>
          <select value={notifForm.userId} onChange={(e) => setNotifForm({ ...notifForm, userId: e.target.value })} className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
            <option value="">All Users</option>
            {users.filter((u) => u.role !== "GOD_ADMIN").map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
            ))}
          </select>
        </div>
        <Field label="Title" value={notifForm.title} onChange={(v) => setNotifForm({ ...notifForm, title: v })} placeholder="Congratulations!" />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Message</label>
          <textarea value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} placeholder="Write your message here..." rows={4} className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none" />
        </div>
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon size={14} className="text-white/40" />
            <span className="text-xs text-gray-500 font-semibold">External Link (optional)</span>
          </div>
          <Field label="Link URL" value={notifForm.externalLink} onChange={(v) => setNotifForm({ ...notifForm, externalLink: v })} placeholder="https://reward.example.com/claim" />
          <div className="mt-2">
            <Field label="Link Label" value={notifForm.externalLinkLabel} onChange={(v) => setNotifForm({ ...notifForm, externalLinkLabel: v })} placeholder="Claim Reward" />
          </div>
        </div>
        <button onClick={onSend} className="w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
          <Send size={14} /> Send Notification
        </button>
      </div>
      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Sent Notifications</h3>
          <span className="text-xs text-gray-500">{notifications.length} total</span>
        </div>
        {notifications.length === 0 ? (
          <p className="text-center py-12 text-gray-600 text-sm">No notifications sent yet</p>
        ) : (
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
            {notifications.slice(0, 50).map((n) => (
              <div key={n.id} className="px-5 py-3 flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", n.type === "congratulations" ? "bg-amber-500/20" : n.type === "reward" ? "bg-emerald-500/20" : n.type === "transaction" ? "bg-blue-500/20" : "bg-white/5")}>
                  {n.type === "congratulations" ? <Gift size={14} className="text-amber-400" /> : n.type === "reward" ? <Gift size={14} className="text-emerald-400" /> : n.type === "transaction" ? <DollarSign size={14} className="text-blue-400" /> : <Bell size={14} className="text-white/50" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  {n.externalLink && (
                    <a href={n.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1">
                      <ExternalLink size={10} /> {n.externalLinkLabel || "Open Link"}
                    </a>
                  )}
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString()} · {users.find((u) => u.id === n.userId)?.email || n.userId}</p>
                </div>
                <button onClick={() => onDelete(n.id)} className="text-gray-600 hover:text-red-400 transition p-1 flex-shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TosTab({
  termsOfService,
  tosContent,
  tosEditing,
  onToggleEdit,
  onChange,
  onSave,
  onCancel,
}: {
  termsOfService: string;
  tosContent: string;
  tosEditing: boolean;
  onToggleEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="max-w-3xl">
      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-white/60" />
            <h3 className="text-sm font-semibold text-white">Terms of Service</h3>
          </div>
          <button onClick={onToggleEdit} className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition", tosEditing ? "bg-emerald-600 hover:bg-emerald-500" : "bg-white/[0.08] hover:bg-white/[0.12]")}>
            {tosEditing ? "Save Changes" : "Edit"}
          </button>
        </div>
        <div className="p-6">
          {tosEditing ? (
            <textarea value={tosContent} onChange={(e) => onChange(e.target.value)} rows={20} className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-4 text-sm text-white font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-white/20 resize-y min-h-[400px]" />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">{termsOfService}</pre>
          )}
          {tosEditing && (
            <div className="flex gap-3 mt-4">
              <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancel</button>
              <button onClick={onSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition">Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditTab({
  entries,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  entries: AuditEntry[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        <span className="text-xs text-gray-500">{entries.length} entries</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-center py-12 text-gray-600 text-sm">No audit entries yet</p>
      ) : (
        <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="px-5 py-3 flex items-center gap-4 text-sm">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", entry.level === "success" && "bg-green-500", entry.level === "warning" && "bg-yellow-500", entry.level === "danger" && "bg-red-500", entry.level === "action" && "bg-white/30", entry.level === "info" && "bg-blue-500")} />
              <span className="text-gray-500 text-xs w-36 flex-shrink-0">{new Date(entry.time).toLocaleString()}</span>
              <span className="text-white font-medium flex-1">{entry.action}</span>
              <span className="text-gray-400 text-xs">{entry.target}</span>
              <span className="text-gray-600 text-xs">{entry.actor}</span>
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <button onClick={onLoadMore} disabled={loadingMore} className="w-full py-2.5 text-sm text-white/60 hover:text-white border-t border-white/5 disabled:opacity-50">
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

const RAILS = ["trading", "portfolio", "funds", "commerce", "oracle"] as const;

export function RailsTab({
  search,
  onSearch,
  users,
  onToggleRail,
  onUnlockAll,
  onLockAll,
}: {
  search: string;
  onSearch: (q: string) => void;
  users: User[];
  onToggleRail: (u: User, rail: string) => void;
  onUnlockAll: (u: User) => void;
  onLockAll: (u: User) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-5 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Unlock size={15} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Rail Access Manager</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Grant or revoke access to specific capital rails for individual users, regardless of their current phase. Unlocked rails bypass the ARMED requirement — use with precision.
        </p>
      </div>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or email…" className="w-full md:w-96 pl-9 pr-4 py-2.5 bg-[#12121a] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20" />
      </div>
      <div className="space-y-3">
        {users.map((u) => {
          const unlocked: string[] = u.unlockedRails ?? [];
          return (
            <div key={u.id} className="bg-[#12121a] border border-white/5 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {(u.firstName?.[0] ?? "?").toUpperCase()}{(u.lastName?.[0] ?? "").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500">{u.email} · <span className="text-gray-600">{u.tier}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", u.isFrozen ? "bg-red-600/20 text-red-400" : unlocked.length >= RAILS.length ? "bg-emerald-600/20 text-emerald-400" : unlocked.length > 0 ? "bg-amber-600/20 text-amber-400" : "bg-white/5 text-gray-500")}>
                    {u.isFrozen ? "FROZEN" : unlocked.length >= RAILS.length ? "FULL ACCESS" : unlocked.length > 0 ? `${unlocked.length} RAILS OPEN` : "PHASE GATE ONLY"}
                  </span>
                  <button onClick={() => onUnlockAll(u)} className="text-[10px] px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md font-bold transition">Unlock All</button>
                  <button onClick={() => onLockAll(u)} className="text-[10px] px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-md font-bold transition">Lock All</button>
                </div>
              </div>
              <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 gap-2">
                {RAILS.map((rail) => {
                  const isOn = unlocked.includes(rail);
                  return (
                    <button key={rail} onClick={() => onToggleRail(u, rail)} disabled={!!u.isFrozen} className={cn("py-3 rounded-lg border flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-150", isOn ? "bg-emerald-600/20 border-emerald-600/40 text-emerald-300 hover:bg-emerald-600/30" : "bg-white/[0.03] border-white/[0.06] text-gray-600 hover:text-white hover:border-white/10", u.isFrozen && "opacity-30 cursor-not-allowed")}>
                      {isOn ? <Unlock size={12} /> : <Lock size={12} />}
                      {rail}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CreateForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  tier: string;
};

export function CreateUserTab({
  createForm,
  setCreateForm,
  onCreate,
}: {
  createForm: CreateForm;
  setCreateForm: (next: CreateForm) => void;
  onCreate: () => void;
}) {
  return (
    <div className="max-w-lg">
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white mb-2">Create New User</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" value={createForm.firstName} onChange={(v) => setCreateForm({ ...createForm, firstName: v })} />
          <Field label="Last Name" value={createForm.lastName} onChange={(v) => setCreateForm({ ...createForm, lastName: v })} />
        </div>
        <Field label="Email" value={createForm.email} type="email" onChange={(v) => setCreateForm({ ...createForm, email: v })} />
        <Field label="Password" value={createForm.password} type="password" onChange={(v) => setCreateForm({ ...createForm, password: v })} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Role" value={createForm.role} options={["USER", "ADMIN"]} onChange={(v) => setCreateForm({ ...createForm, role: v })} />
          <SelectField label="Tier" value={createForm.tier} options={["CORE", "GOLD", "BLACK"]} onChange={(v) => setCreateForm({ ...createForm, tier: v })} />
        </div>
        <button onClick={onCreate} className="w-full mt-2 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-sm font-medium transition">
          Create User
        </button>
      </div>
    </div>
  );
}

export function SpikesTab() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Bullish Spike Controls</h3>
            <p className="text-xs text-gray-500">Apply temporary yield boosts, configure daily profit rates, and manage active spikes per user.</p>
          </div>
        </div>
      </div>
      <BullishSpikeControls />
    </div>
  );
}

export function CommerceTab() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Commerce Manager</h3>
            <p className="text-xs text-gray-500">Manage the live product catalog. Changes write to the book when a session is open.</p>
          </div>
        </div>
      </div>
      <CommerceManager />
    </div>
  );
}

export function DepositAddressesTab() {
  return (
    <div className="max-w-6xl mx-auto">
      <DepositAddressManager />
    </div>
  );
}
