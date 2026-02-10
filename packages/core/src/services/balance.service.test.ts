import { describe, it, expect, vi } from 'vitest';
import { createBalanceService } from './balance.service.js';
import type { ChainConfig, TokenConfig } from '../types/chain.types.js';
import { Contract, formatUnits } from 'ethers';

vi.mock('ethers', async (importOriginal) => {
  const mod = await importOriginal<typeof import('ethers')>();
  return {
    ...mod,
    Contract: vi.fn(),
  };
});

const testChain: ChainConfig = {
  id: 1,
  name: 'Ethereum',
  symbol: 'ETH',
  rpcUrl: 'https://eth.llamarpc.com',
  decimals: 18,
};

const testToken: TokenConfig = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
  chainId: 1,
};

describe('BalanceService', () => {
  it('getNativeBalance formats balance correctly', async () => {
    const mockProvider = {
      getBalance: vi.fn(async () => 1000000000000000000n),
    };
    const getProvider = vi.fn(() => mockProvider as any);
    const service = createBalanceService(getProvider);

    const balance = await service.getNativeBalance('0xABC', testChain);
    expect(balance).toBe('1.0');
    expect(mockProvider.getBalance).toHaveBeenCalledWith('0xABC');
  });

  it('getTokenBalance calls contract balanceOf', async () => {
    const mockContract = {
      balanceOf: vi.fn(async () => 1000000n),
    };
    vi.mocked(Contract).mockImplementation(() => mockContract as any);

    const getProvider = vi.fn(() => ({}) as any);
    const service = createBalanceService(getProvider);

    const balance = await service.getTokenBalance('0xABC', testToken, testChain);
    expect(balance).toBe('1.0');
    expect(mockContract.balanceOf).toHaveBeenCalledWith('0xABC');
  });

  it('getTokenInfo reads token metadata', async () => {
    const mockContract = {
      name: vi.fn(async () => 'USD Coin'),
      symbol: vi.fn(async () => 'USDC'),
      decimals: vi.fn(async () => 6n),
    };
    vi.mocked(Contract).mockImplementation(() => mockContract as any);

    const getProvider = vi.fn(() => ({}) as any);
    const service = createBalanceService(getProvider);

    const info = await service.getTokenInfo(testToken.address, testChain);
    expect(info).toEqual({ name: 'USD Coin', symbol: 'USDC', decimals: 6 });
  });
});
