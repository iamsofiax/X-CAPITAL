"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Fingerprint,
  Globe,
  Landmark,
  Layers,
  Menu,
  Scale,
  Server,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { XCapitalLogoMark } from "@/components/brand/XCapitalLogo";
import { DeskStatus } from "@/components/landing/DeskStatus";
import { CoreSimulation } from "@/components/landing/CoreSimulation";
import { useHealth } from "@/hooks/useHealth";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { formatCurrency } from "@/lib/utils";

const RAILS = [
  {
    id: "equities",
    label: "Public Markets",
    tag: "RAIL 01",
    accent: "#ffffff",
    desc: "Agency execution across primary venues. Settlement posts to the node ledger.",
  },
  {
    id: "private",
    label: "Private Equity",
    tag: "RAIL 02",
    accent: "#f59e0b",
    desc: "Closed-end and SPV participation under mandate. Positions post to the same isolated ledger.",
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
    desc: "Forecasting, scenario, and sentiment as decision support. Sizing remains subject to mandate.",
  },
  {
    id: "infra",
    label: "Infrastructure Fund",
    tag: "RAIL 06",
    accent: "#818cf8",
    desc: "Hard-asset sleeves: compute, energy, logistics. Collateral and cash flows book to the node.",
  },
  {
    id: "orbital",
    label: "Orbital Economy",
    tag: "RAIL 07",
    accent: "#22d3ee",
    desc: "Orbital capacity as an infrastructure sleeve. Yield, when booked, is attributed to the node that holds the position.",
  },
];

const TICKER = ["BTC", "ETH", "TSLA", "NVDA", "SPY", "AAPL", "GLD"];

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
      "24/7 operator desk",
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

const STEPS = [
  {
    step: "01",
    title: "Asset is booked as a node",
    desc: "Holdings, cash, and sleeves post to a unique node. The book belongs to that node.",
  },
  {
    step: "02",
    title: "Desk routes across seven rails",
    desc: "Public markets, private equity, tokenized assets, commerce, oracle, infrastructure, orbital — one clearing map.",
  },
  {
    step: "03",
    title: "Yield settles to the same book",
    desc: "Accrual Core writes the book. The panel interpolates display only.",
  },
];

const MANDATES = [
  {
    code: "01",
    icon: Fingerprint,
    title: "Segregated ledgers",
    desc: "One wallet, one yield config, one transaction history per authenticated node.",
  },
  {
    code: "02",
    icon: Scale,
    title: "Accrual Core is authoritative",
    desc: "Yield is credited on the book. The panel interpolates for display. Interpolation is not history.",
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
    desc: "Credits, debits, and yield events persist on the node. Sessions and devices do not remix books.",
  },
];

const CUSTODY = [
  { k: "Identity", v: "Session bound to one node on every read and write" },
  { k: "Wallet", v: "One wallet per node. Cash is never shared" },
  { k: "Yield", v: "Accrual Core credits that wallet only" },
  { k: "Persistence", v: "Durable ledger. Compute is not the book" },
];

function HeroVideo() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      src="https://xcapital.investments/videos/hero-hd.mp4"
      className="absolute inset-0 w-full h-full object-cover opacity-[0.9] pointer-events-none animate-hero-zoom"
    />
  );
}

