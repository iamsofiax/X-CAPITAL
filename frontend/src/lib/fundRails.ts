export type FundAsset = "BTC" | "ETH" | "USDT" | "BNB" | "DOGE" | "TRX";

export type FundRail = {
  asset: FundAsset;
  name: string;
  network: string;
  address: string;
  warning: string;
  qr: string;
};

const ETH = "0xAf3eEf52F301A8b4ce2cc4f0c3329F153fCA9B7a";

export const FUND_RAILS: FundRail[] = [
  {
    asset: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    address: "bc1qg06kxe6x03xwahatkncm6k86hxwpquwaed78dd",
    warning: "Send Bitcoin on the Bitcoin network only.",
    qr: "bitcoin:bc1qg06kxe6x03xwahatkncm6k86hxwpquwaed78dd",
  },
  {
    asset: "ETH",
    name: "Ether",
    network: "Ethereum",
    address: ETH,
    warning: "Send ETH on Ethereum only. Do not send from a BSC or Tron wallet.",
    qr: `ethereum:${ETH}`,
  },
  {
    asset: "USDT",
    name: "Tether",
    network: "Ethereum · ERC-20",
    address: ETH,
    warning: "Send USDT on Ethereum (ERC-20) only. Tron USDT will not credit.",
    qr: `ethereum:${ETH}`,
  },
  {
    asset: "BNB",
    name: "BNB",
    network: "BNB Smart Chain",
    address: ETH,
    warning: "Send BNB on BNB Smart Chain only.",
    qr: `ethereum:${ETH}`,
  },
  {
    asset: "DOGE",
    name: "Dogecoin",
    network: "Dogecoin",
    address: "DQAftqFdsHiJabVZRK1aipkn8GJjXzkF92",
    warning: "Send DOGE on the Dogecoin network only.",
    qr: "dogecoin:DQAftqFdsHiJabVZRK1aipkn8GJjXzkF92",
  },
  {
    asset: "TRX",
    name: "Tron",
    network: "Tron",
    address: "TE2PuH6CTHUb9VHe7ZL24yrWKgamneduCx",
    warning: "Send TRX on the Tron network only.",
    qr: "tron:TE2PuH6CTHUb9VHe7ZL24yrWKgamneduCx",
  },
];

export type Onramp = {
  id: string;
  name: string;
  note: string;
  kind: "instant" | "exchange";
  href: (asset: FundAsset) => string;
};

const SLUG: Record<FundAsset, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "bnb",
  DOGE: "dogecoin",
  TRX: "tron",
};

const PAIR: Record<FundAsset, string> = {
  BTC: "BTC",
  ETH: "ETH",
  USDT: "USDT",
  BNB: "BNB",
  DOGE: "DOGE",
  TRX: "TRX",
};

export const ONRAMPS: Onramp[] = [
  {
    id: "changelly",
    name: "Changelly",
    note: "Card, instant",
    kind: "instant",
    href: (a) => `https://changelly.com/buy/${SLUG[a]}`,
  },
  {
    id: "moonpay",
    name: "MoonPay",
    note: "Card, instant",
    kind: "instant",
    href: (a) => `https://www.moonpay.com/buy/${SLUG[a]}`,
  },
  {
    id: "transak",
    name: "Transak",
    note: "Card, instant",
    kind: "instant",
    href: (a) => `https://global.transak.com/?cryptoCurrencyCode=${PAIR[a]}`,
  },
  {
    id: "ramp",
    name: "Ramp",
    note: "Card or bank",
    kind: "instant",
    href: (a) => `https://app.ramp.network/?defaultAsset=${PAIR[a]}`,
  },
  {
    id: "banxa",
    name: "Banxa",
    note: "Card, instant",
    kind: "instant",
    href: () => "https://banxa.com/",
  },
  {
    id: "mercuryo",
    name: "Mercuryo",
    note: "Card, instant",
    kind: "instant",
    href: (a) => `https://exchange.mercuryo.io/?currency=${PAIR[a]}`,
  },
  {
    id: "simplex",
    name: "Simplex",
    note: "Card, instant",
    kind: "instant",
    href: () => `https://buy.simplex.com/`,
  },
  {
    id: "coinbase",
    name: "Coinbase",
    note: "Card or bank",
    kind: "exchange",
    href: (a) => `https://www.coinbase.com/price/${SLUG[a]}`,
  },
  {
    id: "binance",
    name: "Binance",
    note: "Spot",
    kind: "exchange",
    href: (a) => `https://www.binance.com/en/trade/${PAIR[a]}_USDT`,
  },
  {
    id: "kraken",
    name: "Kraken",
    note: "Spot",
    kind: "exchange",
    href: (a) => `https://pro.kraken.com/app/trade/${PAIR[a].toLowerCase()}-usd`,
  },
  {
    id: "crypto",
    name: "Crypto.com",
    note: "App or exchange",
    kind: "exchange",
    href: (a) => `https://crypto.com/price/${SLUG[a]}`,
  },
  {
    id: "gemini",
    name: "Gemini",
    note: "USD pair",
    kind: "exchange",
    href: (a) => `https://www.gemini.com/prices/${SLUG[a]}`,
  },
  {
    id: "okx",
    name: "OKX",
    note: "Spot",
    kind: "exchange",
    href: (a) => `https://www.okx.com/trade-spot/${PAIR[a].toLowerCase()}-usdt`,
  },
  {
    id: "bybit",
    name: "Bybit",
    note: "Spot",
    kind: "exchange",
    href: (a) => `https://www.bybit.com/en/trade/spot/${PAIR[a]}/USDT`,
  },
  {
    id: "bitstamp",
    name: "Bitstamp",
    note: "USD pair",
    kind: "exchange",
    href: (a) => `https://www.bitstamp.net/markets/${PAIR[a].toLowerCase()}/usd/`,
  },
  {
    id: "robinhood",
    name: "Robinhood",
    note: "Broker",
    kind: "exchange",
    href: (a) => `https://robinhood.com/crypto/${PAIR[a]}`,
  },
];

export function qrImageUrl(payload: string, size = 480): string {
  const q = new URLSearchParams({
    size: `${size}x${size}`,
    margin: "16",
    ecc: "H",
    color: "06281c",
    bgcolor: "f4fff8",
    data: payload,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${q.toString()}`;
}
