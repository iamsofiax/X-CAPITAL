export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-xc-green';
  if (value < 0) return 'text-xc-red';
  return 'text-xc-muted';
}

export function getAssetTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    STOCK: 'text-xc-purple-light bg-purple-950/40',
    ETF: 'text-xc-cyan bg-cyan-950/40',
    TOKEN: 'text-xc-gold-light bg-amber-950/40',
    FUND: 'text-xc-green bg-emerald-950/40',
    PRIVATE_EQUITY: 'text-pink-400 bg-pink-950/40',
    INFRASTRUCTURE: 'text-orange-400 bg-orange-950/40',
    CRYPTO: 'text-yellow-400 bg-yellow-950/40',
    COMMODITY: 'text-lime-400 bg-lime-950/40',
  };
  return colorMap[type] || 'text-xc-muted bg-gray-900/40';
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
