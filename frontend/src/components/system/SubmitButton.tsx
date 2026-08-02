"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * SubmitButton — institutional submit control.
 *
 * IDEMPOTENCY GUARD / DEBOUNCING: while `loading` is true the button is
 * rendered disabled AND click-through is blocked, so a double-click (or a
 * rapid series of clicks) can never fire two transactions.
 *
 * Every state-changing submit on the platform must use this so users get
 * a visible spinner for each successful submission and the network can
 * never be spammed by a double-click.
 */
export default function SubmitButton({
  children,
  onClick,
  loading = false,
  loadingLabel = "Processing…",
  disabled = false,
  variant = "primary",
  className,
  icon,
  fullWidth = false,
}: SubmitButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all select-none";
  const variants: Record<string, string> = {
    primary:
      "bg-white text-black hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed",
    secondary:
      "bg-white/[0.06] text-white border border-white/[0.10] hover:bg-white/[0.10] disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed",
  };
  const size = fullWidth ? "w-full py-3" : "px-5 py-2.5";

  return (
    <button
      type="button"
      onClick={() => {
        if (loading) return; // click-through guard — idempotency
        onClick?.();
      }}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(base, variants[variant], size, className)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}
