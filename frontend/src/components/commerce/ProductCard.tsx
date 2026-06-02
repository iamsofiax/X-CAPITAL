'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, TrendingUp, Zap, Star, ChevronRight, Rocket } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;            // high-res hero image
  imageAlt?: string;
  description: string;
  specs?: Record<string, string>;   // key-value spec table (e.g. Range: "358 mi")
  highlights?: string[];            // short bullet points shown under image
  features?: string[];              // feature badges (e.g. ["Autopilot", "FSD Ready"])
  investmentSuggestion?: {
    symbol: string;
    name: string;
    percentage: number;
    amount: number;
  };
  affiliateUrl?: string;
  badge?: string;
  tagline?: string;
}

interface ProductCardProps {
  product: Product;
  onCheckout: (product: Product) => void;
}

/* ── per-category visual config ─────────────────────────────────────────── */
const CAT_CONFIG: Record<string, { grad: string; glow: string; accent: string; overlayGrad: string }> = {
  EV: {
    grad: 'from-red-950/80 via-xc-card to-xc-card',
    glow: 'hover:shadow-red-900/30',
    accent: 'bg-red-500/20 text-red-300 border-red-600/30',
    overlayGrad: 'from-red-950/70 to-transparent',
  },
  SPACE: {
    grad: 'from-zinc-950/80 via-xc-card to-xc-card',
    glow: 'hover:shadow-indigo-900/30',
    accent: 'bg-indigo-500/20 text-indigo-300 border-indigo-600/30',
    overlayGrad: 'from-zinc-950/75 to-transparent',
  },
  AI: {
    grad: 'from-black via-xc-card to-xc-card',
    glow: 'hover:shadow-black/50/30',
    accent: 'bg-xc-purple/20 text-white/70 border-white/[0.10]/30',
    overlayGrad: 'from-black/90 to-transparent',
  },
  COMPUTING: {
    grad: 'from-blue-950/80 via-xc-card to-xc-card',
    glow: 'hover:shadow-blue-900/30',
    accent: 'bg-blue-500/20 text-blue-300 border-blue-600/30',
    overlayGrad: 'from-blue-950/75 to-transparent',
  },
  ENERGY: {
    grad: 'from-black/70 via-xc-card to-xc-card',
    glow: 'hover:shadow-black/50/30',
    accent: 'bg-amber-500/20 text-amber-300 border-white/[0.10]/30',
    overlayGrad: 'from-black/75 to-transparent',
  },
  DEFAULT: {
    grad: 'from-xc-dark to-xc-card',
    glow: 'hover:shadow-black/50/20',
    accent: 'bg-xc-purple/20 text-white/70 border-white/[0.10]/30',
    overlayGrad: 'from-xc-dark/80 to-transparent',
  },
};

/* ── category icon ────────────────────────────────────────────────────────── */
function CategoryIcon({ category }: { category: string }) {
  if (category === 'EV') return <Zap className="w-3 h-3" />;
  if (category === 'SPACE') return <Rocket className="w-3 h-3" />;
  if (category === 'AI' || category === 'COMPUTING') return <Star className="w-3 h-3" />;
  return <ChevronRight className="w-3 h-3" />;
}

