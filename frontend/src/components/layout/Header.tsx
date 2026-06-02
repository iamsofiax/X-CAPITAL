"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Bell, Menu, Search } from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useXEngine } from "@/hooks/useXEngine";
import { PHASE_COLOR } from "@/lib/xEngine";
import SearchModal from "./SearchModal";
import NotificationsPanel from "./NotificationsPanel";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, setSidebarOpen, notifications } = useStore();
  const { phase, phaseLabel, balance } = useXEngine();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const unread = notifications.filter(
    (n) => n.userId === user?.id && !n.read,
  ).length;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 md:px-8 h-14 md:h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-white/40 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div
              className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]",
              )}
            >
              <span
                className={cn(
                  "engine-mono text-[9px] font-bold tracking-wider",
                  PHASE_COLOR[phase],
                )}
              >
                {phaseLabel}
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="engine-mono text-[10px] text-emerald-400 font-bold">
                {formatCurrency(balance)}
              </span>
            </div>

            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => setNotifsOpen((o) => !o)}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center bg-emerald-500 text-black font-bold text-[9px] rounded-full px-1">
                    {unread}
                  </span>
                )}
              </button>
              <NotificationsPanel
                open={notifsOpen}
                onClose={() => setNotifsOpen(false)}
                anchorRef={bellRef}
              />
            </div>

            {user && (
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt=""
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white text-xs font-bold">
                    {user.firstName?.[0] ?? ""}
                    {user.lastName?.[0] ?? ""}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
