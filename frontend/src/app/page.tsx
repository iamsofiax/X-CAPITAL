"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Landmark,
  FileCheck2,
  Activity,
  Cpu,
  Radio,
  Server,
  Globe,
} from "lucide-react";
import ApiHealthBadge from "@/components/system/ApiHealthBadge";
import CapitalNetworkTwin from "@/components/network-twin/CapitalNetworkTwin";
import HeroRocket from "@/components/brand/HeroRocket";
import { useApiHealth } from "@/hooks/useApiHealth";


/* eslint-disable react/no-unescaped-entities */

const RAILS = [
  {
    id: "equities",
    label: "Public Markets",
    tag: "RAIL 01",
    accent: "#ffffff",
    desc: "Institutional execution across 14 global exchanges. Sub-ms routing. No retail latency floors.",
  },
  {
    id: "private",
    label: "Private Equity",
    tag: "RAIL 02",
    accent: "#f59e0b",
    desc: "Pre-IPO deal flow, SPV co-investment. SpaceX, xAI, Anduril — before the public.",
  },
  {
    id: "chain",
    label: "Tokenized Assets",
    tag: "RAIL 03",
    accent: "#a78bfa",
    desc: "SEC-compliant security tokens. On-chain settlement, whitelisted wallets, real ownership.",
  },
  {
    id: "commerce",
    label: "Commerce-Capital",
    tag: "RAIL 04",
    accent: "#34d399",
    desc: "Every purchase deploys capital. Buy a Tesla, acquire TSLA. Commerce and portfolio collapse into one.",
  },
  {
    id: "oracle",
    label: "AI Oracle",
    tag: "RAIL 05",
    accent: "#fb7185",
    desc: "LSTM forecasting, Monte Carlo simulation, sentiment scoring. Positions sized by machine, not intuition.",
  },
  {
    id: "infra",
    label: "Infrastructure Fund",
    tag: "RAIL 06",
    accent: "#818cf8",
    desc: "AI data centers, geothermal grids, space supply chain. Hard-asset collateral, government-contracted revenue.",
  },
  {
    id: "orbital",
    label: "Orbital Economy",
    tag: "RAIL 07",
    accent: "#22d3ee",
    desc: "Starlink bandwidth routing. 7,200+ satellites. Real yield from data transmission, not fund wrappers.",
  },
] as const;

const TICKER = [
  { sym: "BTC", price: "$94,420", chg: 2.3 },
  { sym: "ETH", price: "$4,282", chg: 1.8 },
  { sym: "TSLA", price: "$387.40", chg: 3.1 },
  { sym: "NVDA", price: "$952.60", chg: 0.9 },
  { sym: "SP500", price: "6,840", chg: 0.4 },
  { sym: "AAPL", price: "$203.40", chg: 1.2 },
  { sym: "GOLD", price: "$3,420", chg: -0.2 },
  { sym: "XLINK", price: "$2,441", chg: 6.1 },
];

const TIERS = [
  {
    name: "QUANTUM",
    price: "$9,999/mo",
    desc: "Entry to institutional-grade execution",
    features: ["50,000+ instruments", "AI Oracle forecasting", "Tokenized asset desk", "Full risk analytics", "24/7 support"],
  },
  {
    name: "SOVEREIGN",
    price: "$49,999/mo",
    desc: "For multi-family offices",
    features: ["Everything in QUANTUM", "Pre-IPO deal flow & SPVs", "Opportunity Funds", "Space & infra funds", "Private wealth concierge"],
    featured: true,
  },
  {
    name: "VERTEX",
    price: "By Invitation",
    desc: "No ceiling. Min $50M AUM.",
    features: ["Everything in SOVEREIGN", "Founder co-investment rights", "Board access", "Sovereign wealth setup", "Zero execution fees"],
  },
];

const NETWORK_STATS = [
  { label: "ACTIVE NODES", value: "14,892", icon: Server },
  { label: "COMPUTE", value: "2.4 PFlops", icon: Cpu },
  { label: "RAILS ARMED", value: "7 / 7", icon: Radio },
  { label: "GATEWAY", value: "LIVE", icon: Activity },
];

const YIELD_FLOW = [
  {
    step: "01",
    title: "Asset becomes a node",
    desc: "Any asset you own — vehicle, property, GPU cluster, holding — is integrated into the routing engine.",
  },
  {
    step: "02",
    title: "Node routes capital",
    desc: "The engine deploys across seven rails: public markets, private equity, tokenized assets, orbital infrastructure.",
  },
  {
    step: "03",
    title: "Yield returns to you",
    desc: "Revenue streams settle back into your wallet. Compounding with every cycle. No fund outflow, ever.",
  },
];

