"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Landmark,
  Activity,
  Cpu,
  Radio,
  Server,
  Globe,
  Scale,
  Fingerprint,
  Layers,
  BookOpen,
} from "lucide-react";
import ApiHealthBadge from "@/components/system/ApiHealthBadge";
import CapitalNetworkTwin from "@/components/network-twin/CapitalNetworkTwin";
import HeroLaunchVideo from "@/components/brand/HeroLaunchVideo";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";
import { useApiHealth } from "@/hooks/useApiHealth";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { formatCurrency } from "@/lib/utils";


/* eslint-disable react/no-unescaped-entities */

const RAILS = [
  {
    id: "equities",
    label: "Public Markets",
    tag: "RAIL 01",
    accent: "#ffffff",
    desc: "Agency execution across primary venues. Routed as a desk, not a retail queue. Settlement reported to the node ledger.",
  },
  {
    id: "private",
    label: "Private Equity",
    tag: "RAIL 02",
    accent: "#f59e0b",
    desc: "Closed-end and SPV participation. Allocation is by mandate, not marketing. Positions post to the same isolated ledger.",
  },
  {
    id: "chain",
    label: "Tokenized Assets",
    tag: "RAIL 03",
    accent: "#a78bfa",
    desc: "Whitelisted wallets. On-chain settlement instructions. Beneficial ownership recorded against the authenticated node.",
  },
  {
    id: "commerce",
    label: "Commerce-Capital",
    tag: "RAIL 04",
    accent: "#34d399",
    desc: "Spend that posts as capital. Commerce events settle into the same node — purchase and portfolio share one book.",
  },
  {
    id: "oracle",
    label: "AI Oracle",
    tag: "RAIL 05",
    accent: "#fb7185",
    desc: "Forecasting, scenario, and sentiment as decision support. Sizing is advisory to the desk, never a substitute for mandate.",
  },
  {
    id: "infra",
    label: "Infrastructure Fund",
    tag: "RAIL 06",
    accent: "#818cf8",
    desc: "Hard-asset sleeves: compute, energy, logistics. Collateral and cash flows book to the node, not a pooled wrapper.",
  },
  {
    id: "orbital",
    label: "Orbital Economy",
    tag: "RAIL 07",
    accent: "#22d3ee",
    desc: "Orbital capacity as an infrastructure sleeve. Yield, when booked, is attributed to the node that holds the position.",
  },
] as const;

const TICKER_SYMS = ["BTC", "ETH", "TSLA", "NVDA", "SPY", "AAPL", "GLD"];

const TIERS = [
  {
    name: "QUANTUM",
    price: "$9,999/mo",
    desc: "Desk access for a single node. Full rail map, Accrual Core, isolated ledger.",
    features: [
      "50,000+ listed instruments",
      "Oracle as decision support",
      "Tokenized-asset instructions",
      "Risk and NAV on the node",
      "24/7 ground-station desk",
    ],
  },
  {
    name: "SOVEREIGN",
    price: "$49,999/mo",
    desc: "Multi-entity / family-office mandate. Private sleeves and opportunity funds.",
    features: [
      "Everything in QUANTUM",
      "Private and SPV participation",
      "Opportunity fund sleeves",
      "Infrastructure allocations",
      "Named relationship coverage",
    ],
    featured: true,
  },
  {
    name: "VERTEX",
    price: "By Invitation",
    desc: "No published ceiling. Qualified capital, typically $50M+ AUM.",
    features: [
      "Everything in SOVEREIGN",
      "Founder co-investment windows",
      "Board-level access",
      "Sovereign and endowment setup",
      "Execution billed at cost",
    ],
  },
];

const NETWORK_STAT_ICONS = [
  { label: "GATEWAY", icon: Activity },
  { label: "LATENCY", icon: Radio },
  { label: "UPTIME", icon: Server },
  { label: "RAILS ARMED", icon: Cpu },
];

