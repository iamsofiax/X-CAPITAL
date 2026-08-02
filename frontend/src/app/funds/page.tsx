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
import { useStableBalance } from "@/hooks/useStableBalance";
import SubmitButton from "@/components/system/SubmitButton";
import TransactionReceipt from "@/components/system/TransactionReceipt";
import { emitCapitalSignal } from "@/lib/capitalSignal";
import type { PendingTransaction } from "@/store/useStore";
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
    addPendingTransaction,
    addAdminAlert,
  } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"return" | "aum" | "min">("return");
  const [investModal, setInvestModal] = useState<(typeof DEMO_FUNDS)[0] | null>(
    null,
  );
  const [investAmount, setInvestAmount] = useState("");
  const [investMsg, setInvestMsg] = useState<string | null>(null);
  const [investSubmitting, setInvestSubmitting] = useState(false);
  const [investReceipt, setInvestReceipt] = useState<{
    reference: string;
    createdAt: string;
  } | null>(null);
  const [routePhase, setRoutePhase] = useState(0);

  const { isArmed } = useXEngine();
  const cash = useStableBalance();

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
    if (investSubmitting || !investModal || !user) return;
    const amount = parseFloat(investAmount);
    if (!amount || amount < investModal.minInvestment) {
      setInvestMsg(`Minimum ${formatCurrency(investModal.minInvestment)}`);
      return;
    }
    if (amount > cash) {
      setInvestMsg("Insufficient node balance");
      return;
    }
    if (investReceipt) return; // idempotency — already routed

    setInvestSubmitting(true);
    setRoutePhase(1);

    // Visible capital route — user sees exactly where funds are going
    const routeTimers = [
      setTimeout(() => setRoutePhase(2), 450),
      setTimeout(() => setRoutePhase(3), 950),
      setTimeout(() => setRoutePhase(4), 1450),
    ];

    const reference = `FND-${Date.now().toString().slice(-8)}`;
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
    routeTimers.forEach(clearTimeout);

    setInvestReceipt({ reference, createdAt: new Date().toISOString() });
    setRoutePhase(5);
    setInvestMsg(null);
    setInvestSubmitting(false);
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <MissionPanel
              title={`Route capital — ${investModal.name}`}
              code="FUND-INV"
              className="max-w-md w-full"
            >
              {/* ── STEP 1 · AMOUNT ── */}
              {routePhase < 1 && !investReceipt && (
                <div className="space-y-4">
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    className="w-full bg-node-bg border-2 border-node-border rounded-lg px-4 py-3 text-white font-mono"
                  />
                  {investMsg && (
                    <p className="text-sm text-node-signal">{investMsg}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setInvestModal(null)}
                      className="flex-1 py-2 rounded-lg border-2 border-node-border text-white"
                    >
                      Cancel
                    </button>
                    <SubmitButton
                      fullWidth
                      loading={investSubmitting}
                      loadingLabel="Routing Capital…"
                      onClick={submitFundInvest}
                    >
                      Send Signal
                    </SubmitButton>
                  </div>
                </div>
              )}

              {/* ── STEP 2 · REAL-TIME ROUTING TRACE ── */}
              {routePhase >= 1 && routePhase < 5 && !investReceipt && (
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400/80 uppercase">
                      Routing {formatCurrency(parseFloat(investAmount || "0"))} to{" "}
                      {investModal.name}
                    </span>
                  </div>
                  {[
                    "Capital detached from wallet — escrow 1:1",
                    "Signal verified — admin clearance requested",
                    "Fund rail armed — allocation matrix synced",
                    "Position routed — compounding authorized",
                  ].map((step, i) => (
                    <div
                      key={step}
                      className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                        routePhase > i + 1 ? "opacity-100" : "opacity-35"
                      } ${routePhase > i + 1 ? "text-white/70" : "text-white/30"}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
                          routePhase > i + 1
                            ? "border-emerald-500 bg-emerald-500 text-black"
                            : "border-white/20"
                        }`}
                      >
                        {routePhase > i + 1 ? "✓" : i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP 3 · PRINTABLE RECEIPT ── */}
              {investReceipt && investModal && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">✓</span>
                    </div>
                    <h3 className="text-white font-bold">Signal Routed</h3>
                    <p className="text-xs text-white/40 mt-1">
                      {investModal.name} · held for admin clearance
                    </p>
                  </div>
                  <TransactionReceipt
                    title="Fund Allocation Routed"
                    subtitle="Capital Deployment"
                    reference={investReceipt.reference}
                    createdAt={investReceipt.createdAt}
                    amountLabel="Allocated"
                    amountValue={formatCurrency(parseFloat(investAmount || "0"))}
                    status="PENDING"
                    items={[
                      { label: "Fund", value: investModal.name },
                      {
                        label: "Category",
                        value: investModal.category.replace("_", " "),
                      },
                      {
                        label: "Target Return",
                        value: `${investModal.targetReturn}% (${investModal.riskLevel})`,
                        mono: true,
                      },
                      {
                        label: "Lock Period",
                        value: `${investModal.lockPeriodDays} days`,
                      },
                      { label: "Status", value: "PENDING ADMIN APPROVAL" },
                    ]}
                  />
                  <div className="flex gap-3">
                    <SubmitButton
                      fullWidth
                      variant="secondary"
                      onClick={() => {
                        setInvestModal(null);
                        setInvestReceipt(null);
                        setRoutePhase(0);
                      }}
                    >
                      Done
                    </SubmitButton>
                  </div>
                </div>
              )}
            </MissionPanel>
          </div>
        )}
      </div>
      </RailLock>
    </DashboardLayout>
  );
}
