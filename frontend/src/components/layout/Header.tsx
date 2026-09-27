"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Menu, Search } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useSim } from "@/hooks/useSim";
import { EpochTicker, RegimeChip } from "@/components/sim/EpochClock";
import { SimulationBadge } from "@/components/sim/SimulationBadge";
import { ActivityBell } from "@/components/desk/ActivityBell";
import { useLiveYield } from "@/hooks/useLiveYield";
import { fmtPct, fmtUsdc, signClass } from "@/lib/sim/format";
import { cn } from "@/lib/utils";
import SearchModal from "./SearchModal";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, setSidebarOpen } = useStore();
  const { metrics, epoch, claimed } = useSim();
  const { live, rate, fleetPerMin } = useLiveYield();
  const ticking = rate > 0 || fleetPerMin > 0;
  const [searchOpen, setSearchOpen] = useState(false);

  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setSearchOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#030405]/92 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate">{title}</h1>
              {subtitle && <p className="sim-label text-[9px] truncate hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <EpochTicker className="hidden lg:flex" />
            <RegimeChip epoch={epoch} className="hidden md:inline-flex" />
            {claimed && metrics && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                <span className="sim-label text-[8.5px]">NAV</span>
                <span className="sim-num text-[12px] text-white font-bold">{fmtUsdc(ticking ? live : metrics.nav, { decimals: ticking ? 4 : 2 })}</span>
                <span className={cn("sim-num text-[10px]", signClass(metrics.lifetimeReturn))}>
                  {fmtPct(metrics.lifetimeReturn)}
                </span>
              </div>
            )}
            <SimulationBadge className="hidden sm:inline-flex" />
            <ActivityBell />
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            {user && (
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <Image src={user.profilePicture} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-white text-[11px] font-bold">
                    {user.firstName?.[0] ?? ""}{user.lastName?.[0] ?? ""}
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
