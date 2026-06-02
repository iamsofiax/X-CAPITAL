import { PrismaClient, AssetType, InvestmentCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding X-CAPITAL database...");

  // ─── Assets ───────────────────────────────────────────────────────────────
  const assets = [
    // Public Stocks
    {
      symbol: "TSLA",
      name: "Tesla, Inc.",
      type: AssetType.STOCK,
      price: 248.42,
      priceChange24h: 3.21,
      marketCap: 793_000_000_000,
      sector: "EV & Energy",
      exchange: "NASDAQ",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      type: AssetType.STOCK,
      price: 875.39,
      priceChange24h: 2.15,
      marketCap: 2_160_000_000_000,
      sector: "Semiconductors",
      exchange: "NASDAQ",
    },
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      type: AssetType.STOCK,
      price: 213.07,
      priceChange24h: 0.54,
      marketCap: 3_300_000_000_000,
      sector: "Technology",
      exchange: "NASDAQ",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com, Inc.",
      type: AssetType.STOCK,
      price: 198.12,
      priceChange24h: 1.87,
      marketCap: 2_080_000_000_000,
      sector: "E-Commerce & Cloud",
      exchange: "NASDAQ",
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      type: AssetType.STOCK,
      price: 415.26,
      priceChange24h: 0.93,
      marketCap: 3_080_000_000_000,
      sector: "Technology",
      exchange: "NASDAQ",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      type: AssetType.STOCK,
      price: 174.33,
      priceChange24h: 1.42,
      marketCap: 2_190_000_000_000,
      sector: "Technology",
      exchange: "NASDAQ",
    },
    {
      symbol: "META",
      name: "Meta Platforms, Inc.",
      type: AssetType.STOCK,
      price: 513.92,
      priceChange24h: 2.77,
      marketCap: 1_300_000_000_000,
      sector: "Social Media & AI",
      exchange: "NASDAQ",
    },
    {
      symbol: "PLTR",
      name: "Palantir Technologies",
      type: AssetType.STOCK,
      price: 24.18,
      priceChange24h: 4.32,
      marketCap: 52_000_000_000,
      sector: "AI & Defense",
      exchange: "NYSE",
    },
    // ETFs
    {
      symbol: "XLC",
      name: "SPDR Communication Services ETF",
      type: AssetType.ETF,
      price: 71.45,
      priceChange24h: 0.88,
      marketCap: 12_000_000_000,
      sector: "Technology",
      exchange: "NYSE",
    },
    {
      symbol: "ARKK",
      name: "ARK Innovation ETF",
      type: AssetType.ETF,
      price: 47.82,
      priceChange24h: 1.23,
      marketCap: 7_000_000_000,
      sector: "Innovation",
      exchange: "NYSE",
    },
    // X-CAPITAL Tokens
    {
      symbol: "XSPACE",
      name: "X-SPACE Token",
      type: AssetType.TOKEN,
      price: 12.5,
      priceChange24h: 5.12,
      marketCap: 125_000_000,
      liquidityScore: 72,
      sector: "Space Economy",
    },
    {
      symbol: "XINFRA",
      name: "X-INFRA Token",
      type: AssetType.TOKEN,
      price: 8.75,
      priceChange24h: 2.88,
      marketCap: 87_500_000,
      liquidityScore: 68,
      sector: "AI Infrastructure",
    },
    {
      symbol: "XENERGY",
      name: "X-ENERGY Token",
      type: AssetType.TOKEN,
      price: 15.2,
      priceChange24h: -1.24,
      marketCap: 152_000_000,
      liquidityScore: 71,
      sector: "Clean Energy",
    },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: { price: asset.price, priceChange24h: asset.priceChange24h },
      create: asset,
    });
  }

  // ─── Investment Funds / SPVs ──────────────────────────────────────────────
  const investments = [
    {
      name: "X-SPACE Fund I",
      description:
        "Indirect exposure to the space economy: aerospace ETFs, Starlink supply chain, satellite networks, and launch contractors.",
      category: InvestmentCategory.SPACE_ECONOMY,
      minInvestment: 5000,
      lockPeriodDays: 365,
      targetReturn: 24.5,
      riskLevel: "HIGH",
      currentAUM: 12_400_000,
      maxCapacity: 50_000_000,
      highlights: [
        "Pre-IPO SpaceX exposure via secondary markets",
        "Satellite network allocations",
        "Launch contractor stakes",
      ],
      allocation: {
        spaceETFs: 40,
        supplyChain: 30,
        tokenizedExposure: 20,
        liquidity: 10,
      },
    },
    {
      name: "X-AI Infrastructure Fund",
      description:
        "Capital deployed into AI data centers, GPU compute clusters, and AI software companies.",
      category: InvestmentCategory.AI_INFRASTRUCTURE,
      minInvestment: 10000,
      lockPeriodDays: 180,
      targetReturn: 31.2,
      riskLevel: "HIGH",
      currentAUM: 28_900_000,
      maxCapacity: 100_000_000,
      highlights: [
        "GPU cluster partnerships",
        "AI SaaS companies",
        "Cloud infrastructure bonds",
      ],
      allocation: {
        dataCenters: 40,
        aiCompanies: 30,
        tokenizedExposure: 20,
        liquidity: 10,
      },
    },
    {
      name: "X-ENERGY Systems Fund",
      description:
        "Investment pipeline into solar farms, battery grids, and Tesla Energy ecosystem projects.",
      category: InvestmentCategory.ENERGY_SYSTEMS,
      minInvestment: 2500,
      lockPeriodDays: 270,
      targetReturn: 18.7,
      riskLevel: "MEDIUM",
      currentAUM: 8_750_000,
      maxCapacity: 40_000_000,
      highlights: [
        "Solar farm contracts",
        "Megapack battery projects",
        "Green energy REITs",
      ],
      allocation: {
        solarFarms: 45,
        batteryGrid: 30,
        greenREITs: 15,
        liquidity: 10,
      },
    },
    {
      name: "X-Capital Late Stage Venture",
      description:
        "Access to pre-IPO rounds in top-tier private companies across AI, space, and biotech.",
      category: InvestmentCategory.VENTURE_FUND,
      minInvestment: 25000,
      lockPeriodDays: 730,
      targetReturn: 42.0,
      riskLevel: "VERY_HIGH",
      currentAUM: 45_200_000,
      maxCapacity: 150_000_000,
      highlights: [
        "SpaceX secondary via Forge Global",
        "OpenAI tender offer access",
        "Stripe pre-IPO shares",
      ],
      allocation: {
        spaceX: 25,
        aiCompanies: 35,
        biotech: 20,
        fintech: 10,
        liquidity: 10,
      },
    },
  ];

  for (const inv of investments) {
    await prisma.investment.upsert({
      where: { id: inv.name.replace(/\s+/g, "_").toLowerCase() },
      update: {},
      create: { ...inv, id: inv.name.replace(/\s+/g, "_").toLowerCase() },
    });
  }

  // ─── Platform admin (multi-device login + admin panel) ───────────────────
  const adminEmail = "admin@xcapital.io";
  const adminPasswordHash = await bcrypt.hash("Admin2026!", 12);
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        firstName: "Platform",
        lastName: "Admin",
        tier: "BLACK",
        kycStatus: "APPROVED",
        accreditationStatus: "ACCREDITED",
      },
    });
    await prisma.wallet.create({ data: { userId: adminUser.id } });
    await prisma.portfolio.create({
      data: {
        userId: adminUser.id,
        totalValue: 0,
        totalCost: 0,
        totalPnL: 0,
      },
    });
    console.log("   - Platform admin: admin@xcapital.io");
  }

  console.log("✅ Database seeded successfully!");
  console.log(`   - ${assets.length} assets`);
  console.log(`   - ${investments.length} investment funds`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
