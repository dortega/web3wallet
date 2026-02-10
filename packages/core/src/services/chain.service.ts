import { dirname } from 'node:path';
import type { ChainConfig } from '../types/chain.types.js';
import type { FileSystem } from '../utils/fs-adapter.js';

const DEFAULT_CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    decimals: 18,
    explorerUrl: 'https://etherscan.io',
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'POL',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    decimals: 18,
    explorerUrl: 'https://polygonscan.com',
  },
  {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    decimals: 18,
    explorerUrl: 'https://bscscan.com',
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    decimals: 18,
    explorerUrl: 'https://arbiscan.io',
  },
  {
    id: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    decimals: 18,
    testnet: true,
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    decimals: 18,
    testnet: true,
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
];

interface CustomChains {
  added: ChainConfig[];
  removed: number[];
}

export function createChainService(fs: FileSystem, configPath: string) {
  async function readCustom(): Promise<CustomChains> {
    if (!(await fs.exists(configPath))) {
      return { added: [], removed: [] };
    }
    const raw = await fs.readFile(configPath);
    const parsed = JSON.parse(raw);

    // Migrate old format (plain array) to new format
    if (Array.isArray(parsed)) {
      const defaultById = new Map(DEFAULT_CHAINS.map((c) => [c.id, c]));
      const added: ChainConfig[] = [];
      for (const chain of parsed as ChainConfig[]) {
        const def = defaultById.get(chain.id);
        // Keep if: not a default, or is a default but user modified it
        if (!def || JSON.stringify(chain) !== JSON.stringify(def)) {
          added.push(chain);
        }
      }
      const custom: CustomChains = { added, removed: [] };
      await writeCustom(custom);
      return custom;
    }

    return parsed as CustomChains;
  }

  async function writeCustom(custom: CustomChains): Promise<void> {
    await fs.mkdir(dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(custom, null, 2));
  }

  function mergeChains(custom: CustomChains): ChainConfig[] {
    const removedSet = new Set(custom.removed);
    const addedById = new Map(custom.added.map((c) => [c.id, c]));

    const merged: ChainConfig[] = [];
    for (const chain of DEFAULT_CHAINS) {
      if (removedSet.has(chain.id)) continue;
      merged.push(addedById.get(chain.id) ?? chain);
      addedById.delete(chain.id);
    }
    // Append custom chains that don't override a default
    for (const chain of addedById.values()) {
      merged.push(chain);
    }
    return merged;
  }

  return {
    async getChains(): Promise<ChainConfig[]> {
      const custom = await readCustom();
      return mergeChains(custom);
    },

    async getChain(chainId: number): Promise<ChainConfig | undefined> {
      const chains = await this.getChains();
      return chains.find((c) => c.id === chainId);
    },

    async addChain(chain: ChainConfig): Promise<void> {
      const custom = await readCustom();
      const idx = custom.added.findIndex((c) => c.id === chain.id);
      if (idx !== -1) {
        custom.added[idx] = chain;
      } else {
        custom.added.push(chain);
      }
      // If it was removed before, un-remove it
      custom.removed = custom.removed.filter((id) => id !== chain.id);
      await writeCustom(custom);
    },

    async removeChain(chainId: number): Promise<boolean> {
      const custom = await readCustom();
      const isDefault = DEFAULT_CHAINS.some((c) => c.id === chainId);
      const wasAdded = custom.added.some((c) => c.id === chainId);

      if (!isDefault && !wasAdded) return false;

      custom.added = custom.added.filter((c) => c.id !== chainId);
      if (isDefault && !custom.removed.includes(chainId)) {
        custom.removed.push(chainId);
      }
      await writeCustom(custom);
      return true;
    },

    getDefaultChains(): ChainConfig[] {
      return [...DEFAULT_CHAINS];
    },
  };
}

export type ChainService = ReturnType<typeof createChainService>;
