'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, TrendingUp, Zap, Star, Satellite, ShoppingBag } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  imageAlt?: string;
  description: string;
  specs?: Record<string, string>;
  highlights?: string[];
  features?: string[];
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

/* ── per-category accent ─────────────────────────────────────────────── */
const CAT = {
  EV:        { accent: 'text-red-400',    border: 'hover:border-red-500/30',    tag: 'bg-red-500/10 text-red-300 border-red-500/20',    glow: 'hover:shadow-red-950/50'    },
  SPACE:     { accent: 'text-indigo-400', border: 'hover:border-indigo-500/30', tag: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20', glow: 'hover:shadow-indigo-950/50' },
  AI:        { accent: 'text-violet-400', border: 'hover:border-violet-500/30', tag: 'bg-violet-500/10 text-violet-300 border-violet-500/20', glow: 'hover:shadow-violet-950/50'  },
  COMPUTING: { accent: 'text-blue-400',   border: 'hover:border-blue-500/30',   tag: 'bg-blue-500/10 text-blue-300 border-blue-500/20',   glow: 'hover:shadow-blue-950/50'   },
  ENERGY:    { accent: 'text-amber-400',  border: 'hover:border-amber-500/30',  tag: 'bg-amber-500/10 text-amber-300 border-amber-500/20', glow: 'hover:shadow-amber-950/50'  },
  DEFAULT:   { accent: 'text-white/50',   border: 'hover:border-white/20',      tag: 'bg-white/5 text-white/50 border-white/10',          glow: 'hover:shadow-black/60'      },
} as const;

function catCfg(cat: string) {
  return CAT[cat as keyof typeof CAT] ?? CAT.DEFAULT;
}

function CatIcon({ category }: { category: string }) {
  const cls = 'w-3 h-3';
  if (category === 'EV') return <Zap className={cls} />;
  if (category === 'SPACE') return <Satellite className={cls} />;
  if (category === 'AI' || category === 'COMPUTING') return <Star className={cls} />;
  return <ShoppingBag className={cls} />;
}

/* ── hero image ─────────────────────────────────────────────────────── */
function ProductHero({ product }: { product: Product }) {
  const [err, setErr] = useState(false);
  const cfg = catCfg(product.category);

  if (product.imageUrl && !err) {
    return (
      <div className="relative w-full h-56 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setErr(true)}
          priority={false}
          unoptimized
        />
        {/* cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        {/* bottom vignette intensity */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>
    );
  }

  const Icon =
    product.category === 'EV' ? Zap :
    product.category === 'SPACE' ? Satellite :
    product.category === 'AI' || product.category === 'COMPUTING' ? Star : ShoppingBag;

  return (
    <div className="w-full h-56 flex items-center justify-center bg-gradient-to-br from-black to-[#0a0a12] relative overflow-hidden">
      <div className={cn('w-24 h-24 rounded-2xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06]')}>
        <Icon className={cn('w-10 h-10', cfg.accent)} strokeWidth={1} />
      </div>
    </div>
  );
}

export default function ProductCard({ product, onCheckout }: ProductCardProps) {
  const cfg = catCfg(product.category);

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080810]',
        'transition-all duration-300 hover:-translate-y-1.5',
        'hover:shadow-2xl hover:border-white/[0.12]',
        cfg.border,
        cfg.glow,
      )}
    >
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative">
        <ProductHero product={product} />

        {/* badge top-left */}
        {product.badge && (
          <span className={cn(
            'absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase',
            'bg-black/60 backdrop-blur-sm border border-white/10 text-white',
          )}>
            {product.badge}
          </span>
        )}

        {/* category top-right */}
        <span className={cn(
          'absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-sm border',
          cfg.tag,
        )}>
          <CatIcon category={product.category} />
          {product.category}
        </span>

        {/* price overlaid at bottom of image */}
        <div className="absolute bottom-3 right-4 z-10">
          <span className="font-black font-mono text-white text-xl tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
            {formatCurrency(product.price)}
          </span>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-5">
        {/* name + tagline */}
        <div className="mb-3">
          <h3 className="font-black text-white text-[15px] leading-snug tracking-tight mb-0.5">
            {product.name}
          </h3>
          {product.tagline && (
            <p className={cn('text-[11px] font-bold tracking-wide', cfg.accent)}>{product.tagline}</p>
          )}
        </div>

        {/* description */}
        <p className="text-[12px] text-white/40 leading-relaxed mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* specs grid */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="grid grid-cols-3 gap-x-3 gap-y-2.5 mb-4 bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
            {Object.entries(product.specs).slice(0, 6).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <div className="text-[8px] uppercase tracking-widest text-white/25 font-semibold leading-none mb-0.5">{k}</div>
                <div className="text-[11px] font-black text-white leading-tight">{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* feature badges */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.features.slice(0, 4).map((f) => (
              <span key={f} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40 tracking-wide">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* investment bundle strip */}
        {product.investmentSuggestion && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/20 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="text-[11px] text-emerald-300/80 leading-tight">
              <span className="font-bold text-emerald-300">{formatCurrency(product.investmentSuggestion.amount)}</span>
              {' auto-invested in '}
              <span className="font-bold text-white">${product.investmentSuggestion.symbol}</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          <button
            onClick={() => onCheckout(product)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[13px] tracking-wide transition-all duration-200',
              'bg-white text-black hover:bg-white/90 hover:shadow-lg hover:shadow-white/10',
            )}
          >
            Buy + Invest
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
