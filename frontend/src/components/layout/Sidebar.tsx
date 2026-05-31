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
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/trading", icon: BarChart3, label: "Trading" },
  { href: "/portfolio", icon: Briefcase, label: "Portfolio" },
  { href: "/funds", icon: Globe, label: "Funds & SPVs" },
  { href: "/commerce", icon: ShoppingBag, label: "Commerce" },
  { href: "/oracle", icon: Cpu, label: "AI Oracle" },
  { href: "/engine", icon: Zap, label: "The Engine" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
];

const TIER_STYLES: Record<string, string> = {
  CORE: "bg-white/10 text-white",
  GOLD: "bg-amber-500/20 text-white/50 border border-white/[0.10]/30",
  BLACK: "bg-white/10 text-white border border-white/20",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, user, logout } = useStore();

  return (
    <>
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slide drawer on mobile, fixed rail on desktop */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-node-bg/98 backdrop-blur-xl border-r-2 border-node-border transition-transform duration-300 ease-in-out",
          // Mobile: 260px drawer, slides in/out
          "w-[260px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, icon rail (60px) expanding to full on lg
          "md:translate-x-0 md:w-[60px] lg:w-[200px]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b-2 border-node-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-black font-black text-xs">X</span>
            </div>
            <span className="font-black text-sm tracking-tight text-white md:hidden lg:inline">
              CAPITAL
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-xc-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all md:justify-center lg:justify-start border-2 border-transparent",
                  active
                    ? "font-bold text-white bg-node-panel border-node-border"
                    : "text-slate-300 hover:text-white hover:bg-node-panel/60 hover:border-node-border/40",
                )}
              >
                <Icon
                  className={cn("w-[18px] h-[18px] flex-shrink-0")}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className="md:hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-white/[0.08] p-2.5 space-y-0.5">
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-2 py-2 rounded-full hover:bg-white/[0.06] transition-colors md:justify-center lg:justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile"
                    width={32}
                    height={32}
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
              <div className="flex-1 min-w-0 md:hidden lg:block">
                <span className="text-xs font-bold text-white truncate">
                  {user.firstName} {user.lastName}
                </span>
                <div
                  className={cn(
                    "inline-block text-xs px-2 py-0.5 rounded-full font-mono font-bold mt-0.5",
                    TIER_STYLES[user.tier],
                  )}
                >
                  {user.tier}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-1 md:flex-col lg:flex-row">
              <Link
                href="/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-xc-muted hover:text-white hover:bg-white/[0.06] transition-all text-sm flex-1 md:justify-center lg:justify-start"
              >
                <Settings className="w-4 h-4" />
                <span className="md:hidden lg:inline">Settings</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-xc-muted hover:text-xc-red hover:bg-red-950/30 transition-all text-sm flex-1 md:justify-center lg:justify-start"
              >
                <LogOut className="w-4 h-4" />
                <span className="md:hidden lg:inline">Logout</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
