"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MarketTicker from "./MarketTicker";
import { SimulationBadge } from "@/components/sim/SimulationBadge";
import { GenesisGate } from "@/components/sim/GenesisGate";
import { useStore } from "@/store/useStore";
import { useSimSync } from "@/hooks/useSimSync";
import { useSimQuotes } from "@/hooks/useSimQuotes";
import { useSim } from "@/hooks/useSim";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  wide?: boolean;
  /** Rails render only after the user has claimed Genesis. */
  requireGenesis?: boolean;
}

function SimSync() {
  useSimSync();
  const { quotes } = useSimQuotes();
  const { actions, claimed } = useSim();
  useEffect(() => {
    if (!claimed) return;
    const mids: Record<string, number> = {};
    for (const q of Object.values(quotes)) mids[q.symbol] = q.mid;
    actions.mark(mids);
  }, [quotes, claimed, actions]);
  return null;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  wide,
  requireGenesis = false,
}: DashboardLayoutProps) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [ready, setReady] = useState(() =>
    typeof window !== "undefined" && useStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const finish = () => setReady(true);
    if (useStore.persist.hasHydrated()) finish();
    const unsub = useStore.persist.onFinishHydration(finish);
    void useStore.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (ready && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, ready, router]);

  return (
    <div className="min-h-screen sim-canvas">
      <Sidebar />
      <div>
        <SimulationBadge variant="banner" />
        <MarketTicker />
        <Header title={title} subtitle={subtitle} />
        <SimSync />
        <main className={cn("mx-auto px-4 md:px-6 py-6 md:py-8", wide ? "max-w-[1600px]" : "max-w-7xl")}>
          {requireGenesis ? <GenesisGate>{children}</GenesisGate> : children}
        </main>
      </div>
    </div>
  );
}
