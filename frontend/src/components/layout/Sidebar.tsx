"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Globe,
  ShoppingBag,
  Wallet,
  Cpu,
  Home,
  LogOut,
  Settings,
  X,
  Zap,
  Lock,
  Unlock,
  Radio,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { XCapitalLogo } from "@/components/brand/XCapitalLogo";
import { useXEngine } from "@/hooks/useXEngine";
import { cn } from "@/lib/utils";
import type { EngineRail } from "@/lib/xEngine";

const navItems: {
  href: string;
  icon: typeof Home;
  label: string;
  code: string;
  rail: EngineRail;
  railIndex: number;
}[] = [
  { href: "/dashboard",  icon: Home,       label: "Overview",   code: "OPS-00", rail: "engine",    railIndex: 0 },
  { href: "/wallet",     icon: Wallet,      label: "Uplink",     code: "UPL-07",  rail: "wallet",    railIndex: 7 },
  { href: "/trading",    icon: BarChart3,   label: "Execution",  code: "EXEC-01", rail: "trading",   railIndex: 1 },
  { href: "/portfolio",  icon: Briefcase,   label: "Holdings",   code: "HOLD-02", rail: "portfolio", railIndex: 2 },
  { href: "/funds",      icon: Globe,       label: "Funds",      code: "FUND-03", rail: "funds",     railIndex: 3 },
  { href: "/commerce",   icon: ShoppingBag, label: "Commerce",   code: "COMM-04", rail: "commerce",  railIndex: 4 },
  { href: "/oracle",     icon: Cpu,         label: "Oracle",     code: "INF-05",  rail: "oracle",    railIndex: 5 },
  { href: "/engine",     icon: Zap,         label: "Engine",     code: "CORE-06", rail: "engine",    railIndex: 6 },
];

// Rail accent colours matching the 7-rail system
const RAIL_COLORS = [
  "bg-white",
  "bg-white",
  "bg-amber-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-indigo-400",
  "bg-cyan-400",
];

function useUTCClock() {
  const [time, setTime] = useState("");
  const [session, setSession] = useState<"TOKYO" | "LONDON" | "NEW YORK" | "CLOSED">("CLOSED");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getUTCHours();
      const m = now.getUTCMinutes().toString().padStart(2, "0");
      const s = now.getUTCSeconds().toString().padStart(2, "0");
      const next = `${h.toString().padStart(2, "0")}:${m}:${s} UTC`;
      setTime((prev) => (prev === next ? prev : next));

      const nextSession: "TOKYO" | "LONDON" | "NEW YORK" | "CLOSED" =
        h >= 13 && h < 22
          ? "NEW YORK"
          : h >= 8 && h < 17
            ? "LONDON"
            : h >= 0 && h < 9
              ? "TOKYO"
              : "CLOSED";
      setSession((prev) => (prev === nextSession ? prev : nextSession));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { time, session };
}

