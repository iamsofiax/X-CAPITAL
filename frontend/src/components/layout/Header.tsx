"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Bell, Menu, Search } from "lucide-react";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import SearchModal from "./SearchModal";
import NotificationsPanel from "./NotificationsPanel";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, wallet, setSidebarOpen } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [unread, setUnread] = useState(3);

  // Ctrl/Cmd+K shortcut to open search
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
      <header className="h-16 md:h-[72px] flex items-center justify-between px-5 md:px-8 border-b border-white/[0.08] bg-xc-dark/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-xc-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-xc-muted">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Balance pill */}
          {wallet && (
            <div className="hidden md:flex items-center gap-2 glass border border-white/5 rounded-full px-4 py-1.5 text-sm">
              <span className="text-xc-muted text-xs">Balance</span>
              <span className="font-mono font-bold text-xc-green">
                {formatCurrency(Number(wallet.fiatBalance))}
              </span>
            </div>
          )}

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 glass border border-white/5 rounded-full flex items-center justify-center text-xc-muted hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              ref={bellRef}
              onClick={() => setNotifsOpen((o) => !o)}
              className="relative w-9 h-9 glass border border-white/5 rounded-full flex items-center justify-center text-xc-muted hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-xc-purple text-black font-bold text-[10px] font-bold rounded-full px-1">
                  {unread}
                </span>
              )}
            </button>
            <NotificationsPanel
              open={notifsOpen}
              onClose={() => {
                setNotifsOpen(false);
                setUnread(0);
              }}
              anchorRef={bellRef}
            />
          </div>

          {/* Avatar */}
          {user && (
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer overflow-hidden">
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
      </header>

      {/* Search Modal (portaled) */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