const YIELD_FLOW = [
  {
    step: "01",
    title: "Asset is booked as a node",
    desc: "Holdings, cash, and sleeves post to a unique node. The book is the user — never a shared pool.",
  },
  {
    step: "02",
    title: "Desk routes across seven rails",
    desc: "Public markets, private equity, tokenized assets, commerce, oracle, infrastructure, orbital — one clearing map.",
  },
  {
    step: "03",
    title: "Yield settles to the same book",
    desc: "Accrual Core writes on the server. Display interpolates. History never leaves the authenticated node.",
  },
];

const MANDATE = [
  {
    code: "01",
    icon: Fingerprint,
    title: "Segregated ledgers",
    desc: "One wallet, one yield config, one transaction history per authenticated node. Rows are never shared across users.",
  },
  {
    code: "02",
    icon: Scale,
    title: "Server is the clock",
    desc: "Accrual Core credits yield on the API. The browser interpolates the panel. Interpolation is never written as history.",
  },
  {
    code: "03",
    icon: Layers,
    title: "Seven-rail settlement",
    desc: "A single desk map: listed markets, private sleeves, tokenized instructions, commerce, oracle, infrastructure, orbital.",
  },
  {
    code: "04",
    icon: BookOpen,
    title: "Durable audit trail",
    desc: "Credits, debits, and yield events persist on Neon Postgres keyed to the node. Sessions and devices do not remix books.",
  },
] as const;

