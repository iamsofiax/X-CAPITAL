import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';

// Product catalog — in production pulled from partner APIs / CMS
const PRODUCTS = [
  {
    id: 'tesla-model-x',
    name: 'Tesla Model X',
    brand: 'Tesla',
    category: 'vehicle',
    price: 79990,
    imageUrl: '/images/tesla-model-x.jpg',
    description: 'The safest, most capable SUV on the road.',
    stockSymbol: 'TSLA',
    affiliateUrl: 'https://www.tesla.com/modelx',
    investmentSuggestion: {
      percentage: 5,
      minAmount: 3999,
      description: 'Invest 5% of your purchase price into Tesla stock',
    },
  },
  {
    id: 'tesla-model-3',
    name: 'Tesla Model 3',
    brand: 'Tesla',
    category: 'vehicle',
    price: 38990,
    imageUrl: '/images/tesla-model-3.jpg',
    description: 'The world\'s best-selling electric vehicle.',
    stockSymbol: 'TSLA',
    affiliateUrl: 'https://www.tesla.com/model3',
    investmentSuggestion: {
      percentage: 5,
      minAmount: 1949,
      description: 'Invest 5% of your purchase price into Tesla stock',
    },
  },
  {
    id: 'apple-macbook-pro',
    name: 'MacBook Pro M4 Max',
    brand: 'Apple',
    category: 'technology',
    price: 3499,
    imageUrl: '/images/macbook-pro.jpg',
    description: 'The most powerful Mac laptop ever built.',
    stockSymbol: 'AAPL',
    affiliateUrl: 'https://www.apple.com/macbook-pro/',
    investmentSuggestion: {
      percentage: 10,
      minAmount: 349,
      description: 'Invest 10% of your purchase price into Apple stock',
    },
  },
  {
    id: 'nvidia-dgx',
    name: 'NVIDIA DGX H100',
    brand: 'NVIDIA',
    category: 'infrastructure',
    price: 250000,
    imageUrl: '/images/nvidia-dgx.jpg',
    description: 'Enterprise AI infrastructure system.',
    stockSymbol: 'NVDA',
    affiliateUrl: 'https://www.nvidia.com/en-us/data-center/dgx-h100/',
    investmentSuggestion: {
      percentage: 5,
      minAmount: 12500,
      description: 'Invest 5% of your purchase price into NVIDIA stock',
    },
  },
];

async function catalog() {
  const stored = await prisma.commerceProduct.findMany();
  const byId = new Map(PRODUCTS.map((p) => [p.id, p as Record<string, unknown>]));
  for (const row of stored) {
    const payload = row.payload as Record<string, unknown> | null;
    if (!payload || typeof payload !== 'object') continue;
    if (payload.deleted) {
      byId.delete(row.id);
      continue;
    }
    byId.set(row.id, { ...payload, id: row.id });
  }
  return Array.from(byId.values()) as Array<Record<string, unknown> & { id: string }>;
}

export const getProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ success: true, data: await catalog() });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = (await catalog()).find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const initiateCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { productId, paymentMethod, investmentBundle, investmentPercent } = req.body;

    const product = (await catalog()).find((p) => p.id === productId) as typeof PRODUCTS[0] | undefined;
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const investAmount = investmentBundle
      ? (product.price * (investmentPercent || product.investmentSuggestion.percentage)) / 100
      : 0;

    // Return checkout session — integrate with Stripe / partner checkout in production
    res.json({
      success: true,
      data: {
        checkoutSession: {
          id: `cs_${Date.now()}`,
          product,
          paymentMethod,
          totalAmount: product.price,
          investmentAmount: investAmount,
          affiliateUrl: product.affiliateUrl,
          message: investmentBundle
            ? `Purchase redirects to ${product.brand}. $${investAmount.toFixed(2)} will be invested in $${product.stockSymbol}`
            : `Purchase redirects to ${product.brand}`,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
