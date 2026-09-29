export const FLEET_APR = 0.08;
export const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const MINUTE_MS = 60_000;

export const DESK_OFF = 0.3;

export function salePrice(list: number): number {
  return Math.round(list * (1 - DESK_OFF));
}

/** List price starts at $15,000 and steps up with the size of the order. The desk price is 30% off. */
export function cabListPrice(qty: number): number {
  const q = Math.max(1, Math.floor(qty));
  if (q >= 20) return 28_000;
  if (q >= 10) return 22_000;
  if (q >= 5) return 18_500;
  if (q >= 2) return 16_500;
  return 15_000;
}

export function cabUnitPrice(qty: number): number {
  return salePrice(cabListPrice(qty));
}

export function fleetIncome(cost: number, elapsedMs: number): number {
  if (!(cost > 0) || elapsedMs <= 0) return 0;
  return cost * FLEET_APR * (elapsedMs / YEAR_MS);
}

export function incomePerMinute(cost: number): number {
  return fleetIncome(cost, MINUTE_MS);
}

export type CatalogItem = {
  sku: string;
  name: string;
  line: string;
  /** Price before the desk-wide 30% reduction. */
  list: number;
  /** Price charged on the book. */
  price: number;
  image: string;
  blurb: string;
};

const RAW: Array<Omit<CatalogItem, "price">> = [
  {
    sku: "model-3",
    name: "Model 3",
    line: "Sedan",
    list: 42_490,
    image: "/catalog/catalog-model-3.png",
    blurb: "The everyday sedan. Ordered on the book and held at cost in the portfolio.",
  },
  {
    sku: "model-y",
    name: "Model Y",
    line: "Crossover",
    list: 47_990,
    image: "/catalog/catalog-model-y.png",
    blurb: "Five-seat crossover. The order debits free USD and posts the vehicle to the book.",
  },
  {
    sku: "model-s",
    name: "Model S",
    line: "Sedan",
    list: 79_990,
    image: "/catalog/catalog-model-s.png",
    blurb: "Long-range flagship sedan.",
  },
  {
    sku: "model-x",
    name: "Model X",
    line: "Crossover",
    list: 84_990,
    image: "/catalog/catalog-model-x.png",
    blurb: "Three-row flagship.",
  },
  {
    sku: "cybertruck",
    name: "Cybertruck",
    line: "Truck",
    list: 79_990,
    image: "/catalog/catalog-cybertruck.png",
    blurb: "Utility truck. Whole units only.",
  },
  {
    sku: "cybercab",
    name: "Cybercab",
    line: "Robotaxi",
    list: 30_000,
    image: "/catalog/catalog-cybercab.png",
    blurb: "The cab itself. Fleet units above are the income book, 30% off the list.",
  },
  {
    sku: "semi",
    name: "Semi",
    line: "Truck",
    list: 180_000,
    image: "/catalog/catalog-semi.png",
    blurb: "Class-8 electric tractor.",
  },
  {
    sku: "roadster",
    name: "Roadster",
    line: "Sports",
    list: 250_000,
    image: "/catalog/catalog-roadster.png",
    blurb: "Limited sports car on the atelier list.",
  },
  {
    sku: "optimus",
    name: "Optimus",
    line: "Robot",
    list: 29_990,
    image: "/catalog/catalog-optimus.png",
    blurb: "Humanoid robot. Held on the book at the price you pay.",
  },
  {
    sku: "powerwall",
    name: "Powerwall",
    line: "Energy",
    list: 11_500,
    image: "/catalog/catalog-powerwall.png",
    blurb: "Home battery. One unit per order line.",
  },
  {
    sku: "megapack",
    name: "Megapack",
    line: "Energy",
    list: 1_400_000,
    image: "/catalog/catalog-megapack.png",
    blurb: "Utility battery. Whole units, settled on the book.",
  },
  {
    sku: "solar-roof",
    name: "Solar Roof",
    line: "Energy",
    list: 65_000,
    image: "/catalog/catalog-solar-roof.png",
    blurb: "Glass roof package, settled as a single ticket.",
  },
  {
    sku: "solar-panels",
    name: "Solar Panels",
    line: "Energy",
    list: 18_000,
    image: "/catalog/catalog-panels.png",
    blurb: "Rooftop array. One package per order line.",
  },
  {
    sku: "wall-connector",
    name: "Wall Connector",
    line: "Energy",
    list: 475,
    image: "/catalog/catalog-wall.png",
    blurb: "Home charger. Small ticket, same book.",
  },
  {
    sku: "model-3-performance",
    name: "Model 3 Performance",
    line: "Sedan",
    list: 54_990,
    image: "/catalog/catalog-m3p.png",
    blurb: "The quicker sedan. Same book, its own photograph.",
  },
  {
    sku: "model-y-performance",
    name: "Model Y Performance",
    line: "Crossover",
    list: 57_990,
    image: "/catalog/catalog-myp.png",
    blurb: "Performance crossover. Held at the desk price.",
  },
  {
    sku: "model-s-plaid",
    name: "Model S Plaid",
    line: "Sedan",
    list: 94_990,
    image: "/catalog/catalog-splaid.png",
    blurb: "Flagship tri-motor sedan.",
  },
  {
    sku: "model-x-plaid",
    name: "Model X Plaid",
    line: "Crossover",
    list: 99_990,
    image: "/catalog/catalog-xplaid.png",
    blurb: "Flagship three-row, tri-motor.",
  },
  {
    sku: "cyberbeast",
    name: "Cyberbeast",
    line: "Truck",
    list: 99_990,
    image: "/catalog/catalog-beast.png",
    blurb: "The top Cybertruck. Whole units only.",
  },
  {
    sku: "mobile-connector",
    name: "Mobile Connector",
    line: "Energy",
    list: 275,
    image: "/catalog/catalog-mobile.png",
    blurb: "Portable charger. One per order line.",
  },
  {
    sku: "powerwall-expansion",
    name: "Powerwall Expansion",
    line: "Energy",
    list: 6_500,
    image: "/catalog/catalog-pw-exp.png",
    blurb: "Extra home battery module.",
  },
  {
    sku: "optimus-dock",
    name: "Optimus Dock",
    line: "Robot",
    list: 2_490,
    image: "/catalog/catalog-dock.png",
    blurb: "Charging dock for the robot.",
  },
];

export const CATALOG: CatalogItem[] = RAW.map((item) => ({
  ...item,
  price: salePrice(item.list),
}));

export const CATALOG_BY_SKU: Record<string, CatalogItem> = Object.fromEntries(
  CATALOG.map((item) => [item.sku, item]),
);

export const FLEET_SKU = "fleet";
const CART_KEY = "xc_commerce_cart";

export type CartLine = { sku: string; qty: number };

export function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => l && typeof l.sku === "string" && l.qty > 0);
  } catch {
    return [];
  }
}

export function saveCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  const next = lines.filter((l) => l.qty > 0);
  if (next.length === 0) localStorage.removeItem(CART_KEY);
  else localStorage.setItem(CART_KEY, JSON.stringify(next));
}

export function lineTicket(sku: string, qty: number) {
  const n = Math.max(1, Math.floor(qty));
  if (sku === FLEET_SKU) return cabUnitPrice(n) * n;
  const item = CATALOG_BY_SKU[sku];
  return item ? item.price * n : 0;
}

export function cartTicket(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + lineTicket(line.sku, line.qty), 0);
}

export function lineName(sku: string) {
  if (sku === FLEET_SKU) return "Robotaxi fleet";
  return CATALOG_BY_SKU[sku]?.name ?? sku;
}
