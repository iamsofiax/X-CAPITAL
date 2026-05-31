"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MarketTicker from "./MarketTicker";
import { NodeShell } from "@/components/node-engine";
import { useStore } from "@/store/useStore";
import { BarChart3, ArrowDownLeft, Wallet } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const { isAuthenticated } = useStore();
  const router = useRouter();
  const [showFab, setShowFab] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, mounted, router]);

  useEffect(() => {
    const onScroll = () => setShowFab(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-node-bg node-mesh-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-[60px] lg:ml-[200px]">
        <MarketTicker />
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-3 md:p-5 lg:p-6 pb-28 md:pb-6 overflow-x-hidden">
          <NodeShell>{children}</NodeShell>
        </main>
      </div>

      {/* Floating Action Bar — appears on scroll */}
      <div
        className={`fixed bottom-0 inset-x-0 md:left-[60px] lg:left-[200px] z-40 transition-all duration-300 ${
          showFab ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="bg-xc-dark/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2.5 flex items-center justify-center gap-3">
          <Link
            href="/trading"
            className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.10] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            Trade
          </Link>
          <Link
            href="/wallet"
            className="flex items-center gap-2 bg-white text-black text-xs font-bold px-5 py-2.5 rounded-full hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Deposit
          </Link>
          <Link
            href="/wallet"
            className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.10] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all"
          >
            <Wallet className="w-4 h-4" />
            Wallet
          </Link>
        </div>
      </div>
    </div>
  );
}
