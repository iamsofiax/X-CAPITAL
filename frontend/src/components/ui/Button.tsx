"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "gold"
  | "outline";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-xc-purple hover:bg-white active:bg-white/90 text-black font-bold border border-transparent shadow-lg shadow-black/30",
  secondary:
    "bg-white/5 hover:bg-white/10 active:bg-white/15 text-white border border-xc-border",
  danger:
    "bg-red-700/80 hover:bg-red-600 active:bg-red-700 text-white border border-red-700/50 shadow-lg shadow-red-900/30",
  ghost:
    "bg-transparent hover:bg-white/5 active:bg-white/10 text-white/80 hover:text-white border border-transparent",
  gold: "bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/10 shadow-lg shadow-black/30",
  outline:
    "bg-transparent hover:bg-white/5 text-white/70 border border-white/10 hover:border-white/20",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md gap-1.5",
  sm: "px-3.5 py-1.5 text-sm rounded-lg gap-2",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
  xl: "px-8 py-4 text-base rounded-2xl gap-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
        <button
          ref={ref}
          disabled={isDisabled}
          className={cn(
            "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xc-purple/70 focus-visible:ring-offset-2 focus-visible:ring-offset-xc-dark",
            VARIANT_CLASSES[variant],
            SIZE_CLASSES[size],
            fullWidth && "w-full",
            isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
            className,
          )}
          {...props}
        >
        {loading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 shrink-0" />
            {children && <span>{children}</span>}
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="shrink-0">{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === "right" && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
