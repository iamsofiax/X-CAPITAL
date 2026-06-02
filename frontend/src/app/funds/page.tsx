"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FundCard from "@/components/funds/FundCard";
import {
  MissionPanel,
  RailLock,
  RailInfrastructureHeader,
} from "@/components/x-engine";
import { ENGINE_COPY } from "@/lib/xEngine";
import { useXEngine } from "@/hooks/useXEngine";
import { useStore } from "@/store/useStore";
import { emitCapitalSignal } from "@/lib/capitalSignal";
import type { PendingTransaction } from "@/store/useStore";
import { NODE_LABELS } from "@/lib/nodeCopy";
import { formatCurrency } from "@/lib/utils";

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
  const {
    user,
    wallet,
    addPendingTransaction,
    addAdminAlert,
    pendingTransactions,
  } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"return" | "aum" | "min">("return");
  const [investModal, setInvestModal] = useState<(typeof DEMO_FUNDS)[0] | null>(
    null,
  );
  const [investAmount, setInvestAmount] = useState("");
  const [investMsg, setInvestMsg] = useState<string | null>(null);

  const { isArmed } = useXEngine();
  const cash = Number(wallet?.fiatBalance ?? user?.balance ?? 0);

  const filteredFunds = selectedCategory
    ? DEMO_FUNDS.filter((f) => f.category === selectedCategory)
    : DEMO_FUNDS;

  const sortedFunds = [...filteredFunds].sort((a, b) => {
    if (sortBy === "return") return b.targetReturn - a.targetReturn;
    if (sortBy === "aum") return b.currentAUM - a.currentAUM;
    return a.minInvestment - b.minInvestment;
  });

  const handleInvest = async (fund: (typeof DEMO_FUNDS)[0]) => {
    if (cash <= 0) {
      setInvestModal(null);
      return;
    }
    setInvestModal(fund);
    setInvestAmount(String(fund.minInvestment));
    setInvestMsg(null);
  };

  const submitFundInvest = async () => {
    if (!investModal || !user) return;
    const amount = parseFloat(investAmount);
    if (!amount || amount < investModal.minInvestment) {
      setInvestMsg(`Minimum ${formatCurrency(investModal.minInvestment)}`);
      return;
    }
    if (amount > cash) {
      setInvestMsg("Insufficient node balance");
      return;
    }

    const tx: PendingTransaction = {
      id: `ptx-fund-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      type: "FUND_INVEST",
      method: "fund",
      amount,
      currency: "USD",
      details: { fundId: investModal.id, fundName: investModal.name },
      status: "PENDING",
      createdAt: new Date().toISOString(),
      fundId: investModal.id,
      fundName: investModal.name,
    };

    await emitCapitalSignal({ tx, addPendingTransaction, addAdminAlert });
    setInvestMsg(NODE_LABELS.signalRouted + ". Admin clearance required.");
    setTimeout(() => setInvestModal(null), 2000);
  };

  return (
    <DashboardLayout title="Funds" subtitle="Capital allocation targets">
      <RailLock rail="funds">
      <div className="space-y-8">
        <RailInfrastructureHeader rail="funds" />
        {!isArmed && (
          <MissionPanel title={ENGINE_COPY.nodeCold} code="FUND-00">
            <p className="text-sm text-white/50 mb-4">{ENGINE_COPY.groundHold}</p>
            <a href="/wallet" className="text-sm font-bold text-emerald-400 hover:text-white">
              {ENGINE_COPY.uplink} →
            </a>
          </MissionPanel>
        )}

        <MissionPanel title="Allocation matrix" code="FUND-01">
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
        </MissionPanel>

        {/* Funds Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFunds.map((fund) => (
            <FundCard
              key={fund.id}
              fund={fund}
              onInvest={() => handleInvest(fund)}
            />
          ))}
        </div>

        {investModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <MissionPanel
              title={`Route capital — ${investModal.name}`}
              code="FUND-INV"
              className="max-w-md w-full"
            >
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                className="w-full bg-node-bg border-2 border-node-border rounded-lg px-4 py-3 text-white font-mono mb-4"
              />
              {investMsg && (
                <p className="text-sm text-node-signal mb-4">{investMsg}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setInvestModal(null)}
                  className="flex-1 py-2 rounded-lg border-2 border-node-border text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitFundInvest}
                  className="flex-1 py-2 rounded-lg bg-white text-black font-bold"
                >
                  Send signal
                </button>
              </div>
            </MissionPanel>
          </div>
        )}
      </div>
      </RailLock>
    </DashboardLayout>
  );
}
