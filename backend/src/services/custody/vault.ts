import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import type { CustodyProvider, DerivedAddress, IncomingTx } from './provider';

export const USDT_ETH = '0xdac17f958d2ee523a2206206994597c13d831ec7';

export const VAULTS: Record<string, { chain: string; address: string; tatum: string }> = {
  BTC: { chain: 'bitcoin', address: env.VAULT_BTC, tatum: 'bitcoin' },
  ETH: { chain: 'ethereum', address: env.VAULT_ETH, tatum: 'ethereum' },
  USDT: { chain: 'ethereum', address: env.VAULT_USDT_ETH, tatum: 'ethereum' },
  BNB: { chain: 'bsc', address: env.VAULT_BNB, tatum: 'bsc' },
  DOGE: { chain: 'dogecoin', address: env.VAULT_DOGE, tatum: 'dogecoin' },
  TRX: { chain: 'tron', address: env.VAULT_TRX, tatum: 'tron' },
};

export function vaultFor(asset: string) {
  return VAULTS[asset.toUpperCase()];
}

function norm(addr: string) {
  return (addr || '').trim().toLowerCase();
}

function sameAddr(a: string, b: string) {
  return norm(a) === norm(b);
}

class VaultCustody implements CustodyProvider {
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
    return Boolean(
      env.TATUM_API_KEY &&
        env.VAULT_BTC &&
        env.VAULT_ETH &&
        env.VAULT_USDT_ETH &&
        env.VAULT_BNB &&
        env.VAULT_DOGE &&
        env.VAULT_TRX,
    );
  }

  requiredConfirmations(asset: string, _chain: string): number {
    const live = this.mode === 'live';
    switch (asset.toUpperCase()) {
      case 'BTC':
        return live ? 3 : 1;
      case 'DOGE':
        return live ? 6 : 1;
      case 'ETH':
      case 'USDT':
        return live ? 12 : 3;
      case 'BNB':
        return live ? 15 : 3;
      case 'TRX':
        return live ? 19 : 3;
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
    const vault = vaultFor(params.asset);
    if (!vault?.address) throw new Error(`No mapped vault for ${params.asset}`);
    return { address: vault.address, providerWalletId: `vault:${params.asset}` };
  }

  async verifyIncoming(params: {
    txHash: string;
    asset: string;
    chain: string;
    address: string;
  }): Promise<IncomingTx | null> {
    if (!this.configured) return null;
    const asset = params.asset.toUpperCase();
    const vault = vaultFor(asset);
    if (!vault) return null;
    try {
      if (asset === 'USDT') return await this.verifyUsdtEth(params.txHash, vault.address);
      if (vault.tatum === 'bitcoin' || vault.tatum === 'dogecoin') {
        return await this.verifyUtxo(vault.tatum, params.txHash, vault.address);
      }
      if (vault.tatum === 'tron') return await this.verifyTron(params.txHash, vault.address);
      return await this.verifyEvm(vault.tatum, params.txHash, vault.address);
    } catch (err) {
      logger.warn(`Vault verify failed ${asset} ${params.txHash}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async listIncoming(params: { address: string; asset: string; chain: string }): Promise<IncomingTx[]> {
    return [];
  }

  async broadcastWithdrawal(): Promise<{ providerRef: string; txHash?: string }> {
    throw new Error('Vault withdrawals are not signed from this process. Configure Tatum KMS / virtual account ids to broadcast.');
  }

  async getWithdrawalStatus() {
    return { status: 'pending' as const };
  }

  private async height(path: string): Promise<number> {
    if (path === 'bitcoin' || path === 'dogecoin') {
      const { data } = await this.client.get(`/v3/${path}/info`);
      return Number(data.blocks || data.chain || 0);
    }
    if (path === 'tron') {
      const { data } = await this.client.get('/v3/tron/info');
      return Number(data.blockNumber || data.headBlockNumber || 0);
    }
    const { data } = await this.client.get(`/v3/${path}/block/current`);
    return Number(typeof data === 'number' ? data : data.blockNumber || data);
  }

  private async verifyUtxo(path: string, hash: string, vault: string): Promise<IncomingTx | null> {
    const { data } = await this.client.get(`/v3/${path}/transaction/${hash}`);
    const outs: { address?: string; value?: number | string }[] = data.outputs || data.vout || [];
    const hit = outs.find((o) => o.address && sameAddr(o.address, vault));
    if (!hit || !data.hash && !data.txid) return null;
    const tip = await this.height(path);
    const block = Number(data.blockNumber || data.height || 0);
    const conf = block > 0 && tip >= block ? tip - block + 1 : 0;
    return {
      txHash: String(data.hash || data.txid || hash),
      amount: String(hit.value ?? 0),
      confirmations: conf,
    };
  }

  private async verifyEvm(path: string, hash: string, vault: string): Promise<IncomingTx | null> {
    const { data } = await this.client.get(`/v3/${path}/transaction/${hash}`);
    const to = data.to || data.toAddress;
    if (!to || !sameAddr(to, vault)) return null;
    const tip = await this.height(path);
    const block = Number(data.blockNumber || 0);
    const conf = block > 0 && tip >= block ? tip - block + 1 : 0;
    const wei = data.value != null ? String(data.value) : '0';
    const amount = Number(wei) / 1e18;
    if (!(amount > 0)) return null;
    return {
      txHash: String(data.hash || data.transactionHash || hash),
      amount: String(amount),
      confirmations: conf,
      from: data.from,
    };
  }

  private async verifyUsdtEth(hash: string, vault: string): Promise<IncomingTx | null> {
    const { data } = await this.client.get(`/v3/ethereum/transaction/${hash}`);
    const transfers: {
      to?: string;
      toAddress?: string;
      tokenAddress?: string;
      contractAddress?: string;
      value?: string;
      amount?: string;
    }[] = data.tokenTransfers || data.transfers || [];
    const hit = transfers.find((t) => {
      const token = t.tokenAddress || t.contractAddress || '';
      const to = t.to || t.toAddress || '';
      return sameAddr(token, USDT_ETH) && sameAddr(to, vault);
    });
    if (!hit) return null;
    const tip = await this.height('ethereum');
    const block = Number(data.blockNumber || 0);
    const conf = block > 0 && tip >= block ? tip - block + 1 : 0;
    const raw = hit.value || hit.amount || '0';
    const amount = Number(raw) > 1e4 ? Number(raw) / 1e6 : Number(raw);
    if (!(amount > 0)) return null;
    return {
      txHash: String(data.hash || hash),
      amount: String(amount),
      confirmations: conf,
      from: data.from,
    };
  }

  private async verifyTron(hash: string, vault: string): Promise<IncomingTx | null> {
    const { data } = await this.client.get(`/v3/tron/transaction/${hash}`);
    const to = data.toAddress || data.to || data.rawData?.contract?.[0]?.parameter?.value?.toAddress;
    const amountRaw =
      data.amount ??
      data.rawData?.contract?.[0]?.parameter?.value?.amount ??
      0;
    if (to && !sameAddr(String(to), vault) && String(to) !== vault) {
      const hexOk = String(data.to || '').toLowerCase();
      if (hexOk && !sameAddr(hexOk, vault) && String(data.toAddress || '') !== vault) {
        return null;
      }
    }
    const tip = await this.height('tron');
    const block = Number(data.blockNumber || data.block || 0);
    const conf = block > 0 && tip >= block ? tip - block + 1 : 0;
    const sun = Number(amountRaw);
    const amount = sun > 1e4 ? sun / 1e6 : sun;
    if (!(amount > 0)) return null;
    return {
      txHash: String(data.txID || data.hash || hash),
      amount: String(amount),
      confirmations: conf,
    };
  }
}

export const vaultCustody = new VaultCustody();
