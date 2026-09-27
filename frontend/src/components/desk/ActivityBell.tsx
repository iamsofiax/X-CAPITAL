"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useStore } from "@/store/useStore";
import { listNotices, markNoticesRead, unreadCount, type DeskNotice } from "@/lib/yieldDesk";

export function ActivityBell() {
  const userId = useStore((s) => s.user?.id ?? null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DeskNotice[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const pull = () => {
      if (!userId) {
        setItems([]);
        setUnread(0);
        return;
      }
      setItems(listNotices(userId).slice(0, 12));
      setUnread(unreadCount(userId));
    };
    pull();
    window.addEventListener("xc-yield", pull);
    return () => window.removeEventListener("xc-yield", pull);
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account activity"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && userId) markNoticesRead(userId);
        }}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
      >
        <Bell className="w-3.5 h-3.5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-40 w-[320px] rounded-xl border border-white/10 bg-[#07090b] p-3 shadow-2xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">Account activity</p>
          {items.length === 0 ? (
            <p className="text-xs text-white/45 py-3">No activity yet. Funding, growth, and book posts appear here.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-auto">
              {items.map((n) => (
                <li key={n.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                  <p className="text-[12px] font-semibold text-white">{n.title}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-[10px] font-mono text-white/30 mt-1">{new Date(n.at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
