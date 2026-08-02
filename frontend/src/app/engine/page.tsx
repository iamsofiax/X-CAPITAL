"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PhaseTrack, RailInfrastructureHeader } from "@/components/x-engine";
import CapitalStreamConsole from "@/components/system/CapitalStreamConsole";
import { ENGINE_COPY } from "@/lib/xEngine";
import { StructuralBlock } from "@/components/node-engine";
import { cn } from "@/lib/utils";
import {
  Car,
  Home,
  Gem,
  Briefcase,
  Smartphone,
  DollarSign,
  ArrowRight,
  Globe,
  Brain,
  Wifi,
  Shield,
  Star,
  ChevronRight,
  Lock,
  Users,
  CheckCircle2,
  Wallet,
  RefreshCw,
  Cpu,
  Activity,
  Server,
  Eye,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   X-CAPITAL ENGINE — Monochrome · Minimal · Clean
   ═══════════════════════════════════════════════════ */

const ASSET_CATEGORIES = [
  {
    id: "vehicles",
    label: "Vehicles",
    icon: Car,
    example: "Tesla, BMW, Mercedes, Porsche",
  },
  {
    id: "realestate",
    label: "Real Estate",
    icon: Home,
    example: "Residential, Commercial, Land",
  },
  {
    id: "luxury",
    label: "Luxury Goods",
    icon: Gem,
    example: "Watches, Jewelry, Art, Designer",
  },
  {
    id: "business",
    label: "Business Assets",
    icon: Briefcase,
    example: "Equipment, Inventory, IP",
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: Smartphone,
    example: "Phones, Laptops, Servers, GPUs",
  },
  {
    id: "financial",
    label: "Financial Assets",
    icon: DollarSign,
    example: "Stocks, Bonds, Crypto, Funds",
  },
] as const;

const ENGINE_NODES = [
  { label: "YOUR ASSET", icon: Wallet, desc: "Any asset you own" },
  { label: "Starlink Mesh", icon: Wifi, desc: "Global connectivity layer" },
  {
    label: "AI Inference Layer",
    icon: Brain,
    desc: "Compute + bandwidth routing",
  },
  {
    label: "Global Payments",
    icon: Globe,
    desc: "Revenue distribution network",
  },
];

const PROCESS_STEPS = [
  {
    num: "01",
    title: "The Appointment",
    body: "Our network of professional acquisition partners schedules a direct appointment. Whether it\u2019s a vehicle, property, luxury item, or electronics \u2014 you meet a licensed specialist for a white-glove valuation.",
  },
  {
    num: "02",
    title: "The Instant Settlement",
    body: "They inspect your asset and provide the full cash value on the spot. The capital goes directly into your Hand-Held Digital Wallet \u2014 instantly, securely, and professionally.",
  },
  {
    num: "03",
    title: "The Return or Upgrade",
    body: "After your first successful route, choose: get your original asset back, or let the system upgrade it. Vehicle owners often receive a Tesla. Property owners access premium portfolios. Every class elevates.",
  },
];

const TIERS = [
  {
    name: "Node",
    price: "$500",
    yield: "$2,400/mo",
    features: [
      "Starlink bandwidth routing",
      "Basic AI compute allocation",
      "Monthly yield distribution",
      "Hand-Held Digital Wallet",
      "Community access",
    ],
    highlight: false,
  },
  {
    name: "Relay",
    price: "$2,500",
    yield: "$14,000/mo",
    features: [
      "Priority bandwidth reserves",
      "Full AI inference layer",
      "Weekly yield distribution",
      "Asset bridge access",
      "Elevation sequence eligible",
      "Premium support",
    ],
    highlight: true,
  },
  {
    name: "Vanguard",
    price: "$10,000",
    yield: "$62,000/mo",
    features: [
      "Dedicated compute cluster",
      "Maximum bandwidth allocation",
      "Daily yield distribution",
      "White-glove acquisition",
      "Priority elevation path",
      "Direct partner network",
      "Founder-tier governance",
    ],
    highlight: false,
  },
];

const REVIEWS = [
  {
    name: "M. Richardson",
    role: "Vehicle Integration",
    text: "Turned my Range Rover into a revenue node. Got a Tesla Model S back on the first cycle.",
    rating: 5,
  },
  {
    name: "S. Kimura",
    role: "Real Estate",
    text: "Property was sitting idle. Now it powers compute and I earn monthly. The process was seamless.",
    rating: 5,
  },
  {
    name: "A. Petrov",
    role: "Electronics",
    text: "My GPU servers were depreciating. Integrated them and the yield covered my original cost in 8 weeks.",
    rating: 5,
  },
  {
    name: "L. Chen",
    role: "Luxury Goods",
    text: "White-glove from start to finish. Honest valuation, instant settlement, and my first distribution was on time.",
    rating: 5,
  },
];

const YIELD_FEED_SYMBOLS = [
  "TSLA-NODE",
  "RE-NYC",
  "GPU-CLUSTER",
  "STRLINK-12",
  "AI-INFER",
  "LUX-VAULT",
  "BIZ-ASSET",
  "FIN-ROUTE",
  "ELEC-MESH",
  "RE-LONDON",
  "TSLA-RELAY",
  "GPU-FARM",
];

export default function EnginePage() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [engineSyncing, setEngineSyncing] = useState(false);
  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [yieldFeed, setYieldFeed] = useState<
    Array<{
      id: string;
      sym: string;
      yield: string;
      time: string;
      status: string;
    }>
  >([]);

  // Live yield feed
  useEffect(() => {
    const push = () => {
      const sym =
        YIELD_FEED_SYMBOLS[
          Math.floor(Math.random() * YIELD_FEED_SYMBOLS.length)
        ];
      const y = (Math.random() * 4800 + 200).toFixed(2);
      setYieldFeed((prev) => [
        {
          id: Date.now().toString() + Math.random(),
          sym,
          yield: `$${y}`,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          status: Math.random() > 0.1 ? "settled" : "routing",
        },
        ...prev.slice(0, 19),
      ]);
    };
    push();
    const interval = setInterval(push, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAssetSelect = useCallback((id: string) => {
    setSelectedAsset(id);
    setEngineSyncing(true);
  }, []);

  useEffect(() => {
    if (!engineSyncing) return;
    const timer = setTimeout(() => setEngineSyncing(false), 2400);
    return () => clearTimeout(timer);
  }, [engineSyncing, selectedAsset]);

  return (
    <DashboardLayout
      title="Core Engine"
      subtitle="Asset integration · bandwidth mesh · structural yield"
    >
      <div className="space-y-0">
        <RailInfrastructureHeader rail="engine" className="mb-10 md:mb-14" />
        {/* ── UPLINK: BOOT SEQUENCE + LIVE CAPITAL FLOW ─────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <CapitalStreamConsole className="w-full mb-8" />
        </section>

        {/* ── HERO: AI COMPUTE + BANDWIDTH ──────────────────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <div className="max-w-3xl">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-4">
              X-CAPITAL INFRASTRUCTURE
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
              AI Compute Layer.
              <br />
              Bandwidth Reserves.
              <br />
              <span className="text-white/40">Structural Yield.</span>
            </h1>
            <p className="text-sm md:text-base text-white/40 leading-relaxed max-w-xl mb-6 md:mb-10">
              Every node in the X-CAPITAL network routes real bandwidth through
              Starlink infrastructure, processes AI inference workloads, and
              distributes revenue globally. The yield isn&apos;t speculative
              &mdash; it&apos;s structural.
            </p>
          </div>

          {/* Live metrics strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {[
              { label: "Active Nodes", value: "14,892", icon: Server },
              { label: "Compute Throughput", value: "2.4 PFlops", icon: Cpu },
              {
                label: "Bandwidth Routed",
                value: "847 TB/day",
                icon: Activity,
              },
              {
                label: "Global Yield Pool",
                value: "$1M/month",
                icon: DollarSign,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-[#080812] p-4 md:p-6">
                <Icon className="w-4 h-4 text-white/20 mb-3" />
                <div className="text-lg md:text-xl font-black font-mono text-white">
                  {value}
                </div>
                <div className="text-xs text-white/30 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="mb-10 md:mb-16">
          <PhaseTrack />
        </div>

        {/* ── WHY YIELD IS STRUCTURALLY GUARANTEED ──────────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-4">
            YIELD ARCHITECTURE
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
            Why the yield is structurally guaranteed.
          </h2>
          <p className="text-sm text-white/35 max-w-2xl mb-6 md:mb-10">
            Revenue flows from three convergent infrastructure layers. Each
            generates independently. Together, they compound.
          </p>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {[
              {
                title: "Starlink Bandwidth",
                desc: "Every node routes real data through SpaceX\u2019s satellite constellation. Bandwidth = revenue. More nodes = more throughput = higher distribution per participant.",
                icon: Wifi,
                metric: "$340K/mo",
              },
              {
                title: "AI Inference Compute",
                desc: "Pooled compute resources process AI workloads for enterprise clients. GPU cycles are sold at market rate. Demand is permanent and accelerating.",
                icon: Brain,
                metric: "$480K/mo",
              },
              {
                title: "Global Payment Rails",
                desc: "Cross-border settlement fees from the X payment network. Every transaction processed generates a micro-fee distributed across active nodes.",
                icon: Globe,
                metric: "$180K/mo",
              },
            ].map(({ title, desc, icon: Icon, metric }) => (
              <div key={title} className="bg-[#080812] p-5 md:p-8">
                <Icon className="w-5 h-5 text-white/20 mb-3 md:mb-5" />
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-[13px] text-white/35 leading-relaxed mb-4 md:mb-6">
                  {desc}
                </p>
                <div className="pt-3 md:pt-4 border-t border-white/[0.08]">
                  <span className="text-xs text-white/25 uppercase tracking-wider">
                    Pool contribution
                  </span>
                  <div className="text-2xl font-black font-mono text-white mt-1">
                    {metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOMO BANNER ───────────────────────────────────────────── */}
        <section className="border border-white/[0.08] rounded-2xl p-5 md:p-8 mb-10 md:mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                  Limited Capacity
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-1">
                847 nodes remaining this quarter.
              </h3>
              <p className="text-xs md:text-sm text-white/35">
                14,892 active. Network capacity closes at 15,739. Structural
                constraint &mdash; not marketing.
              </p>
            </div>
            <button className="px-6 md:px-8 py-3 md:py-3.5 bg-white text-black font-bold text-sm rounded-full hover:bg-white/90 transition-all flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center">
              Secure Your Node <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ── LIVE GLOBAL YIELD FEED ────────────────────────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-2">
                LIVE FEED
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Global Yield Feed
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{" "}
              STREAMING
            </div>
          </div>

          <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 md:gap-4 px-3 md:px-6 py-3 border-b border-white/[0.08] text-xs font-mono uppercase tracking-wider text-white/25">
              <span>Node</span>
              <span className="text-right">Yield</span>
              <span className="text-right">Time</span>
              <span className="text-right">Status</span>
            </div>
            {/* Feed */}
            <div className="h-[280px] md:h-[360px] overflow-y-auto custom-scrollbar">
              {yieldFeed.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    "grid grid-cols-[1fr_auto_auto_auto] gap-2 md:gap-4 px-3 md:px-6 py-3 border-b border-white/[0.02] text-[13px] transition-colors",
                    i === 0 && "bg-white/[0.02]",
                  )}
                >
                  <span className="font-mono font-bold text-white">
                    {item.sym}
                  </span>
                  <span className="font-mono text-white/70 text-right">
                    {item.yield}
                  </span>
                  <span className="font-mono text-white/25 text-right">
                    {item.time}
                  </span>
                  <span
                    className={cn(
                      "text-right font-mono text-xs",
                      item.status === "settled"
                        ? "text-white/50"
                        : "text-white/25",
                    )}
                  >
                    {item.status === "settled"
                      ? "\u2713 Settled"
                      : "\u25CB Routing"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            STARLINK INFRASTRUCTURE INVESTMENT
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 via-slate-900/20 to-slate-900/30 border border-emerald-500/40 p-8 md:p-10 mb-10 md:mb-16">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Wifi className="w-7 h-7 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                    Starlink Global Network
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                  Deploy Satellite Infrastructure
                </h3>
                <p className="text-base text-emerald-50 max-w-2xl mb-6 leading-relaxed">
                  Integrated Starlink bandwidth routing converts your X-CAPITAL
                  node into a satellite edge compute terminal. Real throughput.
                  Real revenue. Real yield from global data transmission and AI
                  inference processing on SpaceX infrastructure.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-4">
                    <p className="text-xs text-xc-muted font-bold mb-1">
                      Monthly Yield
                    </p>
                    <p className="text-2xl font-black text-emerald-400">
                      $2.4K+
                    </p>
                  </div>
                  <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-4">
                    <p className="text-xs text-xc-muted font-bold mb-1">
                      Network Nodes
                    </p>
                    <p className="text-2xl font-black text-emerald-400">
                      14.8K
                    </p>
                  </div>
                  <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-4">
                    <p className="text-xs text-xc-muted font-bold mb-1">
                      Active Countries
                    </p>
                    <p className="text-2xl font-black text-emerald-400">105+</p>
                  </div>
                  <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-4">
                    <p className="text-xs text-xc-muted font-bold mb-1">
                      Throughput
                    </p>
                    <p className="text-2xl font-black text-emerald-400">
                      847 TB
                    </p>
                  </div>
                </div>
              </div>
              <button className="w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 h-fit">
                Deploy Now
              </button>
            </div>
          </div>
        </section>

        {/* ── ASSET INTEGRATION ─────────────────────────────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-4">
            ASSET INTEGRATION
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
            {ENGINE_COPY.assetIntegrationTitle}
          </h2>
          <p className="text-sm text-white/45 max-w-2xl mb-6 md:mb-10 leading-relaxed">
            {ENGINE_COPY.assetIntegrationBody}
          </p>

          <div className="grid md:grid-cols-[280px_1fr] gap-6 md:gap-10">
            {/* Asset categories — vertical rectangle table */}
            <div className="border border-white/[0.08] rounded-2xl overflow-hidden">
              {ASSET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleAssetSelect(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-5 border-b border-white/[0.08] last:border-b-0 text-left transition-colors duration-100",
                    selectedAsset === cat.id
                      ? "bg-white/[0.06]"
                      : "hover:bg-white/[0.02]",
                  )}
                >
                  <cat.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      selectedAsset === cat.id ? "text-white" : "text-white/20",
                    )}
                  />
                  <div>
                    <div
                      className={cn(
                        "text-sm font-bold",
                        selectedAsset === cat.id
                          ? "text-white"
                          : "text-white/60",
                      )}
                    >
                      {cat.label}
                    </div>
                    <div className="text-xs text-white/20">{cat.example}</div>
                  </div>
                  {selectedAsset === cat.id && (
                    <ChevronRight className="w-4 h-4 text-white/40 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            {/* Global Engine — vertical rectangle */}
            <div className="border border-white/[0.08] rounded-2xl p-5 md:p-8">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/25 mb-8">
                GLOBAL ROUTING ENGINE
              </p>

              <div className="flex flex-col items-center gap-0">
                {ENGINE_NODES.map((node, i) => (
                  <div key={node.label} className="w-full">
                    {/* Node */}
                    <div
                      className={cn(
                        "flex items-center gap-4 px-6 py-5 rounded-xl border transition-all duration-500",
                        engineSyncing && selectedAsset
                          ? "border-white/20 bg-white/[0.04]"
                          : "border-white/[0.08] bg-transparent",
                        engineSyncing &&
                          i === 0 &&
                          selectedAsset &&
                          "border-white/30 bg-white/[0.06]",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500",
                          engineSyncing && selectedAsset
                            ? "border-white/20 bg-white/[0.06]"
                            : "border-white/[0.08]",
                        )}
                      >
                        <node.icon
                          className={cn(
                            "w-4 h-4 transition-all duration-500",
                            engineSyncing && selectedAsset
                              ? "text-white"
                              : "text-white/25",
                          )}
                        />
                      </div>
                      <div>
                        <div
                          className={cn(
                            "text-sm font-bold transition-colors duration-500",
                            engineSyncing && selectedAsset
                              ? "text-white"
                              : "text-white/50",
                          )}
                        >
                          {i === 0 && selectedAsset
                            ? (ASSET_CATEGORIES.find(
                                (c) => c.id === selectedAsset,
                              )?.label?.toUpperCase() ?? node.label)
                            : node.label}
                        </div>
                        <div className="text-xs text-white/20">{node.desc}</div>
                      </div>
                      {engineSyncing && (
                        <RefreshCw className="w-3.5 h-3.5 text-white/30 ml-auto animate-spin" />
                      )}
                    </div>

                    {/* Connector */}
                    {i < ENGINE_NODES.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div
                          className={cn(
                            "w-px h-8 transition-all duration-500",
                            engineSyncing && selectedAsset
                              ? "bg-white/30"
                              : "bg-white/[0.06]",
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sync status */}
              {selectedAsset && (
                <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center gap-4">
                  {engineSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />
                      <span className="text-sm text-white/40 font-mono">
                        Syncing engine to{" "}
                        {
                          ASSET_CATEGORIES.find((c) => c.id === selectedAsset)
                            ?.label
                        }
                        ...
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/40 font-mono">
                        Engine linked.{" "}
                        {
                          ASSET_CATEGORIES.find((c) => c.id === selectedAsset)
                            ?.label
                        }{" "}
                        routed to yield pool.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── THE PROCESS ───────────────────────────────────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-4">
            THE PROCESS
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8 md:mb-12">
            How any asset becomes your engine.
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="bg-[#080812] p-5 md:p-8">
                <span className="text-xs font-mono text-white/20 mb-4 block">
                  {step.num}
                </span>
                <h3 className="text-lg font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-[13px] text-white/35 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ARCHITECTURE (01-04) ──────────────────────────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-4">
            SYSTEM DESIGN
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8 md:mb-12">
            Structural architecture.
          </h2>

          <StructuralBlock />
        </section>

        {/* ── TRUST RATINGS ─────────────────────────────────────────── */}
        <section className="border-b border-white/[0.08] pb-10 md:pb-16 mb-10 md:mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-2">
                VERIFIED REVIEWS
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Trusted by integrators worldwide.
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white text-white"
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-white ml-1">4.9/5</span>
              <span className="text-xs text-white/30 ml-1">verified</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {REVIEWS.map((review) => (
              <div key={review.name} className="bg-[#080812] p-4 md:p-6">
                <div className="flex mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-white/60 text-white/60"
                    />
                  ))}
                </div>
                <p className="text-[13px] text-white/50 leading-relaxed mb-5">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="pt-4 border-t border-white/[0.08]">
                  <div className="text-sm font-bold text-white">
                    {review.name}
                  </div>
                  <div className="text-xs text-white/25">
                    {review.role} &middot;{" "}
                    <span className="text-white/40">4.9/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ACTIVATE YOUR REVENUE NODE — TIERS ────────────────────── */}
        <section className="pb-16">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/30 mb-4">
              ACTIVATE
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">
              Activate your revenue node.
            </h2>
            <p className="text-sm text-white/35 max-w-lg mx-auto">
              Three tiers. One engine. Choose your deployment level.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                className={cn(
                  "bg-[#080812] p-5 md:p-8 flex flex-col",
                  tier.highlight && "bg-white/[0.03]",
                )}
              >
                {tier.highlight && (
                  <span className="text-xs font-mono uppercase tracking-[0.15em] text-white/50 mb-4 border border-white/[0.1] rounded-full px-3 py-1 w-fit">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-black text-white mb-1">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black font-mono text-white">
                    {tier.price}
                  </span>
                  <span className="text-xs text-white/25">one-time</span>
                </div>
                <div className="text-sm text-white/40 mb-6">
                  Est.{" "}
                  <span className="text-white font-bold">{tier.yield}</span>{" "}
                  yield
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2.5 text-[13px] text-white/40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTier(i)}
                  className={cn(
                    "w-full py-3.5 rounded-full text-sm font-bold transition-all",
                    tier.highlight
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.1]",
                    activeTier === i && "ring-2 ring-white/30",
                  )}
                >
                  {activeTier === i ? "Activating..." : `Deploy ${tier.name}`}
                </button>
              </div>
            ))}
          </div>

          {/* Bottom trust bar */}
          <div className="flex items-center justify-center gap-4 md:gap-8 mt-8 md:mt-10 text-xs text-white/20 flex-wrap">
            {[
              { icon: Shield, text: "SEC Compliant" },
              { icon: Lock, text: "Bank-grade Security" },
              { icon: Users, text: "14,892 Active Nodes" },
              { icon: Eye, text: "Full Transparency" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
