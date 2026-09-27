import { ethers } from 'ethers';
import { env } from '../config/env';

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;

  private init(): void {
    const rpc = env.TATUM_JSON_RPC || env.ETHEREUM_RPC_URL;
    if (!rpc) return;
    if (!this.provider) {
      if (env.TATUM_API_KEY && /tatum\.io/i.test(rpc)) {
        const req = new ethers.FetchRequest(rpc);
        req.setHeader("x-api-key", env.TATUM_API_KEY);
        this.provider = new ethers.JsonRpcProvider(req);
      } else {
        this.provider = new ethers.JsonRpcProvider(rpc);
      }
    }
  }

  async getETHBalance(walletAddress: string): Promise<string> {
    this.init();
    if (!this.provider) return '0';
    const balance = await this.provider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  }

  async isValidAddress(address: string): Promise<boolean> {
    return ethers.isAddress(address);
  }
}

export const blockchainService = new BlockchainService();