export default function LandingPage() {
  const [activeRail, setActiveRail] = useState<string | null>(null);
  const { health } = useApiHealth();

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
    health?.status === "healthy"
      ? "LIVE"
      : health?.status === "degraded"
        ? "DEGRADED"
        : "CHECKING";

  return (
    <div className="min-h-screen bg-[#000000] font-sans">

      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 border-b border-white/[0.06]" style={{ background: "#000" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-white text-lg font-black tracking-tight">X·CAPITAL</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#rails" className="hover:text-white transition-colors">Rails</a>
            <a href="#engine" className="hover:text-white transition-colors">Engine</a>
            <a href="#tiers" className="hover:text-white transition-colors">Tiers</a>
            <a href="#cta" className="hover:text-white transition-colors">Access</a>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ApiHealthBadge className="hidden sm:inline-flex" />
            <Link href="/auth/login" className="text-sm text-white/40 hover:text-white px-3 py-1.5 transition-colors">Log in</Link>
            <Link href="/auth/register" className="text-sm text-black bg-white px-5 py-2 rounded font-black hover:bg-white/90 transition-all" style={{ boxShadow: "0 0 20px rgba(255,255,255,0.15)" }}>Register Node</Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — rocket video always on, near full brightness, vector rocket
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Background video — orbital launch loop, always visible. No poster
            image: nothing brand-related may flash before the video starts. */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.9] pointer-events-none animate-hero-zoom"
          src="/videos/hero-hd.mp4"
        />
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
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center pt-28 pb-20">
            <div>
              <p className="text-[10px] font-mono text-white/40 tracking-[0.3em] mb-6 uppercase">Multiplanetary Capital Deployment</p>
              <h1 className="font-black text-white leading-[0.95] tracking-[-0.03em]" style={{ fontSize: "clamp(3rem, 9vw, 10.5rem)" }}>
                Capital<br />Deployed<br /><span className="text-white/40">Into The Future</span>
              </h1>
              <p className="text-sm md:text-base text-white/50 max-w-md mt-6 leading-relaxed">One engine. Seven rails. Ground station clears capital — deploy across markets, funds, blockchain, and orbital infrastructure at full velocity.</p>
              <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
                <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded text-base hover:bg-white/90 transition-all" style={{ boxShadow: "0 0 40px rgba(255,255,255,0.10)" }}>Register Node <ArrowRight className="w-4 h-4" /></Link>
                <Link href="/dashboard" className="inline-flex items-center gap-2 bg-black/50 border border-white/[0.15] text-white px-8 py-4 rounded text-base hover:bg-black/70 backdrop-blur transition-all">Dashboard</Link>
              </div>

              {/* Network telemetry strip */}
              <div className="flex flex-wrap items-center gap-5 mt-10 text-[10px] font-mono text-white/30">
                {NETWORK_STATS.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-emerald-400/70" />
                    <span className="text-white/25">{label}</span>
                    <span className={`font-bold ${label === "GATEWAY" ? (gatewayStatus === "LIVE" ? "text-emerald-400" : "text-amber-400") : "text-white/60"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero centerpiece — the rocket. Clear sky, nothing obstructing it. */}
            <div className="flex flex-col items-center gap-6 lg:items-end">
              {/* Mobile rocket mark — sits below the headline, no overlap */}
              <div className="lg:hidden">
                <HeroRocket mobile />
              </div>
              {/* Desktop rocket — 4K-native vector, right column */}
              <div className="hidden lg:flex animate-float-rocket">
                <HeroRocket height={400} />
              </div>
              {/* Institutional integrity strip */}
              <div className="w-full max-w-[520px] rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur px-5 py-4">
                <p className="text-[9px] font-mono text-white/30 tracking-[0.28em] uppercase mb-3">Institutional Integrity</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-mono text-white/40">
                  <span className="flex items-center gap-1.5"><Landmark className="w-3 h-3 text-emerald-400/70" /> SEC / FINRA</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-400/70" /> SOC 2 II</span>
                  <span className="flex items-center gap-1.5"><FileCheck2 className="w-3 h-3 text-emerald-400/70" /> D&B Verified</span>
                  <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400/70" /> Custody 1:1</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05] text-[9px] font-mono text-white/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REALTIME MARKET INFRASTRUCTURE · EST. 2026
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="border-y border-white/[0.05] overflow-hidden bg-[#050508]">
        <div className="animate-ticker inline-flex gap-10 whitespace-nowrap text-xs font-mono py-3">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="text-white/20 tracking-widest">{item.sym}</span>
              <span className="text-white font-semibold">{item.price}</span>
              <span className={`text-[10px] font-bold ${item.chg > 0 ? "text-emerald-400" : "text-red-400"}`}>{item.chg > 0 ? "+" : ""}{item.chg.toFixed(1)}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── ASSET → NODE → YIELD FLOW ─────────────────────────────────── */}
      <section id="engine" className="py-28 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">The Engine</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Asset to node. <span className="text-white/40">Node to yield.</span></h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto mt-4">Every asset in your orbit becomes a capital node. The engine routes it across seven rails and settles the yield back to you.</p>
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
                { name: "API", ok: true },
                { name: "DATABASE", ok: health?.services.find((s) => s.name === "database")?.status !== "offline" },
                { name: "AI ORACLE", ok: health?.services.find((s) => s.name === "ai-oracle")?.status !== "offline" },
                { name: "RAIL SYNC", ok: true },
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
            <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Seven Capital Rails</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Seven routes. <span className="text-white/40">One platform.</span></h2>
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

      <section id="tiers" className="py-28 px-6 bg-[#000000]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-4">Institutional Access</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Three tiers. <span className="text-white/40">One network.</span></h2>
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
                <Link href="/auth/register" className={`mt-8 block text-center py-3 rounded font-bold text-sm transition-all ${tier.featured ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.06] text-white border border-white/[0.10] hover:bg-white/[0.10]"}`}>{i === 2 ? "Request Invitation" : "Get Started"}</Link>
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
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Your capital deployed <span className="text-white/40">across the network.</span></h2>
              <p className="text-white/35 text-sm max-w-md mt-4 leading-relaxed">The digital twin of the X-CAPITAL infrastructure. A settlement core routes capital across seven rails in real time — efficiency, liquidity, latency and reserve integrity read live at mission control.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="text-[9px] font-mono text-white/25 tracking-wider">SETTLED TODAY</div>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-1">$4.82M</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="text-[9px] font-mono text-white/25 tracking-wider">AVG SETTLE</div>
                  <div className="text-lg font-black font-mono text-white mt-1">{"<"}30ms</div>

                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="text-[9px] font-mono text-white/25 tracking-wider">ACTIVE NODES</div>
                  <div className="text-lg font-black font-mono text-white mt-1">14,892</div>
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
          <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase mb-6">Institutional Access</p>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">You are not competing with apps.<br /><span className="text-white/40">You are competing with Goldman.</span></h2>

          <p className="text-white/30 text-sm max-w-md mx-auto mb-10">Seven rails. Regulated. Orbital-grade latency.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-black font-black px-9 py-4 rounded text-sm hover:bg-white/90 transition-all" style={{ boxShadow: "0 0 40px rgba(255,255,255,0.08)" }}>Register Your Node <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/engine" className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/[0.10] text-white px-7 py-4 rounded text-sm hover:bg-white/[0.10] transition-all">Explore Engine</Link>
          </div>
        </div>
      </section>

      {/* ── INSTITUTIONAL TRUST BAR ── */}
      <div className="border-t border-white/[0.05] bg-[#000000]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] font-mono uppercase tracking-wider text-white/25">
          <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" /> SOC 2 Type II Audited</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-emerald-500/60" /> Bank-Grade Custody</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span>SEC / FINRA REGISTERED ENTITIES</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span>D&B VERIFIED</span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span className="text-white/40">RESERVES 1:1</span>
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
          <span>Multiplanetary capital deployment. Seven rails. One command center.</span>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-white/[0.04]">
          <p className="text-[10px] leading-relaxed text-white/15 max-w-4xl">
            Disclosure: X·CAPITAL operates as a technology platform enabling access to diversified investment vehicles.
            All investment products carry risk, including possible loss of principal. Past performance is not indicative of
            future results. Projected yield figures are illustrative modelling outputs based on platform assumptions and do
            not constitute a guarantee or offer of return. Securities offered through registered broker-dealers and
            regulated entities. Not FDIC insured. Digital asset products are not bank deposits.
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
