"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  Lock,
  Star,
  ChevronDown,
  ChevronUp,
  Car,
  Home,
  Gem,
  Briefcase,
  Smartphone,
  DollarSign,
  Brain,
  Wifi,
  Cpu,
  Activity,
  Server,
  CheckCircle2,
  Users,
  Eye,
  Satellite,
} from "lucide-react";
import { OrbitalHero, CapitalTrajectory } from "@/components/node-engine";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Instruments Available", value: "50,000+" },
  { label: "Markets Connected", value: "14" },
  { label: "Capital Rails", value: "7" },
  { label: "Capital Deployed", value: "$2.4T+" },
];

const features = [
  {
    icon: BarChart3,
    title: "Public Markets Rail",
    description:
      "Institutional-grade execution across NASDAQ, NYSE, and 14 global exchanges. Sub-millisecond order routing via Alpaca Securities. Level III market data. No retail latency floors.",
    tag: "RAIL 01 · EQUITIES",
    color: "from-white/[0.05] to-black border-white/[0.08]",
    iconColor: "text-white/60",
  },
  {
    icon: Lock,
    title: "Private Equity & SPV Rail",
    description:
      "Curated pre-IPO deal flow, co-investment rights, and structured SPV access. SpaceX, xAI, Anduril — before the public ever sees them. Accreditation verified, allocation reserved.",
    tag: "RAIL 02 · PRIVATE",
    color: "from-amber-900/[0.12] to-black border-amber-800/20",
    iconColor: "text-amber-400/70",
  },
  {
    icon: Globe,
    title: "Tokenized Asset Rail",
    description:
      "SEC-compliant security tokens on Polygon. Real underlying ownership, on-chain settlement, whitelisted wallets. Fractional real estate, art, and infrastructure — liquid at last.",
    tag: "RAIL 03 · CHAIN",
    color: "from-violet-900/[0.12] to-black border-violet-800/20",
    iconColor: "text-violet-400/70",
  },
  {
    icon: Zap,
    title: "Commerce-Capital Rail",
    description:
      "Every purchase is a capital deployment event. Buy a Tesla, simultaneously acquire TSLA exposure. Own the product and the company building it. Commerce and portfolio collapse into one.",
    tag: "RAIL 04 · COMMERCE",
    color: "from-emerald-900/[0.12] to-black border-emerald-800/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: TrendingUp,
    title: "AI Oracle Rail",
    description:
      "X-ORACLE: LSTM forecasting, Monte Carlo risk simulation, cross-asset sentiment scoring. 947ms analysis cycles. Positions sized by machine, not intuition. Confidence threshold: 94.7%.",
    tag: "RAIL 05 · INTELLIGENCE",
    color: "from-rose-900/[0.12] to-black border-rose-800/20",
    iconColor: "text-rose-400/70",
  },
  {
    icon: Shield,
    title: "Infrastructure Fund Rail",
    description:
      "Deploy into AI data centers, geothermal grids, and the space supply chain. Hard-asset collateral. Government-contracted revenue streams. Yield that exists whether markets trade or not.",
    tag: "RAIL 06 · REAL ASSETS",
    color: "from-indigo-900/[0.12] to-black border-indigo-800/20",
    iconColor: "text-indigo-400/70",
  },
  {
    icon: Satellite,
    title: "Orbital Economy Rail",
    description:
      "Direct exposure to Starlink satellite infrastructure. Bandwidth generates real yield — 42–56% APY. 7,200+ active satellites. LEO orbital economy participation, not a fund wrapper.",
    tag: "RAIL 07 · ORBITAL",
    color: "from-cyan-900/[0.10] to-black border-cyan-800/20",
    iconColor: "text-cyan-400/70",
  },
];

const tiers = [
  {
    name: "QUANTUM",
    price: "$9,999",
    priceSub: "per month",
    description: "Entry to institutional-grade execution",
    features: [
      "50,000+ global instruments",
      "Real-time AI Oracle forecasting",
      "Tokenized asset desk (SEC-compliant)",
      "Full portfolio risk analytics",
      "Priority KYC & accreditation",
      "24/7 institutional support desk",
    ],
    color: "border-white/10",
    badge: "",
  },
  {
    name: "SOVEREIGN",
    price: "$49,999",
    priceSub: "per month",
    description: "For multi-family offices & fund operators",
    features: [
      "Everything in QUANTUM",
      "Pre-IPO deal flow & SPV co-investment",
      "X-CAPITAL Opportunity Funds",
      "Space & infrastructure economy funds",
      "Dedicated private wealth concierge",
      "Commerce-to-capital automation",
    ],
    color: "border-white/[0.10]/50",
    badge: "MOST CHOSEN",
  },
  {
    name: "VERTEX",
    price: "By Invitation",
    priceSub: "min. $50M AUM",
    description: "The pinnacle. No ceiling.",
    features: [
      "Everything in SOVEREIGN",
      "Direct founder co-investment rights",
      "Portfolio company board access",
      "Sovereign wealth structure setup",
      "Dedicated 24/7 family office team",
      "Zero execution & management fees",
    ],
    color: "border-white/[0.10]/50",
    badge: "APEX",
  },
];

const tickerItems = [
  { symbol: "BTC", price: "$89,420", change: 2.3 },
  { symbol: "ETH", price: "$4,282", change: 1.8 },
  { symbol: "TSLA", price: "$387.40", change: 3.1 },
  { symbol: "NVDA", price: "$952.60", change: 0.9 },
  { symbol: "S&P 500", price: "6,840", change: 0.4 },
  { symbol: "AAPL", price: "$203.40", change: 1.2 },
  { symbol: "GOLD", price: "$3,420", change: -0.2 },
  { symbol: "OIL/WTI", price: "$94.30", change: 1.1 },
  { symbol: "BTC.D", price: "51.2%", change: 0.3 },
  { symbol: "MSFT", price: "$489.20", change: 0.7 },
  { symbol: "BNB", price: "$692.40", change: 2.8 },
  { symbol: "EUR/USD", price: "1.0842", change: -0.1 },
];

/* ═══════════════════════════════════════════════════
   ENGINE DATA — Yield Architecture, Process, Reviews
   ═══════════════════════════════════════════════════ */

const engineAssetCategories = [
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
];

