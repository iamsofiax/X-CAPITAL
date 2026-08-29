"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Lock,
  TrendingUp,
  Users,
  Shield,
  Rocket,
  Cpu,
  Zap,
  Gem,
} from "lucide-react";
import type { Investment } from "@/types";

/* ── per-risk config ──────────────────────────────────────────────────────── */
const RISK_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  LOW: { label: "Low Risk", variant: "success" },
  MEDIUM: { label: "Med Risk", variant: "warning" },
  HIGH: { label: "High Risk", variant: "danger" },
};

/* ── per-category visual config ─────────────────────────────────────────── */
const CAT_CONFIG: Record<
  string,
  {
    grad: string;
    border: string;
    glow: string;
    icon: ReactNode;
    emoji: string;
    headerBg: string;
    imageUrl?: string;
  }
> = {
  SPACE: {
    grad: "from-zinc-950/80 via-xc-card to-xc-card",
    border: "hover:border-indigo-500/50",
    glow: "hover:shadow-indigo-900/30",
    icon: <Rocket className="w-4 h-4 text-indigo-300" />,
    emoji: "\u{1F680}",
    headerBg: "from-zinc-950 to-black",
    imageUrl:
      "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=640&q=70&auto=format&fit=crop",
  },
  AI: {
    grad: "from-black via-xc-card to-xc-card",
    border: "hover:border-white/[0.10]/50",
    glow: "hover:shadow-black/50/30",
    icon: <Cpu className="w-4 h-4 text-white/70" />,
    emoji: "\u{1F916}",
    headerBg: "from-black to-zinc-950",
    imageUrl:
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=640&q=70&auto=format&fit=crop",
  },
  ENERGY: {
    grad: "from-black/70 via-xc-card to-xc-card",
    border: "hover:border-white/[0.10]/50",
    glow: "hover:shadow-black/50/30",
    icon: <Zap className="w-4 h-4 text-amber-300" />,
    emoji: "\u{26A1}",
    headerBg: "from-black to-green-950",
    imageUrl:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=640&q=70&auto=format&fit=crop",
  },
  VENTURE: {
    grad: "from-blue-950/70 via-xc-card to-xc-card",
    border: "hover:border-blue-500/50",
    glow: "hover:shadow-blue-900/30",
    icon: <Gem className="w-4 h-4 text-blue-300" />,
    emoji: "\u{1F48E}",
    headerBg: "from-blue-950 to-xc-dark",
    imageUrl:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=640&q=70&auto=format&fit=crop",
  },
  DEFAULT: {
    grad: "from-xc-dark to-xc-card",
    border: "hover:border-xc-purple/40",
    glow: "hover:shadow-black/50/20",
    icon: <TrendingUp className="w-4 h-4 text-xc-muted" />,
    emoji: "\u{1F4C8}",
    headerBg: "from-xc-dark to-xc-card",
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=640&q=70&auto=format&fit=crop",
  },
};

interface FundCardProps {
  fund: Investment;
  onInvest: (fund: Investment) => void;
}