export default function LandingPage() {
  const [activeRail, setActiveRail] = useState<string | null>(null);
  const { health, online, loading: healthLoading } = useApiHealth();
  const { prices } = useMarketPrices({ refreshInterval: 120_000 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let t = 0;

    const resize = () => {
      // Guard against zero-size init (canvas is hidden during splash boot) —
      // calling ctx.scale on a 0×0 canvas throws "Canvas could not create
      // basic draw target" and blanks the whole page.
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const RAIL_COLORS = [
      "rgba(255,255,255,", "rgba(245,158,11,", "rgba(167,139,250,",
      "rgba(52,211,153,", "rgba(251,113,133,", "rgba(129,140,248,", "rgba(34,211,238,",
    ];

    type Dot = { x: number; y: number; vy: number; rail: number; size: number; pulse: number; alpha: number };
    const dots: Dot[] = Array.from({ length: 70 }, (_, i) => ({
      x: (canvas.width / 7) * (i % 7) + (canvas.width / 14) + (Math.random() - 0.5) * 40,
      y: Math.random() * canvas.height,
      vy: 0.2 + Math.random() * 0.4,
      rail: i % 7,
      size: 1 + (i % 3) * 0.6,
      pulse: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    const draw = () => {
      t += 0.006;
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        const cx = (w / 7) * d.rail + w / 14 + Math.sin(t * 0.3 + d.pulse) * 12;
        d.y += d.vy;
        if (d.y > h + 8) { d.y = -8; d.x = cx; }
        const flicker = Math.sin(t * 2 + d.pulse) * 0.25 + 0.75;
        ctx.beginPath();
        ctx.arc(cx, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `${RAIL_COLORS[d.rail]}${(d.alpha * flicker * 0.6).toFixed(3)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const gatewayStatus =
    healthLoading && !health
      ? "CHECKING"
      : health?.status === "healthy"
        ? "LIVE"
        : health?.status === "degraded"
          ? "DEGRADED"
          : online
            ? "LIVE"
            : "OFFLINE";

  const latencyLabel =
    typeof health?.latencyMs === "number" ? `${Math.round(health.latencyMs)}ms` : "—";
  const uptimeLabel =
    typeof health?.uptimeSeconds === "number"
      ? health.uptimeSeconds >= 3600
        ? `${Math.floor(health.uptimeSeconds / 3600)}h`
        : `${Math.max(1, Math.floor(health.uptimeSeconds / 60))}m`
      : "—";

  const networkStats = [
    { label: "GATEWAY", value: gatewayStatus, icon: NETWORK_STAT_ICONS[0].icon },
    { label: "LATENCY", value: latencyLabel, icon: NETWORK_STAT_ICONS[1].icon },
    { label: "UPTIME", value: uptimeLabel, icon: NETWORK_STAT_ICONS[2].icon },
    { label: "RAILS ARMED", value: "7 / 7", icon: NETWORK_STAT_ICONS[3].icon },
  ];

  const tickerItems = TICKER_SYMS.map((sym) => {
    const p = prices[sym];
    if (!p) return { sym, price: "—", chg: 0, live: false };
    return {
      sym,
      price: formatCurrency(p.price),
      chg: p.changePercent24h,
      live: true,
    };
  });

  return (
    <div className="min-h-screen bg-[#000000] font-sans">
      <div className="fixed top-0 inset-x-0 z-[60] border-b border-white/[0.06] bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between gap-4 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
          <span>XC-GS-001 · Ground station desk</span>
          <span className="hidden sm:inline">Qualified capital · Segregated node ledgers</span>
          <span className="hidden md:inline">As of 2026 · Confidential</span>
        </div>
      </div>

      <nav className="fixed top-8 inset-x-0 z-50 px-6 py-4 border-b border-white/[0.06]" style={{ background: "#000" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <XCapitalLogoMark size={32} />
            <span className="text-white text-lg font-black tracking-tight">X·CAPITAL</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-[11px] font-mono uppercase tracking-[0.16em] text-white/45">
            <a href="#mandate" className="hover:text-white transition-colors">Mandate</a>
            <a href="#rails" className="hover:text-white transition-colors">Rails</a>
            <a href="#custody" className="hover:text-white transition-colors">Custody</a>
            <a href="#tiers" className="hover:text-white transition-colors">Access</a>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ApiHealthBadge className="hidden sm:inline-flex" />
            <Link href="/auth/login" className="text-sm text-white/40 hover:text-white px-3 py-1.5 transition-colors">Authenticate</Link>
            <Link href="/auth/register" className="text-sm text-black bg-white px-5 py-2 rounded font-black hover:bg-white/90 transition-all" style={{ boxShadow: "0 0 20px rgba(255,255,255,0.15)" }}>Open a node</Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — launch video is the only rocket, always playing
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <HeroLaunchVideo />
        {/* Light cinematic darkening — keeps the video clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 0%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center pt-36 pb-20">
            <div>
              <p className="text-[10px] font-mono text-emerald-400/70 tracking-[0.3em] mb-6 uppercase">Multiplanetary capital · Ground station</p>
              <h1 className="font-black text-white leading-[0.95] tracking-[-0.03em]" style={{ fontSize: "clamp(3rem, 9vw, 10.5rem)" }}>
                Capital<br />Deployed<br /><span className="text-white/40">Under Mandate</span>
              </h1>
              <p className="text-sm md:text-base text-white/50 max-w-md mt-6 leading-relaxed">A single desk. Seven rails. Accrual Core is the clock — each authenticated node holds its own ledger, yield, and settlement history. No pooled books. No mixed sessions.</p>
              <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
                <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded text-base hover:bg-white/90 transition-all" style={{ boxShadow: "0 0 40px rgba(255,255,255,0.10)" }}>Open a node <ArrowRight className="w-4 h-4" /></Link>
                <Link href="/auth/login" className="inline-flex items-center gap-2 bg-black/50 border border-white/[0.15] text-white px-8 py-4 rounded text-base hover:bg-black/70 backdrop-blur transition-all">Authenticate</Link>
              </div>

              {/* Network telemetry strip */}
              <div className="flex flex-wrap items-center gap-5 mt-10 text-[10px] font-mono text-white/30">
                {networkStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-emerald-400/70" />
                    <span className="text-white/25">{label}</span>
                    <span className={`font-bold ${label === "GATEWAY" ? (gatewayStatus === "LIVE" ? "text-emerald-400" : "text-amber-400") : "text-white/60"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 lg:items-end">
              {/* Institutional integrity strip */}
              <div className="w-full max-w-[520px] rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur px-5 py-4">
                <p className="text-[9px] font-mono text-white/30 tracking-[0.28em] uppercase mb-3">Desk controls</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-mono text-white/40">
                  <span className="flex items-center gap-1.5"><Fingerprint className="w-3 h-3 text-emerald-400/70" /> Isolated node</span>
                  <span className="flex items-center gap-1.5"><Scale className="w-3 h-3 text-emerald-400/70" /> Accrual Core</span>
                  <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400/70" /> 1:1 book</span>
                  <span className="flex items-center gap-1.5"><Landmark className="w-3 h-3 text-emerald-400/70" /> Seven rails</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05] text-[9px] font-mono text-white/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SERVER CLOCK · NEON LEDGER · EST. 2026
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="border-y border-white/[0.05] overflow-hidden bg-[#050508]">
        <div className="animate-ticker inline-flex gap-10 whitespace-nowrap text-xs font-mono py-3">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={`${item.sym}-${i}`} className="inline-flex items-center gap-2">
              <span className="text-white/20 tracking-widest">{item.sym}</span>
              <span className="text-white font-semibold">{item.price}</span>
              {item.live && (
                <span className={`text-[10px] font-bold ${item.chg > 0 ? "text-emerald-400" : item.chg < 0 ? "text-red-400" : "text-white/40"}`}>{item.chg > 0 ? "+" : ""}{item.chg.toFixed(1)}%</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <section id="mandate" className="py-24 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Operating mandate</p>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">How the desk is run.</h2>
            </div>
            <p className="text-sm text-white/35 max-w-md leading-relaxed">
              Architecture first. The API is the clock. Neon holds history. Each login hydrates one node — never another user’s book.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {MANDATE.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.code} className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-7 hover-lift">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-mono font-black text-emerald-400/60 tracking-[0.3em]">{item.code}</span>
                    <Icon className="w-4 h-4 text-white/30" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ASSET → NODE → YIELD FLOW ─────────────────────────────────── */}
      <section id="engine" className="py-28 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Clearing map</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Asset to node. <span className="text-white/40">Node to book.</span></h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto mt-4">Every position posts to the authenticated node. The engine routes across seven rails. Yield settles to the same ledger.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {YIELD_FLOW.map((step) => (
              <div key={step.step} className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-8 relative overflow-hidden hover-lift">
                <span className="text-[10px] font-mono font-black text-emerald-400/60 tracking-[0.3em]">{step.step}</span>
                <h3 className="text-xl font-black text-white mt-4 mb-2 tracking-tight">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-emerald-500/[0.04] blur-2xl pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYSTEM STATUS — REAL BACKEND HEALTH ───────────────────────── */}
      <section className="py-20 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-3">Live Network Status</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">Front-to-back infrastructure health.</h3>
                <p className="text-sm text-white/35 max-w-lg">The status below is not decorative — it is read live from the API, database, and AI oracle every few seconds.</p>
              </div>
              <ApiHealthBadge showDetail className="shrink-0" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              {[
                { name: "API", ok: health?.status === "healthy" || health?.status === "degraded" },
                { name: "DATABASE", ok: health?.services.find((s) => s.name === "database")?.status !== "offline" && Boolean(health) },
                { name: "AI ORACLE", ok: health?.services.find((s) => s.name === "ai-oracle")?.status !== "offline" && Boolean(health) },
                { name: "RAIL SYNC", ok: health?.status === "healthy" || health?.status === "degraded" },
              ].map(({ name, ok }) => (
                <div key={name} className="rounded-xl border border-white/[0.06] bg-black/40 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="engine-mono text-[9px] text-white/40 tracking-wider">{name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-500"} animate-pulse`} />
                  </div>
                  <div className={`mt-2 text-[10px] font-mono font-bold tracking-wider ${ok ? "text-emerald-400" : "text-red-400"}`}>
                    {health ? (ok ? "OPERATIONAL" : "OFFLINE") : "CHECKING…"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="rails" className="py-28 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto relative">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />
          <div className="text-center mb-16 relative z-10">
            <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Seven capital rails</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Seven venues. <span className="text-white/40">One book.</span></h2>
          </div>
          <div className="relative z-10 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {RAILS.map((rail, i) => (
              <div key={rail.id} onMouseEnter={() => setActiveRail(rail.id)} onMouseLeave={() => setActiveRail(null)}
                className={`relative rounded-2xl border-2 p-6 transition-all duration-200 ${activeRail === rail.id ? "bg-white/[0.04]" : "bg-transparent"} ${i === 6 ? "sm:col-span-2 xl:col-span-2" : ""}`}
                style={{ borderColor: activeRail === rail.id ? rail.accent : "rgba(255,255,255,0.08)", boxShadow: activeRail === rail.id ? `0 0 30px ${rail.accent}15` : "none" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ background: rail.accent, boxShadow: `0 0 8px ${rail.accent}80` }} />
                  <span className="text-[9px] font-mono font-black text-white/15 tracking-wider">{rail.tag}</span>
                </div>
                <h3 className="text-base font-black text-white mb-2 tracking-tight">{rail.label}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{rail.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="custody" className="py-28 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Custody architecture</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">History stays with the node.</h2>
            <p className="text-white/40 text-sm mt-5 leading-relaxed max-w-md">
              Login issues a JWT bound to a single user id. Snapshots, wallets, and transactions are queried with that id only. Switching accounts wipes scoped browser storage. Neon is the system of record — not localStorage.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { k: "Identity", v: "Bearer token · unique user id on every read and write" },
              { k: "Wallet", v: "One wallet row per user. Unique constraint. No shared cash" },
              { k: "Yield", v: "UserYieldConfig per node. Accrual worker credits that wallet only" },
              { k: "Persistence", v: "Neon Postgres (pooled + direct). Render is compute, not the book" },
            ].map((row) => (
              <div key={row.k} className="rounded-xl border border-white/[0.08] bg-white/[0.015] px-5 py-4 flex gap-6">
                <span className="text-[10px] font-mono font-black text-emerald-400/70 tracking-[0.2em] w-24 shrink-0 pt-0.5">{row.k.toUpperCase()}</span>
                <span className="text-sm text-white/45 leading-relaxed">{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tiers" className="py-28 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Desk access</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Three mandates. <span className="text-white/40">One ledger model.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((tier, i) => (
              <div key={tier.name} className={`rounded-2xl border-2 p-8 flex flex-col ${tier.featured ? "border-white/30 bg-white/[0.03] md:-mt-4 md:pb-12" : "border-white/[0.08]"}`} style={{ boxShadow: tier.featured ? "0 0 40px rgba(255,255,255,0.05)" : "none" }}>
                <p className="text-[10px] font-mono font-bold text-white/30 tracking-[0.3em] mb-4">{tier.name}</p>
                <p className="text-3xl font-black text-white mb-1">{tier.price}</p>
                <p className="text-xs text-white/30 mb-8 pb-6 border-b border-white/[0.06]">{tier.desc}</p>
                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-white/50"><span className="w-1 h-1 rounded-full bg-white/30" />{f}</li>))}
                </ul>
                <Link href="/auth/register" className={`mt-8 block text-center py-3 rounded font-bold text-sm transition-all ${tier.featured ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.06] text-white border border-white/[0.10] hover:bg-white/[0.10]"}`}>{i === 2 ? "Request invitation" : "Open a node"}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPITAL NETWORK TWIN — DIGITAL TWIN OF THE NETWORK ─────────── */}
      <section id="stream" className="py-28 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Capital Network Twin · Live</p>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Settlement map of the <span className="text-white/40">seven-rail desk.</span></h2>
              <p className="text-white/35 text-sm max-w-md mt-4 leading-relaxed">Digital twin of the clearing fabric. Efficiency, liquidity, latency, and reserve integrity are instruments on the panel — the ledger remains on the server, scoped to the authenticated node.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="text-[9px] font-mono text-white/25 tracking-wider">GATEWAY</div>
                  <div className={`text-lg font-black font-mono mt-1 ${gatewayStatus === "LIVE" ? "text-emerald-400" : "text-amber-400"}`}>{gatewayStatus}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="text-[9px] font-mono text-white/25 tracking-wider">AVG SETTLE</div>
                  <div className="text-lg font-black font-mono text-white mt-1">{latencyLabel}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="text-[9px] font-mono text-white/25 tracking-wider">UPTIME</div>
                  <div className="text-lg font-black font-mono text-white mt-1">{uptimeLabel}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="text-[9px] font-mono text-white/25 tracking-wider">RAILS ARMED</div>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-1">7 / 7</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <CapitalNetworkTwin className="w-full max-w-[560px]" />
            </div>
          </div>
        </div>
      </section>

      <section id="cta" className="py-28 px-6 bg-[#000000]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-6">Qualified access</p>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">A desk, not an app.<br /><span className="text-white/40">A node, not a pooled account.</span></h2>

          <p className="text-white/30 text-sm max-w-md mx-auto mb-10">Seven rails. Server clock. Isolated history on Neon.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-black font-black px-9 py-4 rounded text-sm hover:bg-white/90 transition-all" style={{ boxShadow: "0 0 40px rgba(255,255,255,0.08)" }}>Open a node <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/auth/login" className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.10] text-white px-7 py-4 rounded text-sm hover:bg-white/[0.10] transition-all">Authenticate</Link>
          </div>
        </div>
      </section>

      {/* ── INSTITUTIONAL TRUST BAR ── */}
      <div className="border-t border-white/[0.05] bg-[#000000]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] font-mono uppercase tracking-wider text-white/25">
          <span className="flex items-center gap-2"><Fingerprint className="w-3.5 h-3.5 text-emerald-500/60" /> Isolated node ledgers</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-emerald-500/60" /> Accrual Core clock</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span>NEON SYSTEM OF RECORD</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span>SEVEN RAILS</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span className="text-white/40">BOOK 1:1</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span>EST. 2026</span>
        </div>
      </div>

      <footer className="border-t border-white/[0.05] py-10 px-6 bg-[#000000]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div className="flex items-center gap-3">
            <Globe className="w-3.5 h-3.5 text-emerald-500/60" />
            <span>&copy; 2026 X·CAPITAL. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/legal/terms" className="hover:text-white/50 transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <span className="hidden sm:inline">Ground station · seven rails · one book</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-white/[0.04]">
          <p className="text-[10px] leading-relaxed text-white/15 max-w-4xl">
            Disclosure: X·CAPITAL is a capital-deployment terminal. Access is for authenticated nodes. Yield, NAV, and rail availability are governed by the operator and by the Accrual Core on the API. Capital products carry risk, including possible loss of principal. Past performance is not indicative of future results. Projected yield figures are illustrative modelling outputs based on platform assumptions and do not constitute a guarantee or offer of return. Not FDIC insured. Digital asset products are not bank deposits. This site is not a solicitation to any person in any jurisdiction where such an offer would be unlawful.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 50s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }

        @keyframes heroZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.12); }
        }
        .animate-hero-zoom {
          animation: heroZoom 28s ease-in-out infinite alternate;
        }

        @keyframes floatRocket {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-18px) rotate(4deg); }
        }
        .animate-float-rocket {
          animation: floatRocket 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}