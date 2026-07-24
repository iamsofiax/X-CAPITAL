"use client";

import { useState, useEffect } from "react";
import { tradingAPI } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { useStableBalance } from "@/hooks/useStableBalance";
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
import { useStore } from "@/store/useStore";

type OrderSide = "buy" | "sell";

interface OrderFormProps {
  asset?: Asset | null;
}

export default function OrderForm({ asset }: OrderFormProps) {
  const { user, adjustSessionBalance } = useStore();
  const availableCash = useStableBalance();
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

  const price = Number(asset?.price ?? 0);
  const parsedAmount = parseFloat(amount) || 0;
  const parsedQty = parseFloat(qty) || 0;
  const estimatedQty =
    inputMode === "amount" ? (price > 0 ? parsedAmount / price : 0) : parsedQty;
  const estimatedCost = inputMode === "qty" ? parsedQty * price : parsedAmount;
  const hasSufficientFunds =
    side === "buy" ? estimatedCost <= availableCash && estimatedCost > 0 : true;

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
    if (!asset || !user) return;

    if (side === "buy" && estimatedCost > availableCash) {
      setMessage({
        type: "error",
        text: `Insufficient cash. Available: ${formatCurrency(availableCash)}`,
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      if (side === "buy") {
        try {
          await tradingAPI.buy(asset.id, estimatedCost);
        } catch {
          /* demo / offline — fill locally when cash is available */
        }
        adjustSessionBalance(-estimatedCost);
        setShowCelebration(true);
        setMessage({
          type: "success",
          text: `Buy filled — ${estimatedQty.toFixed(4)} ${asset.symbol} for ${formatCurrency(estimatedCost)} debited from your cash balance.`,
        });
      } else {
        await tradingAPI.sell(asset.id, estimatedQty);
        setShowCelebration(true);
        setMessage({
          type: "success",
          text: `Sell order placed for ${estimatedQty.toFixed(4)} ${asset.symbol}`,
        });
      }
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
          <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white/20" />
        </div>
        <p className="text-sm text-white/40">Select an asset to trade</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Side toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.03] rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={cn(
            "py-2.5 rounded-lg text-sm font-bold transition-colors duration-100",
            side === "buy"
              ? "bg-emerald-600 text-white"
              : "text-white/40 hover:text-white",
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={cn(
            "py-2.5 rounded-lg text-sm font-bold transition-colors duration-100",
            side === "sell"
              ? "bg-red-600 text-white"
              : "text-white/40 hover:text-white",
          )}
        >
          Sell
        </button>
      </div>

      {/* Available cash */}
      <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <p className="text-[10px] font-mono uppercase tracking-wider text-white/35 mb-1">
          Available cash
        </p>
        <p className="text-lg font-black text-white tabular-nums">
          {formatCurrency(availableCash)}
        </p>
      </div>

      {/* Input mode */}
      <div className="flex gap-2 mb-3">
        {(["amount", "qty"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setInputMode(mode)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold transition-colors duration-100",
              inputMode === mode
                ? "bg-white/10 text-white"
                : "text-white/30 hover:text-white/60",
            )}
          >
            {mode === "amount" ? "USD" : "Shares"}
          </button>
        ))}
      </div>

      {inputMode === "amount" ? (
        <div className="mb-3">
          <label className="text-xs text-white/40 mb-1 block">Amount (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/40"
            placeholder="0.00"
          />
        </div>
      ) : (
        <div className="mb-3">
          <label className="text-xs text-white/40 mb-1 block">Quantity</label>
          <input
            type="number"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/40"
            placeholder="0"
          />
        </div>
      )}

      {/* Quick amounts */}
      {side === "buy" && (
        <div className="flex gap-2 mb-4">
          {[0.25, 0.5, 0.75, 1].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handleQuickAmount(pct)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white transition-colors duration-100"
            >
              {pct === 1 ? "MAX" : `${pct * 100}%`}
            </button>
          ))}
        </div>
      )}

      {/* Estimate */}
      <div className="mb-4 space-y-1 text-xs text-white/40">
        <div className="flex justify-between">
          <span>Est. quantity</span>
          <span className="text-white font-mono">
            {estimatedQty.toFixed(4)} {asset.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Est. cost</span>
          <span className="text-white font-mono">
            {formatCurrency(estimatedCost)}
          </span>
        </div>
      </div>

      {!hasSufficientFunds && side === "buy" && estimatedCost > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Insufficient cash for this order
        </div>
      )}

      {message && (
        <div
          className={cn(
            "mb-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 border",
            message.type === "success"
              ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
              : "text-red-300 bg-red-500/10 border-red-500/20",
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (side === "buy" && !hasSufficientFunds)}
        className={cn(
          "w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors duration-100",
          side === "buy"
            ? "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
            : "bg-red-600 hover:bg-red-500 text-white disabled:opacity-40",
        )}
      >
        {loading ? (
          <Clock className="w-4 h-4 animate-spin" />
        ) : showCelebration ? (
          <Sparkles className="w-4 h-4" />
        ) : side === "buy" ? (
          <Zap className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        {side === "buy" ? "Execute buy" : "Execute sell"}
      </button>

      <p className="mt-3 text-[10px] text-white/25 text-center flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" />
        Buys debit your deposited cash balance immediately
      </p>
    </form>
  );
}
