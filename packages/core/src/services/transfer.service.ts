import { Wallet, Contract, parseUnits } from 'ethers';
import type { ChainConfig, TokenConfig, TransferResult } from '../types/index.js';
import type { ProviderGetter } from './provider.service.js';
import type { KeystoreService, ProgressCallback } from './keystore.service.js';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
];

export type BulkProgressCallback = (completed: number, total: number) => void;

export function createTransferService(
  getProvider: ProviderGetter,
  keystoreService: KeystoreService,
) {
  async function getWallet(address: string, password: string, chain: ChainConfig) {
    const account = await keystoreService.load(address, password);
    const provider = getProvider(chain);
    return new Wallet(account.privateKey, provider);
  }

  return {
    async transferNative(
      from: string,
      password: string,
      to: string,
      amount: string,
      chain: ChainConfig,
    ): Promise<TransferResult> {
      const wallet = await getWallet(from, password, chain);
      const value = parseUnits(amount, chain.decimals);

      const tx = await wallet.sendTransaction({ to, value });
      const receipt = await tx.wait();

      return {
        to,
        amount,
        txHash: receipt?.hash ?? tx.hash,
        success: true,
      };
    },

    async transferToken(
      from: string,
      password: string,
      to: string,
      amount: string,
      token: TokenConfig,
      chain: ChainConfig,
    ): Promise<TransferResult> {
      const wallet = await getWallet(from, password, chain);
      const contract = new Contract(token.address, ERC20_ABI, wallet);
      const value = parseUnits(amount, token.decimals);

      const tx = await contract.transfer(to, value);
      const receipt = await tx.wait();

      return {
        to,
        amount,
        txHash: receipt?.hash ?? tx.hash,
        success: true,
      };
    },

    async bulkTransfer(
      from: string,
      password: string,
      transfers: { to: string; amount: string }[],
      chain: ChainConfig,
      token?: TokenConfig,
      onProgress?: BulkProgressCallback,
    ): Promise<TransferResult[]> {
      const account = await keystoreService.load(from, password);
      const provider = getProvider(chain);
      const wallet = new Wallet(account.privateKey, provider);

      const results: TransferResult[] = [];

      for (let i = 0; i < transfers.length; i++) {
        const { to, amount } = transfers[i]!;
        try {
          let txHash: string;

          if (token) {
            const contract = new Contract(token.address, ERC20_ABI, wallet);
            const value = parseUnits(amount, token.decimals);
            const tx = await contract.transfer(to, value);
            const receipt = await tx.wait();
            txHash = receipt?.hash ?? tx.hash;
          } else {
            const value = parseUnits(amount, chain.decimals);
            const tx = await wallet.sendTransaction({ to, value });
            const receipt = await tx.wait();
            txHash = receipt?.hash ?? tx.hash;
          }

          results.push({ to, amount, txHash, success: true });
        } catch (err) {
          results.push({
            to,
            amount,
            txHash: null,
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }

        onProgress?.(i + 1, transfers.length);
      }

      return results;
    },
  };
}

export type TransferService = ReturnType<typeof createTransferService>;