/* ── hero image with graceful emoji fallback ─────────────────────────────── */
function ProductHero({ product, overlayGrad }: { product: Product; overlayGrad: string }) {
  const [imgError, setImgError] = useState(false);

  if (product.imageUrl && !imgError) {
    return (
      <div className="relative w-full h-52 overflow-hidden bg-xc-dark">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized={false}
          priority={false}
        />
        {/* bottom gradient bleed so card background looks seamless */}
        <div className={cn('absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t', overlayGrad)} />
        {/* top scrim for badges */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
      </div>
    );
  }

  /* category icon fallback — no emoji strings */
  const Icon =
    product.category === "EV"
      ? Zap
      : product.category === "SPACE"
        ? Rocket
        : product.category === "AI" || product.category === "COMPUTING"
          ? Star
          : ShoppingCart;

  return (
    <div
      className={cn(
        "w-full h-40 flex flex-col items-center justify-center relative overflow-hidden",
        "bg-gradient-to-br from-black/80 to-xc-card",
      )}
    >
      <Icon className="w-16 h-16 text-white/20 group-hover:text-white/30 transition-colors" strokeWidth={1} />
      <span className="engine-mono text-[10px] text-white/25 mt-3 uppercase tracking-widest">
        {product.category}
      </span>
    </div>
  );
}

export default function ProductCard({ product, onCheckout }: ProductCardProps) {
  const cat = CAT_CONFIG[product.category] ?? CAT_CONFIG.DEFAULT;

  return (
    <div className={cn(
      'bg-gradient-to-b rounded-2xl border border-xc-border overflow-hidden flex flex-col',
      'transition-all duration-300 hover:border-xc-purple/50',
      'hover:shadow-xl group relative',
      cat.grad,
      cat.glow,
    )}>

      {/* ── Badges overlaid on hero ──────────────────────────────────────── */}
      <div className="relative">
        <ProductHero product={product} overlayGrad={cat.overlayGrad} />

        {/* top-left: product badge */}
        {product.badge && (
          <span className={cn(
            'absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-xs font-black',
            'border backdrop-blur-sm',
            cat.accent,
          )}>
            {product.badge}
          </span>
        )}

        {/* top-right: category tag */}
        <span className={cn(
          'absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
          'border backdrop-blur-sm',
          cat.accent,
        )}>
          <CategoryIcon category={product.category} />
          {product.category}
        </span>
      </div>

      {/* ── Product name + tagline ───────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3">
        <h3 className="font-black text-white text-base leading-tight group-hover:text-white/70 transition-colors">
          {product.name}
        </h3>
        {product.tagline && (
          <p className="text-xs font-semibold text-white/70 mt-0.5">{product.tagline}</p>
        )}
        <p className="text-xs text-xc-muted mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
      </div>

      {/* ── Feature badges ───────────────────────────────────────────────── */}
      {product.features && product.features.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {product.features.map((f) => (
            <span key={f} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xc-muted">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* ── Specs grid ───────────────────────────────────────────────────── */}
      {product.specs && Object.keys(product.specs).length > 0 && (
        <div className="mx-5 mb-3 grid grid-cols-2 gap-x-4 gap-y-2 bg-black/20 rounded-xl px-4 py-3 border border-white/5">
          {Object.entries(product.specs).map(([k, v]) => (
            <div key={k}>
              <div className="text-[9px] uppercase tracking-widest text-xc-muted font-semibold">{k}</div>
              <div className="text-xs font-black text-white mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Price ────────────────────────────────────────────────────────── */}
      <div className="px-5 pb-3 border-b border-white/5">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-black font-mono text-white">{formatCurrency(product.price)}</span>
          {product.investmentSuggestion && (
            <span className="text-xs font-bold text-xc-green">
              +{product.investmentSuggestion.percentage}% invested
            </span>
          )}
        </div>
      </div>

      {/* ── Investment bundle ────────────────────────────────────────────── */}
      {product.investmentSuggestion && (
        <div className="px-5 py-3 bg-emerald-950/20 border-b border-emerald-900/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-xc-green flex-shrink-0" />
            <span className="text-xs font-bold text-xc-green">Commerce ↔ Investment Bundle</span>
          </div>
          <p className="text-xs text-xc-muted leading-relaxed">
            Auto-invest{' '}
            <span className="text-white font-semibold">{formatCurrency(product.investmentSuggestion.amount)}</span>
            {' '}in{' '}
            <span className="text-white/70 font-semibold">
              ${product.investmentSuggestion.symbol} — {product.investmentSuggestion.name}
            </span>
            {' '}simultaneously.
          </p>
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 mt-auto">
        <Button
          variant="primary"
          fullWidth
          onClick={() => onCheckout(product)}
          icon={<ShoppingCart className="w-4 h-4" />}
          className="font-black tracking-wide"
        >
          Buy + Invest
        </Button>
      </div>
    </div>
  );
}
