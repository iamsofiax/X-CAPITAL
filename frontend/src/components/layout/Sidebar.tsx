"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useXEngine } from "@/hooks/useXEngine";
import { cn } from "@/lib/utils";
import type { EngineRail } from "@/lib/xEngine";

const navItems: {
  href: string;
  icon: typeof Home;
  label: string;
  code: string;
  rail: EngineRail;
}[] = [
  { href: "/dashboard", icon: Home, label: "Overview", code: "OPS", rail: "engine" },
  { href: "/trading", icon: BarChart3, label: "Execution", code: "EXEC", rail: "trading" },
  { href: "/portfolio", icon: Briefcase, label: "Holdings", code: "HOLD", rail: "portfolio" },
  { href: "/funds", icon: Globe, label: "Funds", code: "FUND", rail: "funds" },
  { href: "/commerce", icon: ShoppingBag, label: "Commerce", code: "COMM", rail: "commerce" },
  { href: "/oracle", icon: Cpu, label: "Oracle", code: "INF", rail: "oracle" },
  { href: "/engine", icon: Zap, label: "Engine", code: "CORE", rail: "engine" },
  { href: "/wallet", icon: Wallet, label: "Uplink", code: "UPL", rail: "wallet" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, user, logout } = useStore();
  const { canAccess, nodeId, phaseLabel } = useXEngine();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-black border-r border-white/[0.06]",
          "w-[260px] transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:w-[64px] lg:w-[220px]",
        )}
      >
        <div className="flex items-center justify-between px-3 py-5 border-b border-white/[0.06]">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
              <span className="text-black font-black text-xs">X</span>
            </div>
            <div className="md:hidden lg:block min-w-0">
              <span className="font-bold text-sm text-white block">CAPITAL</span>
              <span className="engine-mono text-[9px] text-white/30">{nodeId}</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-2 md:hidden lg:block">
          <span className="engine-mono text-[9px] text-emerald-500/70">{phaseLabel}</span>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, code, rail }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const locked = !canAccess(rail);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] transition-all",
                  "md:justify-center lg:justify-start",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/45 hover:text-white hover:bg-white/[0.04]",
                  locked && !active && "opacity-50",
                )}
              >
                <span className="engine-mono text-[9px] text-white/20 w-7 shrink-0 md:hidden lg:inline">
                  {code}
                </span>
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.6} />
                <span className="md:hidden lg:inline flex-1">{label}</span>
                {locked && (
                  <Lock className="w-3 h-3 text-amber-500/60 md:hidden lg:inline shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-white/[0.06] p-2 space-y-1">
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] text-sm md:justify-center lg:justify-start"
            >
              <Settings className="w-4 h-4" />
              <span className="md:hidden lg:inline">Settings</span>
            </Link>
            <button
              onClick={() => {
                logout();
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-950/20 text-sm md:justify-center lg:justify-start"
            >
              <LogOut className="w-4 h-4" />
              <span className="md:hidden lg:inline">Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
