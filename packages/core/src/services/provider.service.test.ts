import { describe, it, expect } from 'vitest';
import { createProviderService } from './provider.service.js';
import type { ChainConfig } from '../types/chain.types.js';

const testChain: ChainConfig = {
  id: 11155111,
  name: 'Sepolia',
  symbol: 'ETH',
  rpcUrl: 'https://rpc.sepolia.org',
  decimals: 18,
};

describe('ProviderService', () => {
  it('getProvider returns a provider for a chain', () => {
    const service = createProviderService();
    const provider = service.getProvider(testChain);
    expect(provider).toBeDefined();
  });

  it('getProvider caches providers by chainId', () => {
    const service = createProviderService();
    const p1 = service.getProvider(testChain);
    const p2 = service.getProvider(testChain);
    expect(p1).toBe(p2);
  });

  it('clearProviders clears the cache', () => {
    const service = createProviderService();
    const p1 = service.getProvider(testChain);
    service.clearProviders();
    const p2 = service.getProvider(testChain);
    expect(p1).not.toBe(p2);
  });
});