export default function FundCard({ fund, onInvest }: FundCardProps) {
  const [imgError, setImgError] = useState(false);
  const risk =
    RISK_CONFIG[fund.riskLevel?.toUpperCase() ?? "MEDIUM"] ??
    RISK_CONFIG.MEDIUM;
  const cat =
    CAT_CONFIG[fund.category?.toUpperCase() ?? "DEFAULT"] ?? CAT_CONFIG.DEFAULT;
  const pctFull = fund.maxCapacity
    ? Math.min((Number(fund.currentAUM) / Number(fund.maxCapacity)) * 100, 100)
    : 60;

  // days remaining until lock end (or 'Matured')
  const lockDaysLabel =
    fund.lockPeriodDays != null ? `${fund.lockPeriodDays}d lock` : "Flexible";

  return (
    <div
      className={cn(
        "bg-gradient-to-b rounded-2xl border border-xc-border overflow-hidden flex flex-col h-full",
        "transition-all duration-300 group",
        cat.grad,
        cat.border,
        cat.glow,
        "hover:shadow-xl",
      )}
    >
      {/* ── Hero image header ────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative h-28 md:h-36 overflow-hidden bg-gradient-to-br",
          cat.headerBg,
        )}
      >
        {cat.imageUrl && !imgError ? (
          <>
            <Image
              src={cat.imageUrl}
              alt={fund.name}
              fill
              sizes="400px"
              className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
              onError={() => setImgError(true)}
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          </>
        ) : (
          /* emoji fallback in header */
          <div className="absolute inset-0 flex items-center justify-center text-sm font-mono tracking-[0.2em] text-white/25 uppercase">
            {fund.category ?? "FUND"}
          </div>
        )}

        {/* overlay: category icon + badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm">
          {cat.icon}
          <span className="text-xs font-bold text-white">
            {fund.category ?? "FUND"}
          </span>
        </div>
        {!fund.isOpen && (
          <div className="absolute top-3 right-3">
            <Badge variant="warning" size="sm">
              Closed
            </Badge>
          </div>
        )}

        {/* bottom gradient text area (fund name) */}
        <div className="absolute bottom-0 inset-x-0 px-4 pb-3">
          <h3 className="font-black text-white text-base leading-tight group-hover:text-white/70 transition-colors drop-shadow-lg">
            {fund.name}
          </h3>
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      {fund.description && (
        <div className="px-3 md:px-5 pt-3 md:pt-4 pb-2">
          <p className="text-xs text-xc-muted leading-relaxed line-clamp-2">
            {fund.description}
          </p>
        </div>
      )}

      {/* ── Risk + lock badges ───────────────────────────────────────────── */}
      <div className="px-3 md:px-5 pt-2 pb-3 flex items-center gap-2">
        <Badge variant={risk.variant} size="sm">
          {risk.label}
        </Badge>
        <span className="text-[10px] font-bold text-xc-muted bg-white/5 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" /> {lockDaysLabel}
        </span>
      </div>

      {/* ── Metrics grid ─────────────────────────────────────────────────── */}
      <div className="mx-3 md:mx-5 mb-3 md:mb-4 grid grid-cols-2 gap-2 md:gap-3 bg-black/20 rounded-xl px-3 md:px-4 py-2.5 md:py-3 border border-white/5">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-xc-muted font-semibold flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-2.5 h-2.5" /> Target Return
          </div>
          <div className="font-black text-xc-green text-base md:text-lg font-mono leading-none">
            {formatPercent(Number(fund.targetReturn))}
            <span className="text-[10px] font-normal text-xc-muted"> /yr</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-xc-muted font-semibold flex items-center gap-1 mb-0.5">
            <Shield className="w-2.5 h-2.5" /> Min Investment
          </div>
          <div className="font-black text-white font-mono text-sm leading-none">
            {formatCurrency(Number(fund.minInvestment))}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-xc-muted font-semibold flex items-center gap-1 mb-0.5">
            <Users className="w-2.5 h-2.5" /> AUM
          </div>
          <div className="font-black text-white font-mono text-sm tabular-nums leading-none">
            {Number(fund.currentAUM) >= 1_000_000
              ? `$${(Number(fund.currentAUM) / 1_000_000).toFixed(1)}M`
              : formatCurrency(Number(fund.currentAUM))}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-xc-muted font-semibold flex items-center gap-1 mb-0.5">
            <Lock className="w-2.5 h-2.5" /> Lock Period
          </div>
          <div className="font-bold text-white text-sm">
            {fund.lockPeriodDays ? `${fund.lockPeriodDays} days` : "—"}
          </div>
        </div>
      </div>

      {/* ── Capacity bar ─────────────────────────────────────────────────── */}
      <div className="px-3 md:px-5 pb-3 md:pb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-xc-muted">Capacity filled</span>
          <span className="font-mono font-bold text-white">
            {pctFull.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-white/20 via-white/10 to-xc-green transition-all duration-700"
            style={{ width: `${pctFull}%` }}
          />
        </div>
        {pctFull >= 80 && (
          <p className="text-[10px] text-white/50 mt-1 font-semibold">
            ⚠ Near capacity — act soon
          </p>
        )}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="px-3 md:px-5 pb-4 md:pb-5 mt-auto">
        <Button
          variant={fund.isOpen ? "primary" : "secondary"}
          fullWidth
          onClick={() => onInvest(fund)}
          disabled={!fund.isOpen}
          icon={cat.icon}
        >
          {fund.isOpen ? "Invest Now" : "Join Waitlist"}
        </Button>
      </div>
    </div>
  );
}
