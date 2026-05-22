"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FundCard from "@/components/funds/FundCard";
import { Satellite } from "lucide-react";

const DEMO_FUNDS = [
  {
    id: "1",
    name: "Growth Momentum Fund",
    description:
      "High-frequency rebalancing across AI, tech, and space infrastructure",
    category: "MOMENTUM",
    minInvestment: 50000,
    lockPeriodDays: 365,
    targetReturn: 42,
    currentAUM: 285000000,
    maxCapacity: 1000000000,
    isOpen: true,
    riskLevel: "HIGH",
  },
  {
    id: "2",
    name: "Starlink Compounding Fund",
    description:
      "Satellite infrastructure investment with monthly dividend reinvestment",
    category: "STARLINK",
    minInvestment: 50000,
    lockPeriodDays: 730,
    targetReturn: 56,
    currentAUM: 420000000,
    maxCapacity: 2000000000,
    isOpen: true,
    riskLevel: "MEDIUM-HIGH",
  },
  {
    id: "3",
    name: "Precision Capital Fund",
    description: "AI-optimized allocation across all five capital rails",
    category: "AI_OPTIMIZED",
    minInvestment: 50000,
    lockPeriodDays: 365,
    targetReturn: 48,
    currentAUM: 195000000,
    maxCapacity: 800000000,
    isOpen: true,
    riskLevel: "MEDIUM",
  },
  {
    id: "4",
    name: "Private Equity Consortium",
    description:
      "SPV co-investment access to pre-IPO companies and growth equity",
    category: "PRIVATE_EQUITY",
    minInvestment: 250000,
    lockPeriodDays: 1825,
    targetReturn: 35,
    currentAUM: 580000000,
    maxCapacity: 3000000000,
    isOpen: false,
    riskLevel: "MEDIUM",
  },
  {
    id: "5",
    name: "Infrastructure Yield Fund",
    description:
      "Energy grids, data centers, and orbital infrastructure networks",
    category: "INFRASTRUCTURE",
    minInvestment: 100000,
    lockPeriodDays: 1095,
    targetReturn: 32,
    currentAUM: 420000000,
    maxCapacity: 1500000000,
    isOpen: true,
    riskLevel: "LOW-MEDIUM",
  },
  {
    id: "6",
    name: "Commerce Capital Engine",
    description:
      "Real-world commerce linked to capital deployment and equity ownership",
    category: "COMMERCE",
    minInvestment: 50000,
    lockPeriodDays: 365,
    targetReturn: 38,
    currentAUM: 155000000,
    maxCapacity: 600000000,
    isOpen: true,
    riskLevel: "MEDIUM",
  },
];

export default function FundsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"return" | "aum" | "min">("return");

  const filteredFunds = selectedCategory
    ? DEMO_FUNDS.filter((f) => f.category === selectedCategory)
    : DEMO_FUNDS;

  const sortedFunds = [...filteredFunds].sort((a, b) => {
    if (sortBy === "return") return b.targetReturn - a.targetReturn;
    if (sortBy === "aum") return b.currentAUM - a.currentAUM;
    return a.minInvestment - b.minInvestment;
  });

  return (
    <DashboardLayout
      title="Investment Funds"
      subtitle="Diversified fund access across all capital rails"
    >
      <div className="space-y-6">
        {/* ═════════════════════════════════════════════════════════════════════════════════
            STARLINK GROWTH ACCELERATOR - Premium Investment Feature
            ═════════════════════════════════════════════════════════════════════════════════ */}
        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/40 via-emerald-900/20 to-slate-900/40 border border-emerald-500/50 p-6 md:p-8">
          <div className="absolute -top-40 -right-40 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute -bottom-32 -left-32 w-60 h-60 bg-emerald-600/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Satellite className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                    Premium Feature
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                  Starlink Growth Accelerator
                </h2>
                <p className="text-base text-emerald-50 max-w-2xl">
                  Invest in satellite infrastructure and the space economy. Our
                  three complementary strategies deliver 42-56% APY with monthly
                  compounding returns. Deploy capital into orbital networks with
                  institutional-grade risk management.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-5 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-xc-muted font-bold uppercase">
                    Momentum Plan
                  </p>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-1 rounded">
                    Popular
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-400 mb-1">
                  42% APY
                </p>
                <p className="text-xs text-xc-muted mb-3">
                  High-frequency rebalancing
                </p>
                <button className="w-full bg-gradient-to-r from-emerald-600/50 to-emerald-500/50 hover:from-emerald-600 hover:to-emerald-500 text-white text-xs font-black py-2 rounded-lg transition-all">
                  Invest Now
                </button>
              </div>
              <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-5 hover:bg-white/10 transition-colors ring-2 ring-emerald-500/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-xc-muted font-bold uppercase">
                    Compounding Plan
                  </p>
                  <span className="bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded">
                    Best Return
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-300 mb-1">
                  56% APY
                </p>
                <p className="text-xs text-xc-muted mb-3">
                  Monthly dividend reinvestment
                </p>
                <button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black py-2 rounded-lg transition-all shadow-lg hover:shadow-emerald-500/50">
                  Invest Now
                </button>
              </div>
              <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-5 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-xc-muted font-bold uppercase">
                    Precision Plan
                  </p>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-2 py-1 rounded">
                    Balanced
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-400 mb-1">
                  48% APY
                </p>
                <p className="text-xs text-xc-muted mb-3">
                  AI-optimized allocation
                </p>
                <button className="w-full bg-gradient-to-r from-emerald-600/50 to-emerald-500/50 hover:from-emerald-600 hover:to-emerald-500 text-white text-xs font-black py-2 rounded-lg transition-all">
                  Invest Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Sorting */}
        <div className="bg-xc-card border border-xc-border rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-white text-sm mb-3">
                Filter by category
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === null
                      ? "bg-xc-purple text-white"
                      : "bg-white/5 text-xc-muted hover:text-white"
                  }`}
                >
                  All Funds
                </button>
                {[
                  "MOMENTUM",
                  "STARLINK",
                  "AI_OPTIMIZED",
                  "PRIVATE_EQUITY",
                  "INFRASTRUCTURE",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? "bg-xc-purple text-white"
                        : "bg-white/5 text-xc-muted hover:text-white"
                    }`}
                  >
                    {cat.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-black text-white text-sm mb-3">Sort by</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "return" | "aum" | "min")}
                className="bg-xc-card border border-xc-border rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-xc-purple"
              >
                <option value="return">Highest Return</option>
                <option value="aum">Largest AUM</option>
                <option value="min">Lowest Min Investment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Funds Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFunds.map((fund) => (
            <FundCard
              key={fund.id}
              fund={fund}
              onInvest={() => {
                const isStarlink =
                  fund.name.toLowerCase().includes("starlink") ||
                  fund.name.toLowerCase().includes("xlink");
                router.push(isStarlink ? "/trading" : "/wallet");
              }}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
