import type { DepositAddress } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// X-CAPITAL — Deposit Address Defaults & Resolution
//
// The wallet page used to hardcode crypto receive addresses in the CRYPTOS
// array. Those defaults now live here, and admin overrides live in the
// persisted store (depositAddresses). resolveDepositAddress merges the two:
// store value wins, default is the fallback. Because the QR code is generated
// from the address at runtime, updating the address automatically updates the
// QR everywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_DEPOSIT_ADDRESSES: DepositAddress[] = [
  {
    symbol: "BTC",
    address: "bc1pupqvx4eclxktw4c8lwnwz0q0206wjcd4g24dytxyd0mmes3hc9zqjef632",
  },
  {
    symbol: "ETH",
    address: "0x14BeaCB76970C7aD354f35aB1ca21F0e2f826cff",
  },
  {
    symbol: "USDT",
    address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  },
  {
    symbol: "USDC",
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFtb21eF9e0c8d27Ef",
  },
  {
    symbol: "SOL",
    address: "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
  },
  {
    symbol: "BNB",
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFtb21eF9e0c2d47Ab",
  },
  {
    symbol: "XRP",
    address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    tag: "2847361",
  },
];

/** Look up a coin's default deposit address. */
export function getDefaultDepositAddress(
  symbol: string,
): DepositAddress | undefined {
  return DEFAULT_DEPOSIT_ADDRESSES.find((d) => d.symbol === symbol);
}

/**
 * Resolve the effective deposit address for a symbol:
 * admin override (store) wins, otherwise the built-in default.
 */
export function resolveDepositAddress(
  symbol: string,
  overrides: DepositAddress[],
): DepositAddress {
  const override = overrides.find((d) => d.symbol === symbol);
  if (override?.address?.trim()) return override;
  const fallback = getDefaultDepositAddress(symbol);
  return fallback ?? { symbol, address: "" };
}
