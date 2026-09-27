"use client";

import { useState } from "react";

const COINS: Record<string, { src: string; color: string }> = {
  BTC: { src: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", color: "#F7931A" },
  ETH: { src: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", color: "#627EEA" },
  USDT: { src: "https://assets.coingecko.com/coins/images/325/small/Tether.png", color: "#26A17B" },
  BNB: { src: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", color: "#F3BA2F" },
  DOGE: { src: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", color: "#C2A633" },
  TRX: { src: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png", color: "#FF060A" },
  SOL: { src: "https://assets.coingecko.com/coins/images/4128/small/solana.png", color: "#14F195" },
};

const VENUES: Record<string, { domain: string; color: string; mark: string }> = {
  coinbase: { domain: "coinbase.com", color: "#0052FF", mark: "C" },
  binance: { domain: "binance.com", color: "#F3BA2F", mark: "B" },
  kraken: { domain: "kraken.com", color: "#5741D9", mark: "K" },
  crypto: { domain: "crypto.com", color: "#103F68", mark: "C" },
  gemini: { domain: "gemini.com", color: "#00DCFA", mark: "G" },
  okx: { domain: "okx.com", color: "#000000", mark: "O" },
  bybit: { domain: "bybit.com", color: "#F7A600", mark: "B" },
  bitstamp: { domain: "bitstamp.net", color: "#1A9E75", mark: "B" },
  moonpay: { domain: "moonpay.com", color: "#7715F5", mark: "M" },
  ramp: { domain: "ramp.network", color: "#0B0E11", mark: "R" },
  transak: { domain: "transak.com", color: "#0061FF", mark: "T" },
  robinhood: { domain: "robinhood.com", color: "#00C805", mark: "R" },
};

export function CoinMark({ asset, size = 32 }: { asset: string; size?: number }) {
  const [off, setOff] = useState(false);
  const coin = COINS[asset];
  const color = coin?.color ?? "#34d399";
  if (!coin || off) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full font-black text-[#04120c]"
        style={{ width: size, height: size, background: color, fontSize: Math.max(11, size * 0.36) }}
        aria-hidden
      >
        {asset.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      src={coin.src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full bg-white"
      style={{ width: size, height: size }}
      onError={() => setOff(true)}
    />
  );
}

export function VenueMark({ id, size = 36 }: { id: string; size?: number }) {
  const [off, setOff] = useState(false);
  const venue = VENUES[id] ?? { domain: "", color: "#111", mark: id.slice(0, 1).toUpperCase() };
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10"
      style={{ width: size, height: size, background: venue.color }}
    >
      {!off && venue.domain ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${venue.domain}&sz=128`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover bg-white"
          onError={() => setOff(true)}
        />
      ) : (
        <span className="font-black text-white" style={{ fontSize: Math.max(12, size * 0.42) }} aria-hidden>
          {venue.mark}
        </span>
      )}
    </span>
  );
}

export function coinColor(asset: string) {
  return COINS[asset]?.color ?? "#34d399";
}
