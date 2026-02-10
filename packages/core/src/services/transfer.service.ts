import { Wallet, Contract, parseUnits } from 'ethers';
import type { JsonRpcProvider } from 'ethers';
import type { ChainConfig, TokenConfig, TransferResult } from '../types/index.js';
import type { ProviderGetter } from './provider.service.js';
import type { KeystoreService, ProgressCallback } from './keystore.service.js';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
];

export type BulkProgressCallback = (completed: number, total: number) => void;

/**
 * Detect if chain has proper EIP-1559 support by comparing maxFeePerGas with gasPrice.
 * If EIP-1559 fees are unreasonably low vs gasPrice, use legacy type 0 with gasPrice.
 */
async function getGasOverrides(provider: JsonRpcProvider): Promise<{ type: number; gasPrice?: bigint }> {
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 0n;
  const maxFeePerGas = feeData.maxFeePerGas;

  // If no EIP-1559 data, or maxFeePerGas is less than 10% of gasPrice → legacy
  if (!maxFeePerGas || (gasPrice > 0n && maxFeePerGas * 10n < gasPrice)) {
    return { type: 0, gasPrice };
  }

  // EIP-1559 looks correct, let ethers handle it
  return { type: 2 };
}

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
      const provider = getProvider(chain);
      const value = parseUnits(amount, chain.decimals);
      const gasOverrides = await getGasOverrides(provider);

      const tx = await wallet.sendTransaction({ to, value, ...gasOverrides });

      return {
        to,
        amount,
        txHash: tx.hash,
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
      const provider = getProvider(chain);
      const contract = new Contract(token.address, ERC20_ABI, wallet);
      const value = parseUnits(amount, token.decimals);
      const gasOverrides = await getGasOverrides(provider);

      const tx = await contract.transfer(to, value, { ...gasOverrides });

      return {
        to,
        amount,
        txHash: tx.hash,
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
      const gasOverrides = await getGasOverrides(provider);

      const results: TransferResult[] = [];

      for (let i = 0; i < transfers.length; i++) {
        const { to, amount } = transfers[i]!;
        try {
          let txHash: string;

          if (token) {
            const contract = new Contract(token.address, ERC20_ABI, wallet);
            const value = parseUnits(amount, token.decimals);
            const tx = await contract.transfer(to, value, { ...gasOverrides });
            txHash = tx.hash;
          } else {
            const value = parseUnits(amount, chain.decimals);
            const tx = await wallet.sendTransaction({ to, value, ...gasOverrides });
            txHash = tx.hash;
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
