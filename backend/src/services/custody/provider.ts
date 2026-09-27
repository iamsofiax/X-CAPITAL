import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { tatumCustody } from './tatum';
import { vaultCustody, vaultFor } from './vault';

export type IncomingTx = {
  txHash: string;
  amount: string;
  confirmations: number;
  from?: string;
};

export type DerivedAddress = {
  address: string;
  providerWalletId: string;
};

export interface CustodyProvider {
  mode: 'live' | 'testnet';
  configured: boolean;
  requiredConfirmations(asset: string, chain: string): number;
  deriveAddress(params: {
    asset: string;
    chain: string;
    userId: string;
    index: number;
  }): Promise<DerivedAddress>;
  listIncoming(params: { address: string; asset: string; chain: string }): Promise<IncomingTx[]>;
  verifyIncoming?(params: {
    txHash: string;
    asset: string;
    chain: string;
    address: string;
  }): Promise<IncomingTx | null>;
  broadcastWithdrawal(params: {
    asset: string;
    chain: string;
    toAddress: string;
    amount: string;
    providerWalletId: string;
    idempotencyKey: string;
  }): Promise<{ providerRef: string; txHash?: string }>;
  getWithdrawalStatus(providerRef: string): Promise<{
    status: 'pending' | 'broadcast' | 'confirmed' | 'failed';
    txHash?: string;
    confirmations?: number;
  }>;
}

export const CHAINS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'ethereum',
  BNB: 'bsc',
  DOGE: 'dogecoin',
  TRX: 'tron',
  USD: 'fiat',
};

export const DEPOSIT_ASSETS = ['BTC', 'ETH', 'USDT', 'BNB', 'DOGE', 'TRX'] as const;

export function chainFor(asset: string): string {
  return vaultFor(asset)?.chain || CHAINS[asset.toUpperCase()] || asset.toLowerCase();
}

export function getCustody(): CustodyProvider {
  if (vaultCustody.configured) return vaultCustody;
  if (!tatumCustody.configured) {
    logger.warn(`Custody provider not configured for MODE=${env.MODE}.`);
  }
  return tatumCustody;
}
