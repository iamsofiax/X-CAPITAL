import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  /** Comma-separated extra CORS origins (e.g. https://xcapital-web.onrender.com) */
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',

  ALPACA_API_KEY: process.env.ALPACA_API_KEY || '',
  ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY || '',
  ALPACA_BASE_URL: process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets',
  ALPACA_DATA_URL: process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets',

  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || '',
  TREASURY_WALLET_ADDRESS: process.env.TREASURY_WALLET_ADDRESS || '',
  TREASURY_PRIVATE_KEY: process.env.TREASURY_PRIVATE_KEY || '',
  XCAPITAL_TOKEN_ADDRESS: process.env.XCAPITAL_TOKEN_ADDRESS || '',

  AI_ORACLE_URL: process.env.AI_ORACLE_URL || 'http://localhost:8000',

  KYC_PROVIDER: process.env.KYC_PROVIDER || 'persona',
  PERSONA_API_KEY: process.env.PERSONA_API_KEY || '',
  PERSONA_TEMPLATE_ID: process.env.PERSONA_TEMPLATE_ID || '',

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || '',

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};