const SESSION_COLOR: Record<string, string> = {
  TOKYO:    "text-violet-400",
  LONDON:   "text-amber-400",
  "NEW YORK": "text-emerald-400",
  CLOSED:   "text-white/25",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, user, logout, theme } = useStore();
  const { canAccess, nodeId, phaseLabel, unlockedRails } = useXEngine();
  const { time, session } = useUTCClock();
  const uptime = 99.97;
  const isLight = theme === "light";
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          isLight
            ? "bg-white border-r border-black/[0.08]"
            : "bg-[#020204] border-r border-white/[0.05]",
          "w-[272px] transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:w-[68px] lg:w-[232px]",
        )}
      >
        {/* ── BRAND HEADER ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 pt-5 pb-4 border-b border-white/[0.05]">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-zinc-950 to-black border border-white/10 flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              <XCapitalLogo size={20} />
            </div>
            <div className="md:hidden lg:block min-w-0">
              <span className="font-black text-sm text-white tracking-widest block leading-none">CAPITAL</span>
              <span className="engine-mono text-[8px] text-white/25 tracking-[0.2em]">{nodeId}</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg text-white/30 hover:text-white hover:bg-white/5 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SYSTEM STATUS STRIP ─────────────────────────────── */}
        <div className="px-3 py-3 border-b border-white/[0.04] md:hidden lg:block">
          {/* Live clock */}
          <div className="flex items-center justify-between mb-2">
            <span className="engine-mono text-[9px] text-white/20 tracking-widest">MARKET CLOCK</span>
            <span className="engine-mono text-[9px] text-white/50 tabular-nums">{time}</span>
          </div>
          {/* Session badge */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="engine-mono text-[9px] text-white/20 tracking-widest">SESSION</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", session === "CLOSED" ? "bg-white/15" : "bg-emerald-400")} />
              <span className={cn("engine-mono text-[9px] font-bold tracking-wider", SESSION_COLOR[session])}>{session}</span>
            </div>
          </div>
          {/* System uptime bar */}
          <div className="flex items-center justify-between mb-1">
            <span className="engine-mono text-[9px] text-white/20 tracking-widest">UPTIME</span>
            <span className="engine-mono text-[9px] text-emerald-400/70">{uptime}%</span>
          </div>
          <div className="h-0.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${uptime}%` }} />
          </div>
        </div>

        {/* ── PHASE LABEL ─────────────────────────────────────── */}
        <div className="px-3 py-2.5 md:hidden lg:block">
          <div className="flex items-center gap-2">
            <Radio className="w-2.5 h-2.5 text-emerald-500/60 shrink-0" />
            <span className="engine-mono text-[9px] text-emerald-500/70 tracking-[0.15em]">{phaseLabel}</span>
          </div>
        </div>

        {/* ── NAVIGATION ──────────────────────────────────────── */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, rail, railIndex }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const locked = !canAccess(rail);
            const adminLive =
              !locked && unlockedRails?.includes(rail) === true;
            const dotColor = RAIL_COLORS[railIndex % RAIL_COLORS.length];

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors duration-100",
                  "md:justify-center lg:justify-start",
                  active
                    ? isLight
                      ? "bg-black/[0.07] text-black shadow-sm"
                      : "bg-white/[0.09] text-white shadow-sm"
                    : isLight
                      ? "text-black/50 hover:text-black hover:bg-black/[0.05]"
                      : "text-white/55 hover:text-white hover:bg-white/[0.06]",
                )}
              >
                {/* Active rail accent line */}
                {active && (
                  <span className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full", dotColor)} />
                )}

                {/* Rail dot */}
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0 transition-opacity md:hidden lg:inline-block",
                    active ? cn(dotColor, "opacity-90") : "bg-white/15",
                  )}
                />

                <Icon
                  className="w-[18px] h-[18px] shrink-0"
                  strokeWidth={active ? 2.2 : 1.8}
                />

                <span className={cn(
                  "md:hidden lg:inline flex-1 text-[14px] tracking-tight",
                  active ? "font-extrabold" : "font-semibold",
                )}>{label}</span>

                {adminLive && !active && (
                  <span className="md:hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-[8px] font-bold text-emerald-400 tracking-wider shrink-0">
                    <Unlock className="w-2.5 h-2.5" />
                    LIVE
                  </span>
                )}
                {locked && !active && (
                  <Lock className="w-3 h-3 text-amber-500/60 md:hidden lg:inline shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── SYSTEM HEALTH RAIL ──────────────────────────────── */}
        <div className="px-3 py-3 border-t border-white/[0.04] md:hidden lg:block">
          <p className="engine-mono text-[7.5px] text-white/15 tracking-[0.2em] mb-2">SYSTEM HEALTH</p>
          <div className="space-y-1.5">
            {[
              { label: "API Gateway",   ok: true  },
              { label: "Oracle Feed",   ok: true  },
              { label: "Rail Sync",     ok: true  },
              { label: "Blockchain RPC",ok: true  },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="engine-mono text-[8px] text-white/25">{label}</span>
                <div className="flex items-center gap-1">
                  <span className={cn("w-1 h-1 rounded-full", ok ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
                  <span className={cn("engine-mono text-[7px]", ok ? "text-emerald-500/50" : "text-red-400")}>{ok ? "OK" : "ERR"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        {user && (
          <div className="border-t border-white/[0.05] p-2 space-y-0.5">
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] md:justify-center lg:justify-start transition-colors",
                isLight
                  ? "text-black/40 hover:text-black hover:bg-black/[0.04]"
                  : "text-white/35 hover:text-white hover:bg-white/[0.04]",
              )}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="md:hidden lg:inline">Settings</span>
            </Link>
            <button
              onClick={() => {
                if (!logoutConfirm) {
                  setLogoutConfirm(true);
                  setTimeout(() => setLogoutConfirm(false), 3000);
                } else {
                  logout();
                  setSidebarOpen(false);
                }
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] md:justify-center lg:justify-start transition-colors",
                logoutConfirm
                  ? "text-red-400 bg-red-950/30"
                  : isLight
                    ? "text-black/40 hover:text-red-500 hover:bg-red-50"
                    : "text-white/35 hover:text-red-400 hover:bg-red-950/20",
              )}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="md:hidden lg:inline">
                {logoutConfirm ? "Confirm Sign Out?" : "Sign Out"}
              </span>
            </button>
          </div>
        )}

        {/* ── SCAN LINE ───────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-r-none" aria-hidden>
          <div className="sidebar-scanline" />
        </div>
      </aside>
    </>
  );
}
