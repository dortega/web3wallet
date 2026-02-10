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
    expect(chains.length).toBe(6);
    expect(chains.map((c) => c.id)).toContain(1);
    expect(chains.map((c) => c.id)).toContain(137);
    expect(chains.map((c) => c.id)).toContain(11155111);
    expect(chains.map((c) => c.id)).toContain(421614);
  });

  it('merges defaults with custom chains from config', async () => {
    const custom = { added: [{ id: 999, name: 'Custom', symbol: 'CST', rpcUrl: 'http://localhost:8545', decimals: 18 }], removed: [] };
    fs = createMockFs({ [configPath]: JSON.stringify(custom) });
    const service = createChainService(fs, configPath);

    const chains = await service.getChains();
    expect(chains.length).toBe(7); // 6 defaults + 1 custom
    expect(chains.find((c) => c.id === 999)).toBeDefined();
    expect(chains.find((c) => c.id === 1)).toBeDefined();
  });

  it('migrates old format (plain array) to new format', async () => {
    const oldFormat = [
      { id: 1, name: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://ethereum-rpc.publicnode.com', decimals: 18, explorerUrl: 'https://etherscan.io' },
      { id: 999, name: 'Custom', symbol: 'CST', rpcUrl: 'http://localhost:8545', decimals: 18 },
    ];
    fs = createMockFs({ [configPath]: JSON.stringify(oldFormat) });
    const service = createChainService(fs, configPath);

    const chains = await service.getChains();
    // 6 defaults + 1 custom (unchanged default discarded, custom kept)
    expect(chains.length).toBe(7);
    expect(chains.find((c) => c.id === 999)!.name).toBe('Custom');
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('migration preserves user-modified defaults as overrides', async () => {
    const oldFormat = [
      { id: 1, name: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://custom-rpc.example.com', decimals: 18 },
      { id: 999, name: 'Custom', symbol: 'CST', rpcUrl: 'http://localhost:8545', decimals: 18 },
    ];
    fs = createMockFs({ [configPath]: JSON.stringify(oldFormat) });
    const service = createChainService(fs, configPath);

    const chains = await service.getChains();
    // Modified Ethereum override + 5 other defaults + 1 custom
    expect(chains.length).toBe(7);
    const eth = chains.find((c) => c.id === 1)!;
    expect(eth.rpcUrl).toBe('https://custom-rpc.example.com');
  });

  it('custom chain overrides default with same id', async () => {
    const custom = {
      added: [{ id: 1, name: 'Ethereum Custom', symbol: 'ETH', rpcUrl: 'https://custom-rpc.com', decimals: 18 }],
      removed: [],
    };
    fs = createMockFs({ [configPath]: JSON.stringify(custom) });
    const service = createChainService(fs, configPath);

    const eth = await service.getChain(1);
    expect(eth!.name).toBe('Ethereum Custom');
    expect(eth!.rpcUrl).toBe('https://custom-rpc.com');
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

  it('addChain adds a new custom chain', async () => {
    const service = createChainService(fs, configPath);
    const newChain = { id: 10, name: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io', decimals: 18 };
    await service.addChain(newChain);

    const chains = await service.getChains();
    expect(chains.find((c) => c.id === 10)).toEqual(newChain);
    expect(chains.length).toBe(7);
  });

  it('addChain overrides a default chain', async () => {
    const service = createChainService(fs, configPath);
    const updated = { id: 1, name: 'Ethereum Updated', symbol: 'ETH', rpcUrl: 'https://new-rpc.com', decimals: 18 };
    await service.addChain(updated);

    const chain = await service.getChain(1);
    expect(chain!.name).toBe('Ethereum Updated');
  });

  it('removeChain removes default chain and returns true', async () => {
    const service = createChainService(fs, configPath);
    const result = await service.removeChain(1);
    expect(result).toBe(true);

    const chain = await service.getChain(1);
    expect(chain).toBeUndefined();
  });

  it('removeChain removes custom chain and returns true', async () => {
    const service = createChainService(fs, configPath);
    await service.addChain({ id: 10, name: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io', decimals: 18 });

    const result = await service.removeChain(10);
    expect(result).toBe(true);
    expect(await service.getChain(10)).toBeUndefined();
  });

  it('removeChain returns false for non-existent chain', async () => {
    const service = createChainService(fs, configPath);
    const result = await service.removeChain(99999);
    expect(result).toBe(false);
  });

  it('addChain un-removes a previously removed default', async () => {
    const service = createChainService(fs, configPath);
    await service.removeChain(1);
    expect(await service.getChain(1)).toBeUndefined();

    await service.addChain({ id: 1, name: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://ethereum-rpc.publicnode.com', decimals: 18 });
    expect(await service.getChain(1)).toBeDefined();
  });

  it('getDefaultChains returns a copy', () => {
    const service = createChainService(fs, configPath);
    const defaults = service.getDefaultChains();
    defaults.push({ id: 0, name: 'Fake', symbol: 'F', rpcUrl: '', decimals: 18 });
    expect(service.getDefaultChains().length).toBe(6);
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
