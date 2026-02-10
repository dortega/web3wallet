import { JsonRpcProvider } from 'ethers';
import type { ChainConfig } from '../types/chain.types.js';

export function createProviderService() {
  const cache = new Map<number, JsonRpcProvider>();

  return {
    getProvider(chain: ChainConfig): JsonRpcProvider {
      const cached = cache.get(chain.id);
      if (cached) return cached;

      const provider = new JsonRpcProvider(chain.rpcUrl, {
        chainId: chain.id,
        name: chain.name,
      });
      cache.set(chain.id, provider);
      return provider;
    },

    clearProviders(): void {
      cache.clear();
    },
  };
}

export type ProviderService = ReturnType<typeof createProviderService>;
export type ProviderGetter = (chain: ChainConfig) => JsonRpcProvider;
