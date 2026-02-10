import { dirname } from 'node:path';
import type { ChainConfig } from '../types/chain.types.js';
import type { FileSystem } from '../utils/fs-adapter.js';

const DEFAULT_CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    decimals: 18,
    explorerUrl: 'https://etherscan.io',
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'POL',
    rpcUrl: 'https://polygon-rpc.com',
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
];

export function createChainService(fs: FileSystem, configPath: string) {
  async function readChains(): Promise<ChainConfig[]> {
    if (!(await fs.exists(configPath))) {
      return [...DEFAULT_CHAINS];
    }
    const raw = await fs.readFile(configPath);
    return JSON.parse(raw) as ChainConfig[];
  }

  async function writeChains(chains: ChainConfig[]): Promise<void> {
    await fs.mkdir(dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(chains, null, 2));
  }

  return {
    async getChains(): Promise<ChainConfig[]> {
      return readChains();
    },

    async getChain(chainId: number): Promise<ChainConfig | undefined> {
      const chains = await readChains();
      return chains.find((c) => c.id === chainId);
    },

    async addChain(chain: ChainConfig): Promise<void> {
      const chains = await readChains();
      const existing = chains.findIndex((c) => c.id === chain.id);
      if (existing !== -1) {
        chains[existing] = chain;
      } else {
        chains.push(chain);
      }
      await writeChains(chains);
    },

    async removeChain(chainId: number): Promise<boolean> {
      const chains = await readChains();
      const filtered = chains.filter((c) => c.id !== chainId);
      if (filtered.length === chains.length) {
        return false;
      }
      await writeChains(filtered);
      return true;
    },

    getDefaultChains(): ChainConfig[] {
      return [...DEFAULT_CHAINS];
    },
  };
}

export type ChainService = ReturnType<typeof createChainService>;
