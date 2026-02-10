import { Contract, formatUnits } from 'ethers';
import type { ChainConfig, TokenConfig } from '../types/chain.types.js';
import type { ProviderGetter } from './provider.service.js';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export function createBalanceService(getProvider: ProviderGetter) {
  return {
    async getNativeBalance(
      address: string,
      chain: ChainConfig,
    ): Promise<string> {
      const provider = getProvider(chain);
      const balance = await provider.getBalance(address);
      return formatUnits(balance, chain.decimals);
    },

    async getTokenBalance(
      address: string,
      token: TokenConfig,
      chain: ChainConfig,
    ): Promise<string> {
      const provider = getProvider(chain);
      const contract = new Contract(token.address, ERC20_ABI, provider);
      const balance = await contract.balanceOf(address);
      return formatUnits(balance, token.decimals);
    },

    async getTokenInfo(
      tokenAddress: string,
      chain: ChainConfig,
    ): Promise<{ name: string; symbol: string; decimals: number }> {
      const provider = getProvider(chain);
      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      const [name, symbol, decimals] = await Promise.all([
        contract.name() as Promise<string>,
        contract.symbol() as Promise<string>,
        contract.decimals() as Promise<bigint>,
      ]);
      return { name, symbol, decimals: Number(decimals) };
    },
  };
}

export type BalanceService = ReturnType<typeof createBalanceService>;
