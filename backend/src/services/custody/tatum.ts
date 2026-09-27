import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import type { CustodyProvider, DerivedAddress, IncomingTx } from './provider';

function xpubFor(asset: string): string {
  switch (asset.toUpperCase()) {
    case 'BTC':
      return env.TATUM_XPUB_BTC;
    case 'ETH':
      return env.TATUM_XPUB_ETH;
    case 'USDT':
      return env.TATUM_XPUB_TRON || env.TATUM_XPUB_ETH;
    case 'SOL':
      return env.TATUM_XPUB_SOL;
    default:
      return '';
  }
}

function accountIdFor(asset: string): string {
  switch (asset.toUpperCase()) {
    case 'BTC':
      return env.TATUM_BTC_ACCOUNT_ID;
    case 'ETH':
      return env.TATUM_ETH_ACCOUNT_ID;
    case 'USDT':
      return env.TATUM_USDT_ACCOUNT_ID;
    case 'SOL':
      return env.TATUM_SOL_ACCOUNT_ID;
    default:
      return '';
  }
}

function pathFor(chain: string): string {
  if (chain === 'bitcoin') return 'bitcoin';
  if (chain === 'ethereum') return 'ethereum';
  if (chain === 'tron') return 'tron';
  if (chain === 'solana') return 'solana';
  return chain;
}

class TatumCustody implements CustodyProvider {
  mode = env.MODE;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.TATUM_API_URL,
      timeout: 20_000,
      headers: {
        'x-api-key': env.TATUM_API_KEY,
        'Content-Type': 'application/json',
      },
    });
  }

  get configured(): boolean {
    return Boolean(env.TATUM_API_KEY && (env.TATUM_XPUB_BTC || env.TATUM_XPUB_ETH || env.TATUM_BTC_ACCOUNT_ID));
  }

  requiredConfirmations(asset: string, _chain: string): number {
    const live = this.mode === 'live';
    switch (asset.toUpperCase()) {
      case 'BTC':
        return live ? 3 : 1;
      case 'ETH':
        return live ? 12 : 3;
      case 'USDT':
        return live ? 19 : 3;
      case 'SOL':
        return live ? 32 : 1;
      default:
        return live ? 12 : 3;
    }
  }

  async deriveAddress(params: {
    asset: string;
    chain: string;
    userId: string;
    index: number;
  }): Promise<DerivedAddress> {
    if (!this.configured) throw new Error('Custody provider is not configured');
    const xpub = xpubFor(params.asset);
    const accountId = accountIdFor(params.asset);
    if (accountId) {
      const { data } = await this.client.post(`/v3/offchain/account/${accountId}/address`);
      const address = data.address || data.xpub;
      if (!address) throw new Error('Provider did not return a deposit address');
      return { address, providerWalletId: data.id || accountId };
    }
    if (!xpub) throw new Error(`No xpub or provider wallet id configured for ${params.asset}`);
    const chain = pathFor(params.chain);
    const { data } = await this.client.get(`/v3/${chain}/address/${xpub}/${params.index}`, {
      params: this.mode === 'testnet' ? { type: 'testnet' } : undefined,
    });
    const address = data.address;
    if (!address) throw new Error('Provider did not return a derived address');
    return { address, providerWalletId: `${params.asset}:xpub:${params.index}` };
  }

  async listIncoming(params: { address: string; asset: string; chain: string }): Promise<IncomingTx[]> {
    if (!this.configured) return [];
    const chain = pathFor(params.chain);
    try {
      if (chain === 'bitcoin') {
        const { data } = await this.client.get(`/v3/bitcoin/transaction/address/${params.address}`, {
          params: { pageSize: 50 },
        });
        const rows = Array.isArray(data) ? data : [];
        return rows.flatMap((tx: { hash?: string; blockNumber?: number; outputs?: { address?: string; value?: number }[] }) => {
          const out = (tx.outputs || []).find((o) => o.address === params.address);
          if (!out || !tx.hash) return [];
          return [{
            txHash: tx.hash,
            amount: String(out.value ?? 0),
            confirmations: typeof tx.blockNumber === 'number' ? 1 : 0,
            from: undefined,
          }];
        });
      }
      if (chain === 'ethereum') {
        const { data } = await this.client.get(`/v3/ethereum/account/transaction/${params.address}`);
        const rows = Array.isArray(data) ? data : [];
        return rows.map((tx: { hash?: string; transactionHash?: string; value?: string; from?: string; blockNumber?: number }) => ({
          txHash: tx.hash || tx.transactionHash || '',
          amount: tx.value ? String(Number(tx.value) / 1e18) : '0',
          confirmations: tx.blockNumber ? 1 : 0,
          from: tx.from,
        })).filter((t: IncomingTx) => t.txHash);
      }
      const { data } = await this.client.get(`/v3/${chain}/account/transaction/${params.address}`);
      const rows = Array.isArray(data) ? data : data?.result || [];
      return rows.map((tx: { hash?: string; txId?: string; value?: string; amount?: string; from?: string }) => ({
        txHash: tx.hash || tx.txId || '',
        amount: String(tx.amount ?? tx.value ?? 0),
        confirmations: 1,
        from: tx.from,
      })).filter((t: IncomingTx) => t.txHash);
    } catch (err) {
      logger.warn(`Tatum listIncoming failed ${params.chain} ${params.address}: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  async broadcastWithdrawal(params: {
    asset: string;
    chain: string;
    toAddress: string;
    amount: string;
    providerWalletId: string;
    idempotencyKey: string;
  }): Promise<{ providerRef: string; txHash?: string }> {
    if (!this.configured) throw new Error('Custody provider is not configured');
    const senderAccountId = accountIdFor(params.asset) || params.providerWalletId;
    if (!senderAccountId) throw new Error(`No provider wallet id for ${params.asset}`);
    const { data } = await this.client.post(
      '/v3/offchain/withdrawal',
      {
        senderAccountId,
        address: params.toAddress,
        amount: params.amount,
        compliant: false,
        paymentId: params.idempotencyKey,
      },
    );
    return {
      providerRef: String(data.id || data.reference || params.idempotencyKey),
      txHash: data.txId || data.txHash,
    };
  }

  async getWithdrawalStatus(providerRef: string) {
    if (!this.configured) throw new Error('Custody provider is not configured');
    try {
      const { data } = await this.client.get(`/v3/offchain/withdrawal/${providerRef}`);
      const raw = String(data.status || data.state || 'pending').toLowerCase();
      const status =
        raw.includes('done') || raw.includes('complete') || raw.includes('confirm')
          ? 'confirmed'
          : raw.includes('fail') || raw.includes('reject') || raw.includes('error')
            ? 'failed'
            : raw.includes('tx') || raw.includes('sent') || raw.includes('broadcast')
              ? 'broadcast'
              : 'pending';
      return {
        status: status as 'pending' | 'broadcast' | 'confirmed' | 'failed',
        txHash: data.txId || data.txHash,
        confirmations: data.confirmations,
      };
    } catch (err) {
      logger.warn(`Tatum withdrawal status failed: ${err instanceof Error ? err.message : String(err)}`);
      return { status: 'pending' as const };
    }
  }
}

export const tatumCustody = new TatumCustody();
