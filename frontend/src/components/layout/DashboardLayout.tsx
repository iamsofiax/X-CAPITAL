"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MarketTicker from "./MarketTicker";
import { XEngineShell } from "@/components/x-engine";
import { useStore } from "@/store/useStore";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  wide?: boolean;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  wide,
}: DashboardLayoutProps) {
  const { isAuthenticated } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, mounted, router]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="md:ml-[64px] lg:ml-[220px]">
        <MarketTicker />
        <Header title={title} subtitle={subtitle} />
        <main>
          <XEngineShell wide={wide}>{children}</XEngineShell>
        </main>
      </div>
    </div>
  );
}
