import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChainService } from './chain.service.js';
import type { FileSystem } from '../utils/fs-adapter.js';

function createMockFs(files: Record<string, string> = {}): FileSystem {
  const store = { ...files };
  return {
    readFile: vi.fn(async (path: string) => {
      if (store[path] === undefined) throw new Error(`ENOENT: ${path}`);
      return store[path];
    }),
    writeFile: vi.fn(async (path: string, data: string) => {
      store[path] = data;
    }),
    exists: vi.fn(async (path: string) => path in store),
    readdir: vi.fn(async () => []),
    mkdir: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  };
}

describe('ChainService', () => {
  const configPath = '/test/chains.json';
  let fs: FileSystem;

  beforeEach(() => {
    fs = createMockFs();
  });

  it('returns default chains when no config file exists', async () => {
    const service = createChainService(fs, configPath);
    const chains = await service.getChains();
    expect(chains.length).toBe(5);
    expect(chains.map((c) => c.id)).toContain(1);
    expect(chains.map((c) => c.id)).toContain(137);
    expect(chains.map((c) => c.id)).toContain(11155111);
  });

  it('returns chains from config file when it exists', async () => {
    const custom = [{ id: 999, name: 'Custom', symbol: 'CST', rpcUrl: 'http://localhost:8545', decimals: 18 }];
    fs = createMockFs({ [configPath]: JSON.stringify(custom) });
    const service = createChainService(fs, configPath);

    const chains = await service.getChains();
    expect(chains).toEqual(custom);
  });

  it('getChain returns matching chain', async () => {
    const service = createChainService(fs, configPath);
    const chain = await service.getChain(1);
    expect(chain).toBeDefined();
    expect(chain!.name).toBe('Ethereum');
  });

  it('getChain returns undefined for unknown chain', async () => {
    const service = createChainService(fs, configPath);
    const chain = await service.getChain(99999);
    expect(chain).toBeUndefined();
  });

  it('addChain adds a new chain', async () => {
    const service = createChainService(fs, configPath);
    const newChain = { id: 10, name: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io', decimals: 18 };
    await service.addChain(newChain);

    const chains = await service.getChains();
    expect(chains.find((c) => c.id === 10)).toEqual(newChain);
  });

  it('addChain updates existing chain', async () => {
    const service = createChainService(fs, configPath);
    const updated = { id: 1, name: 'Ethereum Updated', symbol: 'ETH', rpcUrl: 'https://new-rpc.com', decimals: 18 };
    await service.addChain(updated);

    const chain = await service.getChain(1);
    expect(chain!.name).toBe('Ethereum Updated');
  });

  it('removeChain removes and returns true', async () => {
    const service = createChainService(fs, configPath);
    const result = await service.removeChain(1);
    expect(result).toBe(true);

    const chain = await service.getChain(1);
    expect(chain).toBeUndefined();
  });

  it('removeChain returns false for non-existent chain', async () => {
    const service = createChainService(fs, configPath);
    const result = await service.removeChain(99999);
    expect(result).toBe(false);
  });

  it('getDefaultChains returns a copy', () => {
    const service = createChainService(fs, configPath);
    const defaults = service.getDefaultChains();
    defaults.push({ id: 0, name: 'Fake', symbol: 'F', rpcUrl: '', decimals: 18 });
    expect(service.getDefaultChains().length).toBe(5);
  });

  it('Sepolia is marked as testnet', async () => {
    const service = createChainService(fs, configPath);
    const sepolia = await service.getChain(11155111);
    expect(sepolia).toBeDefined();
    expect(sepolia!.testnet).toBe(true);
  });

  it('mainnets are not marked as testnet', async () => {
    const service = createChainService(fs, configPath);
    const eth = await service.getChain(1);
    expect(eth!.testnet).toBeFalsy();
  });

  it('default chains have explorerUrl', async () => {
    const service = createChainService(fs, configPath);
    const chains = await service.getChains();
    for (const chain of chains) {
      expect(chain.explorerUrl).toBeDefined();
      expect(chain.explorerUrl).toMatch(/^https:\/\//);
    }
  });
});
