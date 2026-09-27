import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const rawMode = (process.env.MODE || process.env.XC_MODE || '').trim().toLowerCase();
if (rawMode === 'sim' || rawMode === 'simulation' || rawMode === 'paper') {
  throw new Error('MODE=sim does not exist. Use MODE=live or MODE=testnet.');
}

const MODE = (rawMode === 'live' || rawMode === 'testnet'
  ? rawMode
  : process.env.NODE_ENV === 'production'
    ? ''
    : 'testnet') as 'live' | 'testnet' | '';

if (MODE !== 'live' && MODE !== 'testnet') {
  throw new Error('MODE must be live or testnet. MODE=sim does not exist.');
}

if (process.env.TREASURY_PRIVATE_KEY) {
  throw new Error('TREASURY_PRIVATE_KEY is forbidden. Custody is provider-only (xpub / wallet ids).');
}

const alpacaBase =
  process.env.ALPACA_BASE_URL ||
  (MODE === 'live' ? 'https://api.alpaca.markets' : 'https://data.alpaca.markets');

if (MODE === 'live' && /paper-api/i.test(alpacaBase)) {
  throw new Error('MODE=live cannot use Alpaca paper-api. Set ALPACA_BASE_URL=https://api.alpaca.markets');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: required('DATABASE_URL'),
  MODE,

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',

  ALPACA_API_KEY: process.env.ALPACA_API_KEY || '',
  ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY || '',
  ALPACA_BASE_URL: alpacaBase,
  ALPACA_DATA_URL: process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets',

  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || '',

  TATUM_API_KEY: process.env.TATUM_API_KEY || '',
  TATUM_API_URL: process.env.TATUM_API_URL || 'https://api.tatum.io',
  TATUM_JSON_RPC: process.env.TATUM_JSON_RPC || process.env.ETHEREUM_RPC_URL || '',
  TATUM_XPUB_BTC: process.env.TATUM_XPUB_BTC || '',
  TATUM_XPUB_ETH: process.env.TATUM_XPUB_ETH || '',
  TATUM_XPUB_TRON: process.env.TATUM_XPUB_TRON || '',
  TATUM_XPUB_SOL: process.env.TATUM_XPUB_SOL || '',
  TATUM_BTC_ACCOUNT_ID: process.env.TATUM_BTC_ACCOUNT_ID || '',
  TATUM_ETH_ACCOUNT_ID: process.env.TATUM_ETH_ACCOUNT_ID || '',
  TATUM_USDT_ACCOUNT_ID: process.env.TATUM_USDT_ACCOUNT_ID || '',
  TATUM_SOL_ACCOUNT_ID: process.env.TATUM_SOL_ACCOUNT_ID || '',
  TATUM_WEBHOOK_SECRET: process.env.TATUM_WEBHOOK_SECRET || '',

  VAULT_BTC: process.env.VAULT_BTC || '',
  VAULT_ETH: process.env.VAULT_ETH || '',
  VAULT_BNB: process.env.VAULT_BNB || '',
  VAULT_USDT_ETH: process.env.VAULT_USDT_ETH || process.env.VAULT_ETH || '',
  VAULT_DOGE: process.env.VAULT_DOGE || '',
  VAULT_TRX: process.env.VAULT_TRX || '',

  AI_ORACLE_URL: process.env.AI_ORACLE_URL || 'http://localhost:8000',

  KYC_PROVIDER: process.env.KYC_PROVIDER || 'persona',
  PERSONA_API_KEY: process.env.PERSONA_API_KEY || '',
  PERSONA_TEMPLATE_ID: process.env.PERSONA_TEMPLATE_ID || '',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  APPLE_SERVICE_ID: '',

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};