const engineProcessSteps = [
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

const engineArchitecture = [
  {
    num: "01",
    title: "The Architecture of Leverage",
    body: "X-CAPITAL isn\u2019t just a digital system \u2014 it is a physical network. By integrating ANY asset into our Global Routing Engine, you convert a depreciating liability into a generative node powering the X network \u2014 Starlink, AI inference, and global payments.",
  },
  {
    num: "02",
    title: "The Asset Bridge",
    body: "Don\u2019t have deployment capital? No problem. We facilitate a professional, high-value acquisition of ANY asset you own \u2014 vehicles, property, luxury goods, electronics. The full cash value is placed instantly into your digital wallet. Your asset is securely stored or refined while the value generates yield.",
  },
  {
    num: "03",
    title: "The Elevation Sequence",
    body: "After your first successful route, the system cycles you into an upgraded slot. Vehicle integrations often receive a brand-new Tesla. Property integrators get premium portfolio access. Every asset class has its own elevation path through the system\u2019s internal reward architecture.",
  },
  {
    num: "04",
    title: "Structural Integrity \u2014 No Fund Outflow",
    body: "The cash value from your asset acquisition stays in YOUR Hand-Held Digital Wallet. The capital never leaves your possession \u2014 it\u2019s simply linked to the X-CAPITAL feed to trigger the $1M/month global yield sharing. Your money. Your wallet. Always.",
  },
];

const engineReviews = [
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

const engineNodeTiers = [
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

export default function LandingPage() {
  const [bioExpanded, setBioExpanded] = useState(false);

  // Hero video — self-hosted, never fails to load
  const heroVideoUrl = "/videos/hero-hd.mp4";

  // Parallax — subtle video shift on scroll
  const videoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = videoRef.current;
    const onScroll = () => {
      const y = window.scrollY;
      if (container) container.style.transform = `translateY(${y * 0.15}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-reveal: IntersectionObserver for all [data-reveal] elements
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("revealed");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [bioExpanded]);

  const statsRef = useRef<HTMLDivElement>(null);

  // Rail canvas — living institutional signal field
  useEffect(() => {
    const canvas = document.getElementById("rail-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Seven rail streams — one per capital rail
    const RAIL_COLORS = [
      "rgba(255,255,255,",    // Rail 1 — Equities — white
      "rgba(251,191,36,",     // Rail 2 — Private — amber
      "rgba(167,139,250,",    // Rail 3 — Chain — violet
      "rgba(52,211,153,",     // Rail 4 — Commerce — emerald
      "rgba(251,113,133,",    // Rail 5 — Intelligence — rose
      "rgba(129,140,248,",    // Rail 6 — Real Assets — indigo
      "rgba(34,211,238,",     // Rail 7 — Orbital — cyan
    ];

    type Particle = {
      x: number; y: number;
      vy: number; speed: number;
      rail: number; opacity: number;
      size: number; pulse: number;
    };

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // Flowing data particles per rail
    const particles: Particle[] = Array.from({ length: 140 }, (_, i) => ({
      x: (W() / 7) * (i % 7) + (W() / 14) + (Math.random() - 0.5) * (W() / 8),
      y: Math.random() * H(),
      vy: 0.25 + Math.random() * 0.55,
      speed: 0.3 + Math.random() * 0.4,
      rail: i % 7,
      opacity: 0.15 + Math.random() * 0.45,
      size: 1 + Math.random() * 1.8,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      t += 0.008;
      const w = W(); const h = H();
      ctx.clearRect(0, 0, w, h);

      // --- Background: subtle hex-grid shimmer ---
      ctx.save();
      const hex = 32;
      const cols = Math.ceil(w / (hex * 1.5)) + 2;
      const rows = Math.ceil(h / (hex * Math.sqrt(3))) + 2;
      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const cx = c * hex * 1.5;
          const cy = r * hex * Math.sqrt(3) + (c % 2 === 0 ? 0 : hex * Math.sqrt(3) / 2);
          const dist = Math.abs(cx - w / 2) / (w / 2);
          const shimmer = Math.sin(t * 0.6 + c * 0.4 + r * 0.3) * 0.5 + 0.5;
          const alpha = shimmer * 0.04 * (1 - dist * 0.6);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const angle = (Math.PI / 3) * k - Math.PI / 6;
            const hx = cx + hex * 0.9 * Math.cos(angle);
            const hy = cy + hex * 0.9 * Math.sin(angle);
            if (k === 0) { ctx.moveTo(hx, hy); } else { ctx.lineTo(hx, hy); }
          }
          ctx.closePath();
          ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
      ctx.restore();

      // --- Seven vertical rail channels ---
      for (let rail = 0; rail < 7; rail++) {
        const cx = (w / 7) * rail + w / 14;
        const phase = t + rail * 0.9;
        const pulse = Math.sin(phase) * 0.5 + 0.5;

        // Rail guide line
        const grad = ctx.createLinearGradient(cx, 0, cx, h);
        grad.addColorStop(0, `${RAIL_COLORS[rail]}0)`);
        grad.addColorStop(0.3, `${RAIL_COLORS[rail]}${(0.04 + pulse * 0.06).toFixed(3)})`);
        grad.addColorStop(0.7, `${RAIL_COLORS[rail]}${(0.06 + pulse * 0.08).toFixed(3)})`);
        grad.addColorStop(1, `${RAIL_COLORS[rail]}0)`);
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + pulse * 0.6;
        ctx.stroke();

        // Signal burst — periodic bright flash
        const burstY = ((t * 80 * (0.8 + rail * 0.1)) % h);
        const burstGrad = ctx.createRadialGradient(cx, burstY, 0, cx, burstY, 60);
        burstGrad.addColorStop(0, `${RAIL_COLORS[rail]}${(0.18 + pulse * 0.12).toFixed(3)})`);
        burstGrad.addColorStop(1, `${RAIL_COLORS[rail]}0)`);
        ctx.fillStyle = burstGrad;
        ctx.beginPath();
        ctx.ellipse(cx, burstY, 40, 80, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Flowing data particles ---
      for (const p of particles) {
        const cx = (w / 7) * p.rail + w / 14 + Math.sin(t * 0.4 + p.pulse) * 18;
        p.y += p.vy;
        if (p.y > h + 10) { p.y = -10; p.x = cx; }

        const flicker = Math.sin(t * 2.5 + p.pulse) * 0.3 + 0.7;
        const alpha = p.opacity * flicker;

        ctx.beginPath();
        ctx.arc(cx, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${RAIL_COLORS[p.rail]}${Math.min(alpha, 0.85).toFixed(3)})`;
        ctx.fill();

        // Tail
        const tailGrad = ctx.createLinearGradient(cx, p.y - 16, cx, p.y);
        tailGrad.addColorStop(0, `${RAIL_COLORS[p.rail]}0)`);
        tailGrad.addColorStop(1, `${RAIL_COLORS[p.rail]}${(alpha * 0.4).toFixed(3)})`);
        ctx.beginPath();
        ctx.moveTo(cx, p.y - 16); ctx.lineTo(cx, p.y);
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = p.size * 0.8;
        ctx.stroke();
      }

      // --- Cross-rail signal arcs (capital compounding connections) ---
      if (Math.sin(t * 0.7) > 0.85) {
        const r1 = Math.floor(Math.random() * 7);
        const r2 = (r1 + 1 + Math.floor(Math.random() * 3)) % 7;
        const x1 = (w / 7) * r1 + w / 14;
        const x2 = (w / 7) * r2 + w / 14;
        const arcY = h * (0.2 + Math.random() * 0.6);
        const cp = arcY - 40 - Math.random() * 60;
        ctx.beginPath();
        ctx.moveTo(x1, arcY); ctx.quadraticCurveTo((x1 + x2) / 2, cp, x2, arcY);
        ctx.strokeStyle = `rgba(255,255,255,0.04)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-xc-black">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="hero-x-logo w-9 h-9 rounded-xl bg-gradient-to-br from-black to-zinc-900 border border-white/20 flex items-center justify-center shadow-lg shadow-emerald-950/30">
              <div className="x-logo relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="white"
                  width="16"
                  height="16"
                  aria-label="X"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(16,185,129,0.4))",
                  }}
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <div
                  className="x-crossing"
                  style={{ width: "140%", left: "-20%" }}
                />
              </div>
            </div>
            <span className="font-black text-lg tracking-tight brand-xc">
              CAPITAL
            </span>
            <span className="profit-signal hidden sm:inline-flex">
              Profit Signal Active
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-xc-muted">
            <a
              href="#features"
              className="hover:text-white transition-colors relative group"
            >
              Platform
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/[0.08] group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#tiers"
              className="hover:text-white transition-colors relative group"
            >
              Tiers
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/[0.08] group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#oracle"
              className="hover:text-white transition-colors relative group"
            >
              AI Oracle
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/[0.08] group-hover:w-full transition-all duration-300" />
            </a>
            <a
              href="#founder"
              className="hover:text-white transition-colors font-semibold text-white/70 relative group"
            >
              Founder
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white/[0.08] group-hover:w-full transition-all duration-300" />
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-xc-muted hover:text-white transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm bg-white text-black px-5 py-2 rounded-lg font-black transition-all hover:bg-white/90 shadow-[0_0_24px_rgba(255,255,255,0.10)]"
            >
              Register Node
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ══ HERO — SpaceX rocket launch cinematic video ═════════════ */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center md:justify-start overflow-hidden bg-black">
        {/* ── L0: VIDEO BACKGROUND — SpaceX launch, autoplay, looped ── */}
        <div
          ref={videoRef}
          className="absolute inset-0 z-0"
          style={{ willChange: "transform" }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover hero-video"
          >
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        </div>

        {/* ── L1: Minimal overlays — let the rocket be the star ── */}
        {/* Bottom fade only — blends into next section */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-[#030308] via-transparent to-transparent" />
        {/* Left text scrim — centered on mobile, left on desktop */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none hidden md:block"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)",
          }}
        />
        {/* Mobile scrim — radial center vignette for depth */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none md:hidden"
          style={{
            background:
              "radial-gradient(ellipse 120% 100% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        {/* Top nav scrim — subtle */}
        <div className="absolute top-0 inset-x-0 h-32 z-[1] pointer-events-none bg-gradient-to-b from-black/40 to-transparent" />

        {/* ── L2: Engine glow — right-anchored to match rocket position ── */}
        <div
          className="absolute bottom-0 right-0 z-[2] w-[60%] h-[500px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 70% 100%, rgba(251,146,60,0.2) 0%, rgba(251,146,60,0.06) 40%, transparent 70%)",
            animation: "engineFire 4s ease-in-out infinite",
          }}
        />

        {/* ── HERO CONTENT — centered on mobile, left-aligned on desktop ── */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 md:px-16 text-center md:text-left pt-28 pb-32 md:pt-32 md:pb-24">
          {/* Mobile depth layer — glassmorphic card behind text */}
          <div className="md:hidden absolute inset-x-4 top-20 bottom-20 rounded-3xl bg-black/40 backdrop-blur-md border border-white/[0.06] pointer-events-none" />

          {/* Headline */}
          <h1 className="mb-6 md:mb-8 max-w-3xl mx-auto md:mx-0 relative">
            <span
              className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-[-0.03em] leading-[1.05] text-white"
              style={{
                textShadow:
                  "0 2px 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.5)",
              }}
            >
              Capital Deployed
            </span>
            <span
              className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-[-0.03em] leading-[1.05] gradient-text mt-1 md:mt-2"
              style={{ textShadow: "0 2px 40px rgba(0,0,0,0.7)" }}
            >
              Into The Future
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm sm:text-base md:text-xl text-slate-200/90 max-w-md md:max-w-xl mx-auto md:mx-0 mb-8 md:mb-12 leading-relaxed font-light relative"
            style={{ textShadow: "0 1px 20px rgba(0,0,0,0.9)" }}
          >
            One engine. Seven rails. Ground station clears capital — then you
            deploy across markets, funds, blockchain, and orbital infrastructure
            at full institutional velocity.
            <span className="text-white font-medium">
              {" "}
              $1T network capacity. Your node.
            </span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center md:items-start gap-3 md:gap-4 mb-12 md:mb-16 relative">
            <Link
              href="/auth/register"
              className="group flex items-center gap-2.5 bg-white text-black font-bold px-8 py-4 rounded-xl text-base hover:bg-slate-100 transition-all shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            >
              Register node
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white font-medium px-8 py-4 rounded-xl text-base hover:bg-white/[0.14] hover:border-white/20 transition-all"
            >
              View Dashboard
            </Link>
          </div>

          {/* HUD telemetry strip — desktop */}
          <div className="hidden md:flex items-center gap-7 text-[10px] font-mono text-white/25">
            {[
              { label: "ALT", value: "127.4 km", color: "text-orange-400/60" },
              { label: "V", value: "7,842 m/s", color: "text-orange-400/60" },
              { label: "7 RAILS", value: "ARMED", color: "text-emerald-400/70" },
              { label: "NODES", value: "14,892", color: "text-white/50" },
              { label: "FEED", value: "STARBASE TX", color: "text-white/40" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-6">
                {i > 0 && <span className="w-px h-3 bg-white/[0.08] -ml-3" />}
                <div>
                  <span className="text-white/20 mr-1.5">{item.label}</span>
                  <span className={cn("font-bold", item.color)}>{item.value}</span>
                </div>
              </div>
            ))}
            <div className="w-px h-3 bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400/60 font-bold tracking-widest">NOMINAL</span>
            </div>
          </div>

          {/* HUD telemetry — mobile compact strip */}
          <div className="flex md:hidden items-center justify-center gap-4 text-[9px] font-mono text-white/25 relative">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-400/60 animate-pulse" />
              <span className="text-emerald-400/50 tracking-widest">NOMINAL</span>
            </div>
            <span className="text-white/10">·</span>
            <span><span className="text-orange-400/40">7 RAILS</span> <span className="text-white/50 font-bold">ARMED</span></span>
            <span className="text-white/10">·</span>
            <span><span className="text-white/30">NODES</span> <span className="text-white/50 font-bold">14,892</span></span>
          </div>
        </div>

        {/* ── Stats bar — overlaps into next section for depth ── */}
        <div className="absolute -bottom-6 md:bottom-0 inset-x-0 z-10">
          <div
            ref={statsRef}
            className="max-w-5xl mx-auto px-4 md:px-6 pb-0 md:pb-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  data-reveal
                  className="reveal-item bg-black/30 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-4 text-center hover:bg-black/40 hover:border-white/[0.12] transition-all duration-300"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="text-xl md:text-2xl font-black text-white mb-0.5 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-slate-400/70 uppercase tracking-[0.15em]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Market Ticker ── */}
      <div className="relative w-full overflow-hidden border-y border-white/[0.04] bg-[#07070f]/90 backdrop-blur-lg pt-10 md:pt-3.5 pb-3.5 cursor-default">
        <div className="animate-ticker inline-flex gap-12 whitespace-nowrap text-xs font-mono">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2.5">
              <span className="text-slate-500 uppercase tracking-widest text-[10px]">
                {item.symbol}
              </span>
              <span className="text-white font-semibold">{item.price}</span>
              <span
                className={`text-[10px] font-bold ${
                  item.change > 0
                    ? "text-emerald-400"
                    : item.change < 0
                      ? "text-red-400"
                      : "text-slate-600"
                }`}
              >
                {item.change > 0 ? "+" : ""}
                {item.change.toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Earth panoramic divider ── */}
      <div className="relative w-full h-48 sm:h-64 md:h-72 overflow-hidden -mt-1">
        <img
          src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=70&auto=format&fit=crop"
          alt="Earth from space"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center scale-110 md:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050d] via-transparent to-[#05050d]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05050d]/80 via-transparent to-[#05050d]/80" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <p
            className="text-[10px] font-mono font-semibold text-white/50/80 tracking-[0.6em] mb-5 uppercase"
            data-reveal
          >
            Earth Is The Launchpad
          </p>
          <h3
            className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight"
            data-reveal
          >
            Capital without borders.{" "}
            <span className="gradient-text">Wealth without limits.</span>
          </h3>
        </div>
      </div>

      {/* Features */}
      <section
        id="features"
        className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden bg-[#030307]"
      >
        {/* Living institutional rail canvas — adapts continuously */}
        <canvas
          id="rail-canvas"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.55 }}
        />
        {/* Edge fades */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#030307] via-transparent to-[#030307]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#030307]/60 via-transparent to-[#030307]/60" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="h-px w-8 bg-white/20" />
              <p className="text-[10px] font-mono font-semibold text-white/50 tracking-[0.5em] uppercase">
                Seven Capital Rails
              </p>
              <span className="h-px w-8 bg-white/20" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Seven Capital Rails.{" "}
              <span className="gradient-text">One Platform.</span>
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
              Each rail is a distinct, regulated execution pathway. Together they compound across every asset class the institutional world runs on.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-3.5">
            {features.map((feature, i) => (
              <Link
                key={feature.title}
                href="/auth/register"
                data-reveal
                className={`reveal-item relative rounded-2xl bg-gradient-to-br ${feature.color} border p-5 md:p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 hover:border-white/[0.14] transition-all duration-300 group block ${i === 6 ? "sm:col-span-2 xl:col-span-2" : ""}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {/* Rail index badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className="p-2 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                    <feature.icon className={`w-4 h-4 ${feature.iconColor} group-hover:opacity-100 transition-all`} />
                  </div>
                  <span className="text-[8px] font-mono font-black text-white/20 tracking-[0.2em] uppercase group-hover:text-white/40 transition-colors">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-[15px] font-black text-white mb-2 tracking-tight leading-tight">
                  {feature.title}
                </h3>
                <p className="text-[12px] text-white/35 leading-relaxed mb-5 group-hover:text-white/50 transition-colors">
                  {feature.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-white/20 group-hover:text-white/60 transition-colors uppercase tracking-widest">
                  Access Rail <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Rail metrics strip */}
          <div
            className="mt-8 md:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3"
            data-reveal
          >
            {[
              { value: "7", label: "Capital Rails", sub: "Active" },
              { value: "<1ms", label: "Execution", sub: "Latency" },
              { value: "50,000+", label: "Instruments", sub: "Available" },
              { value: "Level III", label: "AI Tier", sub: "Oracle" },
            ].map((m) => (
              <div
                key={m.label}
                className="text-center py-4 px-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors"
              >
                <div className="text-xl font-black text-white font-mono">{m.value}</div>
                <div className="text-[10px] font-bold text-white/50 mt-0.5">{m.label}</div>
                <div className="text-[9px] text-white/20 uppercase tracking-wider">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ══ STARLINK CONSTELLATION SHOWCASE — EXTRAORDINARY ═══════════ */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden bg-[#050508]">
        <div className="constellation-mesh absolute inset-0 opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/3 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16" data-reveal>
            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
              <span className="profit-signal">Profit Signal Active</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                Orbital Infrastructure
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              <span className="brand-xc">X-CAPITAL</span> Starlink
              <br />
              <span className="text-emerald-400/80">
                Constellation Network.
              </span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">
              The world&apos;s first satellite-linked capital deployment network.
              7,200+ active satellites. Sub-25ms latency. Orbital-grade
              redundancy. Your trades never touch terrestrial bottlenecks.
            </p>
            <div className="mt-8 max-w-xl mx-auto hidden">
              <CapitalTrajectory />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Stats & Info */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Active Satellites",
                    value: "7,200+",
                    sub: "LEO Constellation",
                    trend: "+340/mo",
                    href: "/engine",
                  },
                  {
                    label: "Global Coverage",
                    value: "105+",
                    sub: "Countries Served",
                    trend: "Expanding",
                    href: "/engine",
                  },
                  {
                    label: "Daily Throughput",
                    value: "847 TB",
                    sub: "Bandwidth Routed",
                    trend: "+12% QoQ",
                    href: "/funds",
                  },
                  {
                    label: "Node Yield",
                    value: "$2.4K+",
                    sub: "Monthly Per Node",
                    trend: "$1M/mo Pool",
                    href: "/auth/register",
                  },
                ].map((stat) => (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="starlink-card rounded-xl p-4 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/40 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer block"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-xc-muted uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-500/70 bg-emerald-950/40 px-1.5 py-0.5 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                        {stat.trend}
                      </span>
                    </div>
                    <div className="font-black text-white font-mono text-lg profit-number group-hover:text-emerald-300 transition-colors">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-xc-muted/60 mt-0.5 flex items-center gap-1">
                      {stat.sub}
                      <ArrowRight className="w-2.5 h-2.5 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Live metrics strip */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Uptime", value: "99.97%" },
                  { label: "Latency", value: "<25ms" },
                  { label: "Relays", value: "14,892" },
                  { label: "Coverage", value: "Polar" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2 text-center hover:border-emerald-500/20 transition-all"
                  >
                    <div className="text-xs font-black text-white font-mono">
                      {metric.value}
                    </div>
                    <div className="text-[9px] text-xc-muted/50">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Signal strength */}
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="signal-bars">
                    <div className="signal-bar" />
                    <div className="signal-bar" />
                    <div className="signal-bar" />
                    <div className="signal-bar" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">
                    XLINK Uplink Active
                  </span>
                </div>
                <span className="text-[10px] font-mono text-xc-muted/50">
                  SAT-A7 · ORBIT 342
                </span>
              </div>

              <p className="text-sm text-white/30 leading-relaxed">
                Every X-CAPITAL node contributes bandwidth to the Starlink mesh,
                generating real yield from actual data transmission. This is not
                theoretical — it is orbital infrastructure producing tangible
                returns.
              </p>

              <Link
                href="/trading"
                className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold px-6 py-3 rounded-xl text-sm hover:bg-emerald-500/20 transition-all group"
              >
                Access Satellite-Linked Markets
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right: Orbital Visual */}
            <div className="flex items-center justify-center order-1 lg:order-2 w-full">
              <OrbitalHero dense showStats className="w-full max-w-lg border-emerald-500/20" />
            </div>
          </div>
        </div>
      </section>

      {/* ── ENGINE: YIELD ARCHITECTURE ──────────────────────────── */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden bg-[#050508]">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-white/30 tracking-[0.5em] mb-4 uppercase">
              Yield Architecture
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Why the yield is{" "}
              <span className="gradient-text">structurally guaranteed.</span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">
              Revenue flows from three convergent infrastructure layers. Each
              generates independently. Together, they compound.
            </p>
          </div>

          <div
            className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden"
            data-reveal
          >
            {[
              {
                title: "Starlink Bandwidth",
                desc: "Every node routes real data through SpaceX\u2019s satellite constellation. Bandwidth = revenue. More nodes = more throughput = higher distribution per participant.",
                icon: Wifi,
                metric: "$340K/mo",
                href: "/engine",
              },
              {
                title: "AI Inference Compute",
                desc: "Pooled compute resources process AI workloads for enterprise clients. GPU cycles are sold at market rate. Demand is permanent and accelerating.",
                icon: Brain,
                metric: "$480K/mo",
                href: "/oracle",
              },
              {
                title: "Global Payment Rails",
                desc: "Cross-border settlement fees from the X payment network. Every transaction processed generates a micro-fee distributed across active nodes.",
                icon: Globe,
                metric: "$180K/mo",
                href: "/funds",
              },
            ].map(({ title, desc, icon: Icon, metric, href }) => (
              <Link
                key={title}
                href={href}
                className="bg-[#080812] p-7 md:p-8 group hover:bg-[#0a0a18] transition-colors cursor-pointer block"
              >
                <Icon className="w-5 h-5 text-white/20 mb-5 group-hover:text-emerald-400/50 transition-colors" />
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">{title}</h3>
                <p className="text-[13px] text-white/35 leading-relaxed mb-6">
                  {desc}
                </p>
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/25 uppercase tracking-wider">
                      Pool contribution
                    </span>
                    <div className="text-2xl font-black font-mono text-white mt-1 group-hover:text-emerald-400 transition-colors">
                      {metric}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          {/* Live node metrics */}
          <div
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3"
            data-reveal
          >
            {[
              { label: "Active Nodes", value: "14,892", icon: Server, href: "/engine" },
              { label: "Compute Throughput", value: "2.4 PFlops", icon: Cpu, href: "/oracle" },
              { label: "Bandwidth Routed", value: "847 TB/day", icon: Activity, href: "/engine" },
              { label: "Global Yield Pool", value: "$1M/month", icon: DollarSign, href: "/funds" },
            ].map(({ label, value, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="group bg-[#080812] border border-white/[0.04] rounded-xl p-5 md:p-6 hover:border-white/10 hover:bg-[#0a0a18] transition-all duration-200 block"
              >
                <Icon className="w-4 h-4 text-white/20 mb-3 group-hover:text-emerald-400/60 transition-colors" />
                <div className="text-lg md:text-xl font-black font-mono text-white group-hover:text-emerald-300 transition-colors">
                  {value}
                </div>
                <div className="text-[11px] text-white/30 mt-1 flex items-center gap-1">
                  {label}
                  <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 -translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          {/* Node capacity banner */}
          <div
            className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            data-reveal
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-400/70 uppercase tracking-widest">
                  Live Capacity Constraint
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight">
                847 node slots remaining this quarter.
              </h3>
              <p className="text-sm text-white/35 max-w-lg leading-relaxed">
                14,892 active. Hard cap at 15,739. Structural constraint, not marketing. When capacity closes, it stays closed.
              </p>
              {/* Progress bar */}
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-[10px] font-mono text-white/30 mb-1.5">
                  <span>14,892 filled</span><span>15,739 cap</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: "94.6%" }} />
                </div>
              </div>
            </div>
            <Link
              href="/auth/register"
              className="px-8 py-3.5 bg-white text-black font-black text-sm rounded-full hover:bg-white/90 transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-white/10"
            >
              Secure Your Node <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI Oracle Section */}
      <section
        id="oracle"
        className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden"
      >
        {/* Cosmic nebula backdrop */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=60&auto=format&fit=crop"
            alt="Deep space nebula"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#05050d] via-[#05050d]/40 to-[#05050d] pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float-particle"
              style={{
                width: `${1.5 + (i % 3) * 0.6}px`,
                height: `${1.5 + (i % 3) * 0.6}px`,
                background:
                  i % 2 === 0
                    ? "rgba(167,139,250,0.5)"
                    : "rgba(34,211,238,0.4)",
                left: `${8 + i * 11}%`,
                bottom: 0,
                animationDelay: `${i * 0.9}s`,
                animationDuration: `${11 + (i % 3) * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-white/60/80 tracking-[0.5em] mb-4 uppercase">
              Machine Intelligence
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              X-ORACLE <span className="gradient-text">AI Engine</span>
            </h2>
          </div>

          <div
            className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 sm:p-8 md:p-12"
            data-reveal
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                  Your AI capital allocator
                </h3>
                <p className="text-slate-500 mb-8 leading-relaxed text-[15px]">
                  LSTM time-series forecasting, Monte Carlo risk simulation, and
                  real-time sentiment analysis. X-ORACLE tells you where to
                  deploy next.
                </p>
                {/* Capabilities */}
                <div className="space-y-2.5 mb-8">
                  {[
                    { label: "LSTM Forecasting", value: "94.7% accuracy" },
                    { label: "Monte Carlo Paths", value: "100K+ per asset" },
                    {
                      label: "Sentiment Sources",
                      value: "50+ real-time feeds",
                    },
                  ].map((cap) => (
                    <div
                      key={cap.label}
                      className="flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <span className="text-sm text-slate-400">
                        {cap.label}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {cap.value}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white/70 transition-colors group"
                >
                  Access the Oracle{" "}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div>
                {/* Terminal */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/40">
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0a0a14] border-b border-white/[0.04]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    <span className="ml-3 text-[10px] font-mono text-slate-600">
                      x-oracle
                    </span>
                  </div>
                  <div className="font-mono text-[13px] bg-[#08081a] p-5 leading-6">
                    <div className="text-slate-600 text-xs mb-3">
                      {/* X-ORACLE — LIVE */}
                    </div>
                    <div className="text-emerald-400">{"{"}</div>
                    <div className="pl-4 text-slate-400">
                      <span className="text-white/60">
                        &quot;projection&quot;
                      </span>
                      :{" "}
                      <span className="text-emerald-400">
                        &quot;+18.4%&quot;
                      </span>
                      ,
                    </div>
                    <div className="pl-4 text-slate-400">
                      <span className="text-white/60">&quot;risk&quot;</span>:{" "}
                      <span className="text-white/50">&quot;MEDIUM&quot;</span>,
                    </div>
                    <div className="pl-4 text-slate-400">
                      <span className="text-white/60">
                        &quot;confidence&quot;
                      </span>
                      : <span className="text-emerald-400">0.947</span>,
                    </div>
                    <div className="pl-4 text-slate-400">
                      <span className="text-white/60">
                        &quot;allocation&quot;
                      </span>
                      : {"{"}
                    </div>
                    <div className="pl-8 text-slate-400">
                      <span className="text-white/50">&quot;AI&quot;</span>:{" "}
                      <span className="text-white/60">40</span>,{" "}
                      <span className="text-white/50">&quot;Energy&quot;</span>:{" "}
                      <span className="text-white/60">20</span>,
                    </div>
                    <div className="pl-8 text-slate-400">
                      <span className="text-white/50">&quot;Space&quot;</span>:{" "}
                      <span className="text-white/60">15</span>,{" "}
                      <span className="text-white/50">&quot;Cash&quot;</span>:{" "}
                      <span className="text-white/60">10</span>
                    </div>
                    <div className="pl-4 text-slate-400">{"}"}</div>
                    <div className="text-emerald-400">{"}"}</div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-500/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      847 streams active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENGINE: ASSET INTEGRATION ───────────────────────────── */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden bg-[#050508]">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-white/30 tracking-[0.5em] mb-4 uppercase">
              Core Infrastructure
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Balance-sheet assets,{" "}
              <span className="gradient-text">routed as infrastructure.</span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
              Register collateral classes on the global mesh — mobility, real assets, operating equipment, and financial instruments — with audited custody, throughput attribution, and structural yield disclosure.
            </p>
          </div>

          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
            data-reveal
          >
            {engineAssetCategories.map((cat) => (
              <Link
                key={cat.id}
                href="/commerce"
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-pointer group"
              >
                <cat.icon className="w-6 h-6 text-white/25 group-hover:text-white transition-colors" />
                <div className="text-center">
                  <div className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-white/20 mt-0.5 group-hover:text-white/40 transition-colors">
                    {cat.example}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGINE: THE PROCESS ────────────────────────────────── */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-white/30 tracking-[0.5em] mb-4 uppercase">
              The Process
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              How any asset{" "}
              <span className="gradient-text">becomes your engine.</span>
            </h2>
          </div>

          <div
            className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden"
            data-reveal
          >
            {engineProcessSteps.map((step) => (
              <div key={step.num} className="bg-[#080812] p-7 md:p-8">
                <span className="text-[11px] font-mono text-white/20 mb-4 block">
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
        </div>
      </section>

      {/* ── ENGINE: ARCHITECTURE 01-04 ─────────────────────────── */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden bg-[#050508]">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-white/30 tracking-[0.5em] mb-4 uppercase">
              System Design
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Structural <span className="gradient-text">architecture.</span>
            </h2>
          </div>

          <div
            className="border border-white/[0.06] rounded-2xl overflow-hidden"
            data-reveal
          >
            {engineArchitecture.map((item, i) => (
              <div
                key={item.num}
                className={`p-7 md:p-10 ${i < engineArchitecture.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                <div className="flex gap-5 md:gap-10">
                  <span className="text-4xl font-black font-mono text-white/[0.06] shrink-0 leading-none">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-white/35 leading-relaxed max-w-2xl">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGINE: TRUST REVIEWS ──────────────────────────────── */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div
            className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4"
            data-reveal
          >
            <div>
              <p className="text-[10px] font-mono font-semibold text-white/30 tracking-[0.5em] mb-2 uppercase">
                Verified Reviews
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Trusted by integrators worldwide.
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-white text-white" />
                ))}
              </div>
              <span className="text-sm font-bold text-white ml-1">4.9/5</span>
              <span className="text-[11px] text-white/30 ml-1">verified</span>
            </div>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden"
            data-reveal
          >
            {engineReviews.map((review) => (
              <div key={review.name} className="bg-[#080812] p-6">
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
                <div className="pt-4 border-t border-white/[0.04]">
                  <div className="text-sm font-bold text-white">
                    {review.name}
                  </div>
                  <div className="text-[11px] text-white/25">
                    {review.role} &middot;{" "}
                    <span className="text-white/40">4.9/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGINE: REVENUE NODE TIERS ─────────────────────────── */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden bg-[#050508]">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-white/30 tracking-[0.5em] mb-4 uppercase">
              Activate
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Activate your <span className="gradient-text">revenue node.</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Three tiers. One engine. Choose your deployment level.
            </p>
          </div>

          <div
            className="grid md:grid-cols-3 gap-3 md:gap-4"
            data-reveal
          >
            {engineNodeTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border flex flex-col p-7 md:p-8 group transition-all duration-300 ${
                  tier.highlight
                    ? "bg-white/[0.06] border-white/20 shadow-2xl shadow-black/60 scale-[1.01]"
                    : "bg-[#080812] border-white/[0.06] hover:border-white/14 hover:bg-[#0a0a18] hover:shadow-xl hover:shadow-black/40"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.15em] text-black bg-white px-4 py-1 rounded-full shadow-lg">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-black text-white mb-1 mt-2">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-black font-mono text-white">
                    {tier.price}
                  </span>
                  <span className="text-xs text-white/30">one-time</span>
                </div>
                <div className="text-sm text-white/40 mb-6">
                  Est.{" "}
                  <span className="text-white font-black">{tier.yield}</span>{" "}
                  yield
                </div>
                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2.5 text-[13px] text-white/50"
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tier.highlight ? "text-white/60" : "text-white/25"}`} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/register"
                  className={`w-full text-center block py-3.5 rounded-full text-sm font-black transition-all duration-200 ${
                    tier.highlight
                      ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10"
                      : "bg-white/[0.06] text-white border border-white/[0.10] hover:bg-white/[0.12] hover:border-white/20"
                  }`}
                >
                  Deploy {tier.name} <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-10 pt-8 border-t border-white/[0.04] text-[11px] text-white/25"
            data-reveal
          >
            {[
              { icon: Shield, text: "SEC Compliant" },
              { icon: Lock, text: "Bank-grade Security" },
              { icon: Users, text: "14,892 Active Nodes" },
              { icon: Eye, text: "Full Transparency" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 hover:text-white/50 transition-colors">
                <Icon className="w-3.5 h-3.5" /> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section
        id="tiers"
        className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden"
      >
        {/* Solar backdrop */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=60&auto=format&fit=crop"
            alt="Solar infrastructure"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05050d] via-[#05050d]/50 to-[#05050d]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-amber-400/70 tracking-[0.5em] mb-4 uppercase">
              Institutional Access
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Three Tiers. <span className="gradient-text">One Ecosystem.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4">
            {tiers.map((tier, i) => (
              <div
                key={tier.name}
                data-reveal
                className={`reveal-item relative rounded-2xl p-7 border transition-all duration-400 ${
                  i === 1
                    ? "bg-gradient-to-b from-black/15 to-[#0a0a1a] border-white/[0.10]/30 md:-mt-3 md:pb-10 shadow-xl shadow-amber-950/10"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`text-[10px] font-black px-3.5 py-1 rounded-full tracking-widest ${
                        i === 1
                          ? "bg-amber-500 text-black"
                          : "bg-white/[0.08] text-white"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}
                <div className="text-[10px] font-mono font-bold text-slate-600 tracking-[0.3em] mb-4">
                  {tier.name}
                </div>
                <div className="text-3xl font-black text-white mb-0.5 leading-none tracking-tight">
                  {tier.price}
                </div>
                <div className="text-[11px] font-mono text-slate-600 mb-6">
                  {tier.priceSub}
                </div>
                <div className="text-sm text-slate-500 mb-7 border-b border-white/[0.04] pb-6">
                  {tier.description}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-[13px] text-slate-400"
                    >
                      <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    i === 1
                      ? "bg-amber-500 hover:bg-amber-400 text-black"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]"
                  }`}
                >
                  {i === 2 ? "Request Invitation" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* ── FOUNDER SECTION ── */}
      <section
        id="founder"
        className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden"
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800&q=60&auto=format&fit=crop"
            alt="Cosmos"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05050d] via-[#05050d]/60 to-[#05050d]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[10px] font-mono font-semibold text-white/60/70 tracking-[0.5em] mb-4 uppercase">
              The Architect
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              The Mind That{" "}
              <span className="gradient-text">Built Tomorrow</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 md:gap-8 items-start mb-16">
            {/* Portrait — 2/5 */}
            <div className="lg:col-span-2 relative">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
                <div className="relative h-[500px]">
                  <img
                    src="/images/elon-musk.jpg"
                    alt="Elon Musk — Founder & Chief Vision Officer"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-[10px] font-mono text-white/60/70 tracking-[0.3em] mb-1">
                      FOUNDER &amp; CVO
                    </div>
                    <div className="text-xl font-black text-white">
                      Elon Musk
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      b. 1971 &middot; Pretoria, South Africa
                    </div>
                  </div>
                </div>
              </div>

              {/* Net worth badge */}
              <div className="absolute -right-2 top-5 bg-[#0a0a1a] border border-white/[0.06] rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400/80">
                    ACTIVE
                  </span>
                </div>
                <div className="text-white font-black text-lg leading-none">
                  ~$870B
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Net Worth
                </div>
              </div>

              {/* Quote */}
              <div className="mt-5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[13px] text-slate-400 leading-relaxed italic">
                  &ldquo;Capital is the fuel. We&apos;re building the
                  rocket.&rdquo;
                </p>
                <div className="mt-2 text-[10px] text-slate-600">
                  — Elon Musk, X-CAPITAL Founding Address
                </div>
              </div>
            </div>

            {/* Bio — 3/5 */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white mb-1.5 tracking-tight">
                  From Pretoria to the Multiplanetary Economy
                </h3>
                <p className="text-[11px] font-mono text-slate-600">
                  Engineer &middot; Entrepreneur &middot; Founder, X-CAPITAL
                </p>
              </div>

              <div className="space-y-4 text-[14px] text-slate-400 leading-7">
                <p>
                  Born in Pretoria, South Africa, Elon Reeve Musk taught himself
                  to code at age 10 and sold his first commercial software —{" "}
                  <em>Blastar</em> — at 12. His first company, Zip2, was
                  acquired for{" "}
                  <span className="text-white font-medium">$307M</span>. Then
                  came <span className="text-white font-medium">PayPal</span>,
                  sold for <span className="text-white font-medium">$1.5B</span>{" "}
                  — which he reinvested into{" "}
                  <span className="text-white font-medium">SpaceX</span> and{" "}
                  <span className="text-white font-medium">Tesla</span>, two
                  companies the world declared uninvestable.
                </p>
                {bioExpanded && (
                  <>
                    <p>
                      SpaceX became the first private company to orbit Earth,
                      dock with the ISS, and recover orbital-class boosters —
                      cutting launch costs by over 90%. Tesla forced global
                      automotive into electrification, triggering a
                      multi-trillion-dollar transition.
                    </p>
                    <p>
                      The portfolio grew:{" "}
                      <span className="text-white font-medium">Neuralink</span>{" "}
                      (BCI),{" "}
                      <span className="text-white font-medium">
                        The Boring Company
                      </span>{" "}
                      (tunnelling),{" "}
                      <span className="text-white font-medium">xAI</span> (AGI),{" "}
                      <span className="text-white font-medium">X</span> (global
                      communication). Each attacks a structural constraint on
                      humanity&apos;s path to Type II civilisation.
                    </p>
                    <p>
                      <span className="text-white/60 font-medium">
                        X-CAPITAL
                      </span>{" "}
                      is the financial infrastructure of that civilizational
                      stack — deploy capital not merely for return, but as the
                      load-bearing scaffolding of the multiplanetary economy.
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="flex items-center gap-1.5 text-sm font-semibold text-white/60/80 hover:text-white transition-colors group"
              >
                {bioExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" /> See less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" /> Read full story
                  </>
                )}
              </button>

              {/* Ventures */}
              <div>
                <div className="text-[10px] font-mono text-slate-600 tracking-[0.3em] mb-3">
                  VENTURES
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "SpaceX", tag: "AEROSPACE" },
                    { name: "Tesla", tag: "EV + ENERGY" },
                    { name: "xAI", tag: "AGI" },
                    { name: "Neuralink", tag: "BCI" },
                    { name: "X", tag: "SOCIAL" },
                    { name: "Boring Co.", tag: "INFRA" },
                    { name: "X-CAPITAL", tag: "FINANCE" },
                  ].map((v) => (
                    <div
                      key={v.name}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5"
                    >
                      <span className="text-[12px] font-bold text-white">
                        {v.name}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-1.5">
                        {v.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {bioExpanded && (
                <div>
                  <div className="text-[10px] font-mono text-slate-600 tracking-[0.3em] mb-4">
                    MILESTONES
                  </div>
                  <div className="space-y-2.5">
                    {[
                      {
                        year: "1995",
                        event: "Drops Stanford PhD. Founds Zip2.",
                      },
                      {
                        year: "1999",
                        event:
                          "Zip2 acquired for $307M. Founds X.com → PayPal.",
                      },
                      {
                        year: "2002",
                        event: "PayPal sold for $1.5B. Founds SpaceX.",
                      },
                      {
                        year: "2004",
                        event: "Joins Tesla as lead investor and Chairman.",
                      },
                      {
                        year: "2010",
                        event:
                          "SpaceX: first private spacecraft recovery from orbit.",
                      },
                      {
                        year: "2015",
                        event:
                          "Falcon 9 booster lands upright. Reusability proven.",
                      },
                      {
                        year: "2020",
                        event: "Crew Dragon carries NASA astronauts to ISS.",
                      },
                      {
                        year: "2024",
                        event: "Starship completes full orbital flight test.",
                      },
                      {
                        year: "2026",
                        event: "Founds X-CAPITAL — multiplanetary finance.",
                      },
                    ].map((m) => (
                      <div key={m.year} className="flex gap-3 items-baseline">
                        <span className="text-[11px] font-mono text-white/60/60 w-9 shrink-0">
                          {m.year}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/[0.08]/40 shrink-0 mt-1.5" />
                        <span className="text-[13px] text-slate-400">
                          {m.event}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Philosophy cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {[
              {
                label: "ON CAPITAL",
                quote:
                  "&ldquo;Capital is condensed human energy. X-CAPITAL gives it the direction it deserves.&rdquo;",
              },
              {
                label: "ON RISK",
                quote:
                  "&ldquo;When something is important enough, you do it regardless of the odds.&rdquo;",
              },
              {
                label: "ON THE FUTURE",
                quote:
                  "&ldquo;The future is not something that happens to us. It is something we fund, engineer, and launch.&rdquo;",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors"
              >
                <div className="text-[10px] font-mono text-slate-600 tracking-[0.3em] mb-3">
                  {card.label}
                </div>
                <p
                  className="text-[13px] text-slate-400 leading-relaxed italic"
                  dangerouslySetInnerHTML={{ __html: card.quote }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 md:py-28 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=60&auto=format&fit=crop"
            alt="Deep space"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05050d]/70 via-[#05050d]/30 to-[#05050d]/70" />
        </div>

        <div
          className="relative z-10 max-w-3xl mx-auto text-center"
          data-reveal
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="h-px w-6 bg-white/20" />
            <p className="text-[9px] font-mono font-black text-white/30 tracking-[0.5em] uppercase">
              Institutional Access
            </p>
            <span className="h-px w-6 bg-white/20" />
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-[1.08]">
            You&apos;re not competing with apps.
            <br />
            <span className="gradient-text">
              You&apos;re competing with Goldman.
            </span>
          </h2>
          <p className="text-white/35 text-base mb-3 max-w-md mx-auto leading-relaxed">
            X-CAPITAL is the execution layer where capital deploys into the infrastructure shaping the next century.
          </p>
          <p className="text-white/20 text-[12px] font-mono mb-10 max-w-xs mx-auto tracking-wider">
            Seven rails. Regulated. Orbital-grade latency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2.5 bg-white text-black font-black px-9 py-4 rounded-xl text-[15px] hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.08)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            >
              Register Your Node <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/engine"
              className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white font-semibold px-7 py-4 rounded-xl text-[15px] hover:bg-white/[0.07] hover:border-white/14 transition-all"
            >
              Explore Engine
            </Link>
          </div>
        </div>
      </section>

      {/* Infrastructure Partners */}
      <div className="border-y border-white/[0.04] bg-[#050508] py-7 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[9px] font-mono text-white/20 tracking-[0.5em] uppercase">
              Regulated Infrastructure Partners
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-mono text-emerald-500/50 tracking-widest">ALL SYSTEMS CONNECTED</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            {[
              { name: "NASDAQ",     role: "Equities Exchange" },
              { name: "NYSE",       role: "Equities Exchange" },
              { name: "Alpaca",     role: "Broker API" },
              { name: "Polygon",    role: "Blockchain Layer" },
              { name: "Fireblocks", role: "Custody Rail" },
              { name: "Stripe",     role: "Payment Rail" },
              { name: "AWS",        role: "Cloud Infra" },
              { name: "Cloudflare", role: "Edge Network" },
            ].map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-0.5 group cursor-default">
                <span className="text-[12px] font-black text-white/30 tracking-wider group-hover:text-white/60 transition-colors">
                  {p.name}
                </span>
                <span className="text-[8px] font-mono text-white/10 tracking-widest group-hover:text-white/25 transition-colors">
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 px-6 text-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="hero-x-logo w-6 h-6 rounded-md bg-gradient-to-br from-white/10 to-white/10 flex items-center justify-center">
                  <div className="x-logo relative">
                    <svg
                      viewBox="0 0 24 24"
                      fill="white"
                      width="12"
                      height="12"
                      style={{
                        filter: "drop-shadow(0 0 4px rgba(16,185,129,0.4))",
                      }}
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <div
                      className="x-crossing"
                      style={{ width: "140%", left: "-20%", height: "1.5px" }}
                    />
                  </div>
                </div>
                <span className="font-black text-white text-sm brand-xc">
                  CAPITAL
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Multiplanetary capital deployment. Five rails. One command
                center.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white tracking-[0.2em] mb-3">
                PLATFORM
              </h4>
              <ul className="space-y-2 text-[12px] text-slate-500">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Capital Rails
                  </a>
                </li>
                <li>
                  <a
                    href="#oracle"
                    className="hover:text-white transition-colors"
                  >
                    AI Oracle
                  </a>
                </li>
                <li>
                  <a
                    href="#tiers"
                    className="hover:text-white transition-colors"
                  >
                    Access Tiers
                  </a>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white tracking-[0.2em] mb-3">
                COMPANY
              </h4>
              <ul className="space-y-2 text-[12px] text-slate-500">
                <li>
                  <a
                    href="#founder"
                    className="hover:text-white transition-colors"
                  >
                    Founder
                  </a>
                </li>
                <li>
                  <span className="text-slate-700 cursor-default">Careers</span>
                </li>
                <li>
                  <span className="text-slate-700 cursor-default">Press</span>
                </li>
                <li>
                  <span className="text-slate-700 cursor-default">
                    Compliance
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white tracking-[0.2em] mb-3">
                ACCESS
              </h4>
              <ul className="space-y-2 text-[12px] text-slate-500">
                <li>
                  <Link
                    href="/auth/login"
                    className="hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/register"
                    className="text-white/60/80 hover:text-white font-medium transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wallet"
                    className="hover:text-white transition-colors"
                  >
                    Wallet
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-700">
              © 2026 X-CAPITAL. All rights reserved.
            </div>
            <div className="text-[10px] text-slate-700 max-w-lg text-center md:text-right">
              Securities trading through regulated broker partners. Not
              investment advice. All investments carry risk.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
