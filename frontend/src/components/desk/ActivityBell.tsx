"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { listNotices, markNoticesRead, unreadCount, type DeskNotice } from "@/lib/yieldDesk";

export function ActivityBell() {
  const userId = useStore((s) => s.user?.id ?? null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DeskNotice[]>([]);
  const [unread, setUnread] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lastToggle = useRef(0);
  const booted = useRef(false);
  const seen = useRef<string | null>(null);
  const [toast, setToast] = useState<DeskNotice | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    booted.current = false;
    const pull = () => {
      if (!userId) {
        setItems([]);
        setUnread(0);
        return;
      }
      const rows = listNotices(userId);
      const next = rows.slice(0, 12);
      setItems((prev) =>
        prev.length === next.length && prev.every((row, i) => row.id === next[i]?.id && row.read === next[i]?.read)
          ? prev
          : next,
      );
      setUnread((prev) => {
        const count = unreadCount(userId);
        return prev === count ? prev : count;
      });
      const latest = rows[0];
      if (!booted.current) {
        booted.current = true;
        seen.current = latest?.id ?? null;
        return;
      }
      if (latest && !latest.read && latest.id !== seen.current) {
        seen.current = latest.id;
        setToast(latest);
      }
    };
    pull();
    const id = window.setInterval(pull, 5000);
    window.addEventListener("xc-yield", pull);
    window.addEventListener("storage", pull);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("xc-yield", pull);
      window.removeEventListener("storage", pull);
    };
  }, [userId]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!userId) return null;

  const toggle = () => {
    const now = Date.now();
    if (now - lastToggle.current < 80) return;
    lastToggle.current = now;
    setOpen((v) => {
      const next = !v;
      if (next) markNoticesRead(userId);
      return next;
    });
  };

  const sheet = open ? (
    <>
      <button
        type="button"
        aria-label="Close activity"
        className="fixed inset-0 z-[70] bg-black/70"
        onClick={() => setOpen(false)}
      />
      <div className="fixed z-[80] inset-x-3 top-20 bottom-24 md:inset-x-auto md:right-5 md:top-24 md:bottom-auto md:w-[380px] rounded-2xl border-[1.5px] border-white/15 bg-[#07090c] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/45">Account activity</p>
          <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-white/55 py-6">No activity yet. Booking, live, and halt notices appear here.</p>
        ) : (
          <ul className="space-y-2 max-h-[60vh] md:max-h-96 overflow-auto">
            {items.map((n) => (
              <li key={n.id} className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-3 py-3">
                <p className="text-[13px] font-semibold text-white">{n.title}</p>
                <p className="text-[12px] text-white/55 mt-1 leading-snug">{n.body}</p>
                <p className="text-[10px] font-mono text-white/30 mt-1.5">{new Date(n.at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  ) : null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account activity"
        aria-expanded={open}
        onClick={toggle}
        className="relative w-10 h-10 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400" />
        )}
      </button>
      {mounted && sheet ? createPortal(sheet, document.body) : null}
      {mounted && toast && createPortal(
        <button
          type="button"
          onClick={() => { setToast(null); setOpen(true); if (userId) markNoticesRead(userId); }}
          className="fixed z-[85] bottom-4 left-4 right-4 md:left-auto md:right-5 md:w-[360px] rounded-2xl border border-emerald-400/30 bg-[#07110d] px-4 py-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/80">Desk</p>
          <p className="mt-1 text-sm font-bold text-white">{toast.title}</p>
          <p className="mt-1 text-[12px] text-white/60 leading-snug">{toast.body}</p>
        </button>,
        document.body,
      )}
    </div>
  );
}
