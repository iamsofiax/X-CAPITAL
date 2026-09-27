"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Lock, LogOut, Settings, ShieldCheck, X, Users } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSim } from "@/hooks/useSim";
import { XCapitalLogo } from "@/components/brand/XCapitalLogo";
import { TierBadge } from "@/components/sim/TierBadge";
import { COMMAND_CENTER, RAILS } from "@/lib/rails";
import { isAdminUser } from "@/lib/apiUser";
import { fmtUsdc } from "@/lib/sim/format";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, user, logout } = useStore();
  const { claimed, account, metrics } = useSim();
  const close = () => setSidebarOpen(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const items = [
    { href: COMMAND_CENTER.href, label: COMMAND_CENTER.label, icon: COMMAND_CENTER.icon, accent: "#e5e7eb", gated: false },
    ...RAILS.map((r) => ({ href: r.href, label: r.label, icon: r.icon, accent: r.accent, gated: false })),
  ];

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={close} />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "bg-[#030405]/95 backdrop-blur-md border-r border-white/[0.05]",
          "w-[min(88vw,340px)] transition-transform duration-150",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 pt-6 pb-5 border-b border-white/[0.05]">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={close}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/10 border border-white/10 flex items-center justify-center shrink-0">
              <XCapitalLogo size={20} />
            </div>
            <div className="min-w-0">
              <span className="font-black text-sm text-white tracking-[0.2em] block leading-none">X-CAPITAL</span>
              <span className="sim-label text-[8px] text-emerald-300/70">Operator desk</span>
            </div>
          </Link>
          <button onClick={close} className="w-11 h-11 rounded-xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center" aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        </div>

        {account && claimed && metrics && (
          <div className="px-3 py-3 border-b border-white/[0.04]">
            <p className="sim-label text-[8.5px] mb-1">Book NAV</p>
            <p className="sim-num text-lg font-bold text-white leading-none">{fmtUsdc(metrics.nav)}</p>
            <p className="sim-num text-[10px] text-white/40 mt-1">USD · {fmtUsdc(metrics.sxc, { decimals: 2 })} XC</p>
            <TierBadge xp={account.xp} className="mt-2" />
          </div>
        )}

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {items.map(({ href, label, icon: Icon, accent, gated }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const locked = gated && !claimed;
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                title={locked ? "Open the book in Treasury. Cash stays at zero until a deposit is confirmed." : label}
                className={cn(
                  "group relative flex items-center gap-4 px-3 py-3.5 rounded-xl transition-colors duration-75",
                  "justify-start",
                  active ? "bg-white/[0.07] text-white" : "text-white/50 hover:text-white hover:bg-white/[0.04]",
                )}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full" style={{ background: accent }} />
                )}
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]"
                  style={active ? { color: accent, borderColor: `${accent}55` } : undefined}
                >
                  <Icon className="w-4 h-4" strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className={cn("flex-1 text-[13.5px] tracking-tight", active ? "font-bold" : "font-semibold")}>
                  {label}
                </span>
                {locked && <Lock className="w-3 h-3 text-amber-400/60 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-[10px] text-white/35">
            <ShieldCheck className={cn("w-3.5 h-3.5", metrics?.reserves.ok === false ? "text-red-400" : "text-emerald-400/70")} />
            <span className="sim-num">
              {metrics ? (metrics.reserves.ok ? "Node reserves verified" : "Reserve mismatch") : "Fund node to open the book"}
            </span>
          </div>
        </div>

        {user && (
          <div className="border-t border-white/[0.05] p-3 space-y-1">
            {isAdminUser(user) && (
              <Link href="/admin" onClick={close} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] text-[15px]">
                <Users className="w-4 h-4 shrink-0" />
                <span>Ground station</span>
              </Link>
            )}
            <Link href="/settings" onClick={close} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] text-[15px]">
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </Link>
            <Link href="/settings/kyc" onClick={close} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] text-[15px]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Identity</span>
            </Link>
            <Link href="/settings/links" onClick={close} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] text-[15px]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Link a plan</span>
            </Link>
            <button
              onClick={() => { logout(); close(); router.push("/auth/login"); }}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-white/40 hover:text-red-300 hover:bg-red-950/20 text-[15px]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