export default function LandingPage() {
  const [hoverRail, setHoverRail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { health, online, loading } = useHealth();
  const { prices } = useMarketPrices({ refreshInterval: 120000 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const colors = [
      "rgba(255,255,255,",
      "rgba(245,158,11,",
      "rgba(167,139,250,",
      "rgba(52,211,153,",
      "rgba(251,113,133,",
      "rgba(129,140,248,",
      "rgba(34,211,238,",
    ];
    const dots = Array.from({ length: 70 }, (_, i) => ({
      x: (canvas.width / 7) * (i % 7) + canvas.width / 14 + (Math.random() - 0.5) * 40,
      y: Math.random() * canvas.height,
      vy: 0.2 + 0.4 * Math.random(),
      rail: i % 7,
      size: 1 + (i % 3) * 0.6,
      pulse: Math.random() * Math.PI * 2,
      alpha: 0.15 + 0.35 * Math.random(),
    }));
    const draw = () => {
      t += 0.006;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const dot of dots) {
        const x = (w / 7) * dot.rail + w / 14 + 12 * Math.sin(0.3 * t + dot.pulse);
        dot.y += dot.vy;
        if (dot.y > h + 8) {
          dot.y = -8;
          dot.x = x;
        }
        const a = 0.25 * Math.sin(2 * t + dot.pulse) + 0.75;
        ctx.beginPath();
        ctx.arc(x, dot.y, dot.size, 0, 2 * Math.PI);
        ctx.fillStyle = `${colors[dot.rail]}${(dot.alpha * a * 0.6).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const gateway =
    loading && !health ? "CHECKING" : online || health ? "LIVE" : "OFFLINE";
  const latency =
    typeof health?.latencyMs === "number" ? `${Math.round(health.latencyMs)}ms` : "—";
  const uptime =
    typeof health?.uptimeSeconds === "number"
      ? health.uptimeSeconds >= 3600
        ? `${Math.floor(health.uptimeSeconds / 3600)}h`
        : `${Math.max(1, Math.floor(health.uptimeSeconds / 60))}m`
      : "—";

  const stats = [
    { label: "GATEWAY", value: gateway, icon: Activity },
    { label: "LATENCY", value: latency, icon: Zap },
    { label: "UPTIME", value: uptime, icon: Server },
    { label: "RAILS ARMED", value: "7 / 7", icon: Layers },
  ];

  const tape = TICKER.map((sym) => {
    const q = prices[sym];
    return q
      ? { sym, price: formatCurrency(q.price), chg: q.changePercent24h, live: true }
      : { sym, price: "—", chg: 0, live: false };
  });

  const svc = (name: string) =>
    health?.services.find((s) => s.name === name || (name === "ledger" && s.name === "database"));
  const svcOk = (name: string) => {
    const row = svc(name);
    if (row) return row.status !== "offline";
    return health?.status === "healthy" || health?.status === "degraded";
  };
  const services = [
    { name: "API", ok: svcOk("api") },
    { name: "LEDGER", ok: true },
    { name: "AI ORACLE", ok: svcOk("ai-oracle") },
    { name: "RAIL SYNC", ok: svcOk("rail-sync") },
  ];

  return (
    <div className="min-h-screen bg-[#000000] font-sans">
      <div className="fixed top-0 inset-x-0 z-[60] border-b border-white/[0.06] bg-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between gap-4 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
          <span>XC-001 · Operator desk</span>
          <span className="hidden sm:inline">Qualified capital · Segregated node ledgers</span>
          <span className="hidden md:inline">As of 2026 · Confidential</span>
        </div>
      </div>

      <nav
        style={{ background: "#000" }}
        className="fixed top-8 inset-x-0 z-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]"
      >
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
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <DeskStatus className="hidden lg:inline-flex" />
            <Link href="/auth/login" className="hidden md:inline text-sm text-white/40 hover:text-white px-3 py-1.5 transition-colors">
              Authenticate
            </Link>
            <Link
              href="/auth/register"
              className="sim-btn sim-btn-primary px-4 sm:px-5 py-2.5 text-sm"
            >
              Open a node
            </Link>
            <button
              type="button"
              className="md:hidden h-12 w-12 shrink-0 rounded-xl border border-white/15 flex items-center justify-center text-white/80"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden max-w-7xl mx-auto pt-3 pb-2 space-y-1">
            {[
              ["#mandate", "Mandate"],
              ["#rails", "Rails"],
              ["#custody", "Custody"],
              ["#tiers", "Access"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-4 text-base text-white/80 hover:bg-white/[0.04] hover:text-white"
              >
                {label}
              </a>
            ))}
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-4 text-base text-white/80 hover:bg-white/[0.04] hover:text-white"
            >
              Authenticate
            </Link>
          </div>
        )}
      </nav>

      <section
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="relative min-h-screen flex items-center overflow-hidden bg-[#000000]"
      >
        <HeroVideo />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 0%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-xl lg:max-w-2xl pt-36 pb-20">
            <p className="text-[10px] font-mono text-emerald-400/70 tracking-[0.3em] mb-6 uppercase">
              Multiplanetary capital · Operator desk
            </p>
            <h1 className="font-black text-white leading-[0.95] tracking-[-0.03em] text-[3rem] sm:text-[3.25rem] lg:text-[4.25rem] lg:tracking-[-0.045em] lg:leading-[0.92]">
              Capital
              <br />
              Deployed
              <br />
              <span className="text-white/40">Under Mandate</span>
            </h1>
            <p className="text-sm md:text-base text-white/50 max-w-md mt-6 leading-relaxed">
              A single desk. Seven rails. Accrual Core is authoritative. Each authenticated node holds its own ledger, yield, and settlement history.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
              <Link
                href="/auth/register"
                className="sim-btn sim-btn-primary px-8 py-4 text-base"
              >
                Open a node <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="sim-btn sim-btn-ghost px-8 py-4 text-base"
              >
                Authenticate
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-5 mt-10 text-[10px] font-mono text-white/30">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-emerald-400/70" />
                  <span className="text-white/25">{label}</span>
                  <span
                    className={`font-bold ${
                      label === "GATEWAY"
                        ? gateway === "LIVE"
                          ? "text-emerald-400"
                          : "text-amber-400"
                        : "text-white/60"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div className="pnl-stage mt-8 w-full px-5 py-4">
              <p className="text-[9px] font-mono text-white/30 tracking-[0.28em] uppercase mb-3">Desk controls</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-mono text-white/40">
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="w-3 h-3 text-emerald-400/70" /> Isolated node
                </span>
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3 h-3 text-emerald-400/70" /> Accrual Core
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400/70" /> 1:1 book
                </span>
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-3 h-3 text-emerald-400/70" /> Seven rails
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05] text-[9px] font-mono text-white/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACCRUAL CORE · AUTHORITATIVE BOOK · EST. 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-white/[0.05] overflow-hidden bg-[#050508]">
        <div className="animate-ticker inline-flex gap-10 whitespace-nowrap text-xs font-mono py-3">
          {[...tape, ...tape].map((item, i) => (
            <span key={`${item.sym}-${i}`} className="inline-flex items-center gap-2">
              <span className="text-white/20 tracking-widest">{item.sym}</span>
              <span className="text-white font-semibold">{item.price}</span>
              {item.live && (
                <span
                  className={`text-[10px] font-bold ${
                    item.chg > 0 ? "text-emerald-400" : item.chg < 0 ? "text-red-400" : "text-white/40"
                  }`}
                >
                  {item.chg > 0 ? "+" : ""}
                  {item.chg.toFixed(1)}%
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <section
        id="mandate"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="py-24 px-6 bg-[#000000]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="sim-label text-emerald-300/80 mb-4">Operating mandate</p>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">How the desk is run.</h2>
            </div>
            <p className="text-sm text-white/35 max-w-md leading-relaxed">
              Accrual Core is authoritative. Each session hydrates one book.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {MANDATES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.code} className="pnl-card pnl-card-pos hover-lift">
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

      <section
        id="engine"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="py-28 px-6 bg-[#000000]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="sim-label text-emerald-300/80 mb-4">Clearing map</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Asset to node. <span className="text-white/40">Node to book.</span>
            </h2>
            <p className="text-white/35 text-sm max-w-lg mx-auto mt-4">
              Every position posts to the authenticated node. The engine routes across seven rails. Yield settles to the same ledger.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="pnl-stage p-8 relative overflow-hidden hover-lift"
              >
                <span className="text-[10px] font-mono font-black text-emerald-400/60 tracking-[0.3em]">{step.step}</span>
                <h3 className="text-xl font-black text-white mt-4 mb-2 tracking-tight">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-emerald-500/[0.04] blur-2xl pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="py-20 px-6 bg-[#000000]">
        <div className="max-w-6xl mx-auto">
          <div className="pnl-stage p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="sim-label text-emerald-300/80 mb-3">Desk status</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">Live network.</h3>
                <p className="text-sm text-white/35 max-w-lg">
                  Desk, ledger, oracle, and rail sync — sampled from the book.
                </p>
              </div>
              <DeskStatus showDetail className="shrink-0" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              {services.map(({ name, ok }) => (
                <div key={name} className="pnl-card pnl-card-pos">
                  <div className="flex items-center justify-between">
                    <span className="engine-mono text-[9px] text-white/40 tracking-wider">{name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-500"} animate-pulse`} />
                  </div>
                  <div className={`mt-2 text-[10px] font-mono font-bold tracking-wider ${ok ? "text-emerald-400" : "text-red-400"}`}>
                    {health ? (ok ? "LIVE" : "OFFLINE") : "CHECKING…"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="rails"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="py-28 px-6 bg-[#000000]"
      >
        <div className="max-w-6xl mx-auto relative">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />
          <div className="text-center mb-16 relative z-10">
            <p className="sim-label text-emerald-300/80 mb-4">Seven capital rails</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Seven venues. <span className="text-white/40">One book.</span>
            </h2>
          </div>
          <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {RAILS.map((rail, i) => (
              <div
                key={rail.id}
                onMouseEnter={() => setHoverRail(rail.id)}
                onMouseLeave={() => setHoverRail(null)}
                style={{
                  ["--sleeve" as string]: rail.accent,
                  ["--pnl-bar" as string]: rail.accent,
                  boxShadow: hoverRail === rail.id ? `0 0 30px ${rail.accent}22` : undefined,
                }}
                className={`pnl-sleeve relative transition-shadow duration-200 ${
                  hoverRail === rail.id ? "ring-1" : ""
                } ${i === 6 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="relative flex justify-end mb-4">
                  <span className="rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-[11px] font-mono font-black tracking-[0.18em] text-white">
                    {rail.tag}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mb-2 tracking-tight">{rail.label}</h3>
                <p className="text-xs text-white/75 leading-relaxed">{rail.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="custody"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="py-28 px-6 bg-[#000000]"
      >
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="sim-label text-emerald-300/80 mb-4">Custody architecture</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">History stays with the node.</h2>
            <p className="text-white/40 text-sm mt-5 leading-relaxed max-w-md">
              Session binds to one node. Reads and writes are scoped to that node. The panel does not hold history.
            </p>
          </div>
          <div className="space-y-3">
            {CUSTODY.map((row) => (
              <div key={row.k} className="pnl-card pnl-card-pos flex gap-6 items-start">
                <span className="text-[10px] font-mono font-black text-emerald-400/70 tracking-[0.2em] w-24 shrink-0 pt-0.5">
                  {row.k.toUpperCase()}
                </span>
                <span className="text-sm text-white/45 leading-relaxed">{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="tiers"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="py-28 px-6 bg-[#000000]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="sim-label text-emerald-300/80 mb-4">Desk access</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Three mandates. <span className="text-white/40">One ledger model.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                style={{ boxShadow: tier.featured ? "0 0 40px rgba(255,255,255,0.05)" : "none" }}
                className={`pnl-stage p-8 flex flex-col ${tier.featured ? "sim-glass-edge" : ""}`}
              >
                <p className="text-[10px] font-mono font-bold text-white/30 tracking-[0.3em] mb-4">{tier.name}</p>
                <p className="text-3xl font-black text-white mb-1">{tier.price}</p>
                <p className="text-xs text-white/30 mb-8 pb-6 border-b border-white/[0.06]">{tier.desc}</p>
                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`sim-btn mt-8 w-full ${tier.featured ? "sim-btn-primary" : "sim-btn-ghost"}`}
                >
                  {i === 2 ? "Request invitation" : "Open a node"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="stream"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="py-28 px-6 bg-[#000000]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="sim-label text-emerald-300/80 mb-4">
              Super AGI Core · Live
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Settlement map of the <span className="text-white/40">seven-rail desk.</span>
            </h2>
            <p className="text-white/35 text-sm max-w-md mt-4 leading-relaxed">
              Digital twin of the clearing fabric. Efficiency, liquidity, latency, and reserve integrity are instruments on the panel — the ledger remains on the server, scoped to the authenticated node.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="pnl-card pnl-card-pos">
              <div className="text-[9px] font-mono text-white/25 tracking-wider">GATEWAY</div>
              <div className={`text-lg font-black font-mono mt-1 ${gateway === "LIVE" ? "text-emerald-400" : "text-amber-400"}`}>
                {gateway}
              </div>
            </div>
            <div className="pnl-card pnl-card-pos">
              <div className="text-[9px] font-mono text-white/25 tracking-wider">AVG SETTLE</div>
              <div className="text-lg font-black font-mono text-white mt-1">{latency}</div>
            </div>
            <div className="pnl-card pnl-card-pos">
              <div className="text-[9px] font-mono text-white/25 tracking-wider">UPTIME</div>
              <div className="text-lg font-black font-mono text-white mt-1">{uptime}</div>
            </div>
            <div className="pnl-card pnl-card-pos">
              <div className="text-[9px] font-mono text-white/25 tracking-wider">RAILS ARMED</div>
              <div className="text-lg font-black font-mono text-emerald-400 mt-1">7 / 7</div>
            </div>
          </div>
          <div className="engine-bay pnl-stage mt-6 p-3 sm:p-6 md:p-8">
            <CoreSimulation />
          </div>
        </div>
      </section>

      <section id="cta" className="py-28 px-6 bg-[#000000]">
        <div className="max-w-3xl mx-auto">
          <div className="sim-glass sim-glass-edge px-8 py-16 sm:px-14 md:px-16 text-center">
          <p className="sim-label !text-emerald-300 mb-6">Qualified access</p>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
            The desk.
            <br />
            <span className="text-white/40">One node. One book.</span>
          </h2>
          <p className="text-white/30 text-sm max-w-md mx-auto mb-10">Seven rails. Accrual Core. Isolated history.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="sim-btn sim-btn-primary px-9 py-4 text-sm"
            >
              Open a node <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="sim-btn sim-btn-ghost px-7 py-4 text-sm"
            >
              Authenticate
            </Link>
          </div>
          </div>
        </div>
      </section>

      <div className="border-t border-white/[0.05] bg-[#000000]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] font-mono uppercase tracking-wider text-white/25">
          <span className="flex items-center gap-2">
            <Fingerprint className="w-3.5 h-3.5 text-emerald-500/60" /> Isolated node ledgers
          </span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500/60" /> Accrual Core clock
          </span>
          <span className="hidden sm:inline text-white/10">·</span>
          <span>AUTHORITATIVE BOOK</span>
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
            <span>© 2026 X·CAPITAL. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/legal/terms" className="hover:text-white/50 transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <span className="hidden sm:inline">Seven rails. One book.</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-white/[0.04]">
          <p className="text-[10px] leading-relaxed text-white/15 max-w-4xl">
            Disclosure: X·CAPITAL is a capital-deployment terminal. Access is for authenticated nodes. Yield, NAV, and rail availability are governed by the operator and by Accrual Core. Capital products carry risk, including possible loss of principal. Past performance is not indicative of future results. Projected yield figures are illustrative modelling outputs based on platform assumptions and do not constitute a guarantee or offer of return. Not FDIC insured. Digital asset products are not bank deposits. This site is not a solicitation to any person in any jurisdiction where such an offer would be unlawful.
          </p>
        </div>
      </footer>
    </div>
  );
}
