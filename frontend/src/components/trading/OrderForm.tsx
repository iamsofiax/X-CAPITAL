"use client";

import { useState, useEffect } from "react";
import { tradingAPI } from "@/lib/api";
import { emitCapitalSignal } from "@/lib/capitalSignal";
import { formatCurrency, cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Zap,
  Clock,
  Shield,
  Sparkles,
} from "lucide-react";
import type { Asset } from "@/types";
import { useStore, type PendingTransaction } from "@/store/useStore";

type OrderSide = "buy" | "sell";

interface OrderFormProps {
  asset?: Asset | null;
}

export default function OrderForm({ asset }: OrderFormProps) {
  const { wallet, user, addPendingTransaction, addAdminAlert } = useStore();
  const [side, setSide] = useState<OrderSide>("buy");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState("");
  const [inputMode, setInputMode] = useState<"amount" | "qty">("amount");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Derived
  const price = Number(asset?.price ?? 0);
  const parsedAmount = parseFloat(amount) || 0;
  const parsedQty = parseFloat(qty) || 0;
  const estimatedQty =
    inputMode === "amount" ? (price > 0 ? parsedAmount / price : 0) : parsedQty;
  const estimatedCost = inputMode === "qty" ? parsedQty * price : parsedAmount;
  const availableCash = Number(wallet?.fiatBalance ?? 0);
  const hasSufficientFunds =
    side === "buy" ? estimatedCost <= availableCash : true;

  useEffect(() => {
    setAmount("");
    setQty("");
    setMessage(null);
    setShowCelebration(false);
  }, [asset?.symbol, side]);

  const handleQuickAmount = (pct: number) => {
    const val = (availableCash * pct).toFixed(2);
    setAmount(val);
    setInputMode("amount");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setLoading(true);
    setMessage(null);
    try {
      if (side === "buy") {
        const tx: PendingTransaction = {
          id: `ptx-trade-${Date.now()}`,
          userId: user?.id || "unknown",
          userEmail: user?.email || "unknown",
          userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          type: "FUND_INVEST",
          method: "fund",
          amount: estimatedCost,
          currency: "USD",
          details: {
            assetId: asset.id,
            symbol: asset.symbol,
            assetName: asset.name,
            qty: estimatedQty.toFixed(6),
            side: "BUY",
            note: "Trading buy order awaiting admin clearance",
          },
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };
        await emitCapitalSignal({ tx, addPendingTransaction, addAdminAlert });
      } else {
        await tradingAPI.sell(asset.id, estimatedQty);
      }
      setShowCelebration(true);
      setMessage({
        type: "success",
        text:
          side === "buy"
            ? `Buy signal queued for admin approval (${estimatedQty.toFixed(4)} ${asset.symbol})`
            : `Sell order placed for ${estimatedQty.toFixed(4)} ${asset.symbol}`,
      });
      setAmount("");
      setQty("");
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ?? "Order failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10 md:py-20">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3 md:mb-4">
          <TrendingUp className="w-7 h-7 text-xc-muted" />
        </div>
        <p className="text-xc-muted text-sm">
          Select an asset to start trading
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4">
      {/* Asset header */}
      <div className="flex items-center gap-2 md:gap-3 pb-2 md:pb-3 border-b border-xc-border">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-white/[0.06] to-white/[0.03] flex items-center justify-center text-sm font-black text-white">
          {asset.symbol?.[0] ?? "?"}
        </div>
        <div>
          <div className="font-bold text-white">{asset.symbol}</div>
          <div className="text-xs text-xc-muted">{asset.name}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-mono font-bold text-white price-shimmer">
            {formatCurrency(price)}
          </div>
          <div
            className={cn(
              "text-xs font-semibold flex items-center gap-0.5 justify-end",
              Number(asset.priceChange24h) >= 0
                ? "text-emerald-400"
                : "text-red-400",
            )}
          >
            {Number(asset.priceChange24h) >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Number(asset.priceChange24h) >= 0 ? "+" : ""}
            {Number(asset.priceChange24h).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Urgency nudge */}
      {Number(asset.priceChange24h) > 2 && side === "buy" && (
        <div className="flex items-center gap-2 text-[10px] bg-emerald-950/30 border border-emerald-700/30 rounded-lg px-3 py-2 signal-flash-green">
          <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-semibold">
            {asset.symbol} is up {Number(asset.priceChange24h).toFixed(1)}%
            today — momentum is building
          </span>
        </div>
      )}

      {/* Buy/Sell switch */}
      <div className="flex rounded-xl overflow-hidden border border-xc-border">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5",
            side === "buy"
              ? "bg-emerald-500/20 text-emerald-400 border-r border-xc-border"
              : "text-xc-muted hover:text-white",
          )}
        >
          <TrendingUp className="w-4 h-4" /> Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5",
            side === "sell"
              ? "bg-red-500/20 text-red-400"
              : "text-xc-muted hover:text-white",
          )}
        >
          <TrendingDown className="w-4 h-4" /> Sell
        </button>
      </div>

      {/* Input mode toggle */}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setInputMode("amount")}
          className={cn(
            "px-3 py-1 rounded-lg transition-all",
            inputMode === "amount"
              ? "bg-xc-purple/30 text-white"
              : "text-xc-muted hover:text-white",
          )}
        >
          In USD
        </button>
        <button
          type="button"
          onClick={() => setInputMode("qty")}
          className={cn(
            "px-3 py-1 rounded-lg transition-all",
            inputMode === "qty"
              ? "bg-xc-purple/30 text-white"
              : "text-xc-muted hover:text-white",
          )}
        >
          In {asset.symbol}
        </button>
      </div>

      {/* Amount input */}
      {inputMode === "amount" ? (
        <div>
          <label className="block text-xs font-medium text-xc-muted mb-1.5">
            Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xc-muted font-mono">
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
              className="w-full bg-xc-dark/60 border border-xc-border rounded-xl pl-7 pr-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-xc-purple/60 transition-colors"
            />
          </div>
          {side === "buy" && (
            <div className="flex gap-2 mt-2">
              {[
                { pct: 0.25, label: "25%" },
                { pct: 0.5, label: "50%" },
                { pct: 0.75, label: "75%" },
                { pct: 1.0, label: "MAX" },
              ].map(({ pct, label }) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickAmount(pct)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                    pct === 1.0
                      ? "bg-white/[0.04]/40 hover:bg-white/[0.04]/60 text-white/70 hover:text-white border border-white/[0.10]/30"
                      : "bg-white/5 hover:bg-white/10 text-xc-muted hover:text-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-xc-muted mb-1.5">
            Quantity ({asset.symbol})
          </label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.0000"
            min="0.0001"
            step="0.0001"
            required
            className="w-full bg-xc-dark/60 border border-xc-border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-xc-muted/50 focus:outline-none focus:border-xc-purple/60 transition-colors"
          />
        </div>
      )}

      {/* Order summary */}
      <div className="bg-xc-dark/40 border border-xc-border rounded-xl p-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-xc-muted text-xs">Est. quantity</span>
          <span className="font-mono text-white text-xs">
            {estimatedQty.toFixed(4)} {asset.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xc-muted text-xs">Est. cost</span>
          <span className="font-mono text-white text-xs">
            {formatCurrency(estimatedCost)}
          </span>
        </div>
        <div className="flex justify-between border-t border-white/[0.04] pt-1.5">
          <span className="text-xc-muted text-xs">Available</span>
          <span
            className={cn(
              "font-mono text-xs",
              hasSufficientFunds ? "text-emerald-400" : "text-red-400",
            )}
          >
            {formatCurrency(availableCash)}
          </span>
        </div>
        {estimatedCost > 0 && side === "buy" && (
          <div className="flex justify-between pt-1">
            <span className="text-xc-muted text-xs">If +25% gain</span>
            <span className="font-mono text-xs text-emerald-400 font-bold profit-glow">
              +{formatCurrency(estimatedCost * 0.25)}
            </span>
          </div>
        )}
      </div>

      {/* Insufficient funds warning */}
      {side === "buy" && !hasSufficientFunds && estimatedCost > 0 && (
        <div className="flex items-center gap-2 text-xs text-white/50 bg-white/[0.03] border border-white/[0.10]/40 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Insufficient funds. Add cash to your wallet to continue.
        </div>
      )}

      {/* Success celebration */}
      {showCelebration && message?.type === "success" && (
        <div className="celebrate flex items-center gap-2 text-xs rounded-xl px-3 py-3 text-emerald-400 bg-emerald-950/40 border border-emerald-500/40">
          <div className="relative">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-white/50 animate-pulse" />
          </div>
          <div>
            <div className="font-bold">{message.text}</div>
            <div className="text-[10px] text-emerald-400/70 mt-0.5">
              {side === "buy"
                ? "Awaiting admin clearance before balance routing"
                : "Position updated in your portfolio"}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {message && message.type === "error" && (
        <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2 text-red-400 bg-red-950/30 border border-red-700/40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={(side === "buy" && !hasSufficientFunds) || loading}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
          side === "buy"
            ? "bg-emerald-500 hover:bg-emerald-400 text-white buy-pulse disabled:opacity-50 disabled:animate-none"
            : "bg-red-500 hover:bg-red-400 text-white disabled:opacity-50",
          loading && "opacity-70 cursor-wait",
        )}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Zap className="w-4 h-4" />
            {side === "buy" ? "Execute Buy Order" : "Execute Sell Order"}
          </>
        )}
      </button>

      {/* Trust line */}
      <div className="flex items-center justify-center gap-3 text-[9px] text-xc-muted">
        <div className="flex items-center gap-1">
          <Shield className="w-2.5 h-2.5" /> SEC Compliant
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> Instant Execution
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" /> Zero Commission
        </div>
      </div>
    </form>
  );
}
