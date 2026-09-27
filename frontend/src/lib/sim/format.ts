export function fmtUsdc(value: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  const { compact = false, decimals = 2 } = opts;
  const abs = Math.abs(value);
  if (compact && abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (compact && abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (compact && abs >= 1e4) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtPct(fraction: number, decimals = 2, signed = true): string {
  const v = fraction * 100;
  const sign = signed && v > 0 ? "+" : "";
  return `${sign}${v.toFixed(decimals)}%`;
}

export function fmtNum(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

export function fmtPrice(value: number): string {
  if (value >= 1000) return fmtUsdc(value, { decimals: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(4);
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function signClass(value: number): string {
  if (value > 0) return "sim-pos";
  if (value < 0) return "sim-neg";
  return "text-white/50";
}

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
