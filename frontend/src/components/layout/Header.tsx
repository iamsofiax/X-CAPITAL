"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Bell, Menu, Search, Activity, TrendingUp, TrendingDown } from "lucide-react";
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

// Live market ticker — cycles through key instruments
const TICKERS = [
  { sym: "TSLA", price: "248.37", chg: "+2.84%", up: true },
  { sym: "NVDA", price: "946.21", chg: "+1.22%", up: true },
  { sym: "SPX",  price: "5,821", chg: "+0.41%", up: true },
  { sym: "BTC",  price: "94,112", chg: "-0.38%", up: false },
  { sym: "AMZN", price: "213.54", chg: "+1.09%", up: true },
  { sym: "XLINK","price": "2,441", chg: "+6.12%", up: true },
];

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, setSidebarOpen, notifications } = useStore();
  const { phase, phaseLabel, balance } = useXEngine();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [pulse, setPulse] = useState(false);
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

  // Cycle tickers every 3.5 s
  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => {
        setTickerIdx((i) => (i + 1) % TICKERS.length);
        setPulse(false);
      }, 200);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const ticker = TICKERS[tickerIdx];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#020204]/90 backdrop-blur-xl">
        {/* Main header row */}
        <div className="flex items-center justify-between px-4 md:px-6 h-14 gap-4">
          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="engine-mono text-[9px] text-white/25 truncate hidden sm:block tracking-wider">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">

            {/* Live ticker chip */}
            <div
              className={cn(
                "hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] transition-opacity duration-200",
                pulse && "opacity-0",
              )}
            >
              <span className="engine-mono text-[9px] text-white/35 font-bold">{ticker.sym}</span>
              <span className="engine-mono text-[10px] text-white/60 font-bold tabular-nums">{ticker.price}</span>
              <span className={cn("engine-mono text-[9px] font-bold", ticker.up ? "text-emerald-400" : "text-red-400")}>
                {ticker.up ? <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 inline mr-0.5" />}
                {ticker.chg}
              </span>
            </div>

            {/* Phase + balance chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Activity className="w-2.5 h-2.5 text-emerald-500/60 animate-pulse shrink-0" />
              <span className={cn("engine-mono text-[8px] font-bold tracking-wider", PHASE_COLOR[phase])}>
                {phaseLabel}
              </span>
              <span className="w-px h-3 bg-white/[0.08]" />
              <span className="engine-mono text-[10px] text-emerald-400 font-bold tabular-nums">
                {formatCurrency(balance)}
              </span>
            </div>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={() => setNotifsOpen((o) => !o)}
                className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center bg-emerald-500 text-black font-black text-[8px] rounded-full px-1">
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

            {/* Avatar */}
            {user && (
              <div className="w-8 h-8 rounded-lg bg-white/[0.07] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt=""
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white text-[11px] font-bold">
                    {user.firstName?.[0] ?? ""}{user.lastName?.[0] ?? ""}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sub-strip: instrument context breadcrumb */}
        <div className="hidden md:flex items-center gap-0 border-t border-white/[0.03] px-6 h-7 overflow-hidden">
          {TICKERS.map((t, i) => (
            <div
              key={t.sym}
              className={cn(
                "flex items-center gap-1.5 pr-4 mr-4 border-r border-white/[0.04] transition-all duration-300",
                i === tickerIdx ? "opacity-100" : "opacity-25",
                i === TICKERS.length - 1 && "border-r-0",
              )}
            >
              <span className="engine-mono text-[8px] text-white/50 font-bold">{t.sym}</span>
              <span className={cn("engine-mono text-[8px] font-bold tabular-nums", t.up ? "text-emerald-400/80" : "text-red-400/80")}>{t.chg}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="engine-mono text-[8px] text-emerald-500/50 tracking-widest">MARKETS LIVE</span>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
