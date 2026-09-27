import {
  BarChart3,
  Briefcase,
  Building2,
  Cpu,
  Home,
  Layers,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface Rail {
  id: string;
  href: string;
  code: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  accent: string;
}

/** The seven rails. All of them unlock when the user claims Genesis. */
export const RAILS: Rail[] = [
  { id: "treasury", href: "/wallet", code: "R1 · TREASURY", label: "Treasury", blurb: "Cash, ledger and proof of reserves", icon: Wallet, accent: "#34d399" },
  { id: "execution", href: "/trading", code: "R2 · EXECUTION", label: "Execution", blurb: "Spot fills at bid/ask on live quotes", icon: BarChart3, accent: "#22d3ee" },
  { id: "book", href: "/portfolio", code: "R3 · BOOK", label: "Book", blurb: "Positions, risk, NAV history and projection", icon: Briefcase, accent: "#a78bfa" },
  { id: "vaults", href: "/funds", code: "R4 · VAULTS", label: "Vaults", blurb: "Strategy vaults with HWM performance fees", icon: Layers, accent: "#f472b6" },
  { id: "rwa", href: "/commerce", code: "R5 · COMMERCE", label: "Commerce", blurb: "Tesla atelier, robotaxi fleet, and tokenized sleeves", icon: Building2, accent: "#60a5fa" },
  { id: "oracle", href: "/oracle", code: "R6 · ORACLE", label: "Oracle", blurb: "Regime model, forecasts and Monte Carlo", icon: Cpu, accent: "#fbbf24" },
  { id: "conviction", href: "/engine", code: "R7 · CONVICTION", label: "Conviction", blurb: "Lock XC for a share of protocol fees", icon: Zap, accent: "#818cf8" },
];

export const COMMAND_CENTER = {
  href: "/dashboard",
  code: "R0 · COMMAND",
  label: "Command",
  icon: Home,
};
