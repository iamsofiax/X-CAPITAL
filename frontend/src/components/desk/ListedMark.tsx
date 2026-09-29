"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function ListedMark({
  symbol,
  name,
  cls,
  size = "md",
}: {
  symbol: string;
  name: string;
  cls: string;
  size?: "sm" | "md";
}) {
  const sources = useMemo(() => markSources(symbol, cls), [symbol, cls]);
  const [index, setIndex] = useState(0);
  const failed = index >= sources.length;
  const letters = (symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 3) || name.slice(0, 2)).toUpperCase();
  const advance = () => setIndex((n) => (n >= sources.length ? n : n + 1));
  const compact = size === "sm";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-white",
        compact ? "h-7 w-7 rounded-[6px]" : "h-10 w-10 rounded-[8px]",
      )}
      title={name}
    >
      {failed ? (
        <span className={cn("font-black tracking-tight text-[#111816]", compact ? "text-[8px]" : "text-[9px]")}>{letters}</span>
      ) : (
        <img
          key={sources[index]}
          src={sources[index]}
          alt=""
          width={compact ? 28 : 40}
          height={compact ? 28 : 40}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn("object-contain", compact ? "h-5 w-5" : "h-8 w-8")}
          onError={advance}
          onLoad={(event) => {
            if (event.currentTarget.naturalWidth > 0 && event.currentTarget.naturalWidth < 8) advance();
          }}
        />
      )}
    </span>
  );
}

export function markClass(symbol: string, fallback = "equity") {
  if (symbol === "SPACEX" || symbol === "XAI") return "private";
  return fallback;
}

function markSources(symbol: string, cls: string): string[] {
  if (cls === "private") {
    const domain = symbol === "SPACEX" ? "spacex.com" : "x.ai";
    return [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];
  }
  if (cls === "crypto") {
    const slug = symbol.toLowerCase();
    return [
      `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@0.18.1/svg/color/${slug}.svg`,
      `https://cdn.jsdelivr.net/gh/davidepalazzo/ticker-logos/crypto_icons/${symbol}.png`,
    ];
  }
  const dashed = symbol.replace(/\./g, "-");
  return [
    `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol)}`,
    `https://cdn.jsdelivr.net/gh/davidepalazzo/ticker-logos/ticker_icons/${encodeURIComponent(symbol)}.png`,
    `https://cdn.jsdelivr.net/gh/davidepalazzo/ticker-logos/ticker_icons/${encodeURIComponent(dashed)}.png`,
    `https://financialmodelingprep.com/image-stock/${encodeURIComponent(dashed)}.png`,
  ];
}
