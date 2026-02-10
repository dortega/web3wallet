import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTransferService } from './transfer.service.js';
import type { KeystoreService } from './keystore.service.js';
import type { ChainConfig } from '../types/index.js';
import { Wallet, Contract } from 'ethers';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const testChain: ChainConfig = {
  id: 11155111,
  name: 'Sepolia',
  symbol: 'ETH',
  rpcUrl: 'https://rpc.sepolia.org',
  decimals: 18,
};

vi.mock('ethers', async (importOriginal) => {
  const mod = await importOriginal<typeof import('ethers')>();
  return {
    ...mod,
    Wallet: vi.fn(),
    Contract: vi.fn(),
  };
});

function createMockKeystoreService(): KeystoreService {
  return {
    save: vi.fn(),
    load: vi.fn(async () => ({
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      privateKey: TEST_PRIVATE_KEY,
    })) as any,
    list: vi.fn(async () => []),
    exists: vi.fn(async () => true),
    delete: vi.fn(),
  };
}

describe('TransferService', () => {
  let keystoreService: KeystoreService;

  beforeEach(() => {
    keystoreService = createMockKeystoreService();
    vi.clearAllMocks();
  });

  it('transferNative decrypts wallet and sends transaction', async () => {
    const mockTx = { hash: '0xtxhash123', wait: vi.fn(async () => ({ hash: '0xtxhash123' })) };
    const mockWallet = { sendTransaction: vi.fn(async () => mockTx) };
    vi.mocked(Wallet).mockImplementation(() => mockWallet as any);

    const mockGetProvider = vi.fn(() => ({ getFeeData: vi.fn(async () => ({ gasPrice: 50000000000n })) }) as any);
    const service = createTransferService(mockGetProvider, keystoreService);

    const result = await service.transferNative('0xFrom', 'password', '0xTo', '0.1', testChain);

    expect(result.success).toBe(true);
    expect(result.txHash).toBe('0xtxhash123');
    expect(result.to).toBe('0xTo');
    expect(keystoreService.load).toHaveBeenCalledWith('0xFrom', 'password');
  });

  it('bulkTransfer processes all transfers and reports progress', async () => {
    let txCount = 0;
    const mockWallet = {
      sendTransaction: vi.fn(async () => {
        txCount++;
        return {
          hash: `0xtx${txCount}`,
          wait: vi.fn(async () => ({ hash: `0xtx${txCount}` })),
        };
      }),
    };
    vi.mocked(Wallet).mockImplementation(() => mockWallet as any);

    const mockGetProvider = vi.fn(() => ({ getFeeData: vi.fn(async () => ({ gasPrice: 50000000000n })) }) as any);
    const service = createTransferService(mockGetProvider, keystoreService);

    const progress = vi.fn();
    const results = await service.bulkTransfer(
      '0xFrom',
      'password',
      [
        { to: '0xA', amount: '0.1' },
        { to: '0xB', amount: '0.2' },
        { to: '0xC', amount: '0.3' },
      ],
      testChain,
      undefined,
      progress,
    );

    expect(results.length).toBe(3);
    expect(results.every((r) => r.success)).toBe(true);
    expect(progress).toHaveBeenCalledTimes(3);
    expect(progress).toHaveBeenCalledWith(1, 3);
    expect(progress).toHaveBeenCalledWith(3, 3);
    expect(keystoreService.load).toHaveBeenCalledOnce();
  });

  it('bulkTransfer continues on individual failure', async () => {
    let callIdx = 0;
    const mockWallet = {
      sendTransaction: vi.fn(async () => {
        callIdx++;
        if (callIdx === 2) throw new Error('insufficient funds');
        return {
          hash: `0xtx${callIdx}`,
          wait: vi.fn(async () => ({ hash: `0xtx${callIdx}` })),
        };
      }),
    };
    vi.mocked(Wallet).mockImplementation(() => mockWallet as any);

    const mockGetProvider = vi.fn(() => ({ getFeeData: vi.fn(async () => ({ gasPrice: 50000000000n })) }) as any);
    const service = createTransferService(mockGetProvider, keystoreService);

    const results = await service.bulkTransfer(
      '0xFrom',
      'password',
      [
        { to: '0xA', amount: '0.1' },
        { to: '0xB', amount: '0.2' },
        { to: '0xC', amount: '0.3' },
      ],
      testChain,
    );

    expect(results.length).toBe(3);
    expect(results[0]!.success).toBe(true);
    expect(results[1]!.success).toBe(false);
    expect(results[1]!.error).toBe('insufficient funds');
    expect(results[2]!.success).toBe(true);
  });
});
