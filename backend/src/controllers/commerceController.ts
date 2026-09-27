import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

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

export const getProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ success: true, data: PRODUCTS });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = PRODUCTS.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

