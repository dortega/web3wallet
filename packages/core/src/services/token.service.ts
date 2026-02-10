import { dirname } from 'node:path';
import type { TokenConfig } from '../types/chain.types.js';
import type { FileSystem } from '../utils/fs-adapter.js';

const DEFAULT_TOKENS: TokenConfig[] = [
  // Ethereum (1)
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6, chainId: 1 },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6, chainId: 1 },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18, chainId: 1 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8, chainId: 1 },
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18, chainId: 1 },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', decimals: 18, chainId: 1 },
  // Polygon (137)
  { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6, chainId: 137 },
  { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6, chainId: 137 },
  { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC.e', decimals: 6, chainId: 137 },
  { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', decimals: 18, chainId: 137 },
  { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', decimals: 18, chainId: 137 },
  { address: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1', symbol: 'LINK', decimals: 18, chainId: 137 },
  // BNB Smart Chain (56)
  { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18, chainId: 56 },
  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18, chainId: 56 },
  { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'WETH', decimals: 18, chainId: 56 },
  { address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', symbol: 'LINK', decimals: 18, chainId: 56 },
  // Arbitrum One (42161)
  { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6, chainId: 42161 },
  { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6, chainId: 42161 },
  { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', decimals: 18, chainId: 42161 },
  { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18, chainId: 42161 },
  { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', symbol: 'LINK', decimals: 18, chainId: 42161 },
];

function tokenKey(chainId: number, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

interface CustomTokens {
  added: TokenConfig[];
  removed: string[]; // keys: "chainId:address"
}

export function createTokenService(fs: FileSystem, configPath: string) {
  async function readCustom(): Promise<CustomTokens> {
    if (!(await fs.exists(configPath))) {
      return { added: [], removed: [] };
    }
    const raw = await fs.readFile(configPath);
    const parsed = JSON.parse(raw);

    // Migrate old format (plain array) to new format
    if (Array.isArray(parsed)) {
      const defaultByKey = new Map(
        DEFAULT_TOKENS.map((t) => [tokenKey(t.chainId, t.address), t]),
      );
      const added: TokenConfig[] = [];
      for (const token of parsed as TokenConfig[]) {
        const key = tokenKey(token.chainId, token.address);
        const def = defaultByKey.get(key);
        if (!def || JSON.stringify(token) !== JSON.stringify(def)) {
          added.push(token);
        }
      }
      const custom: CustomTokens = { added, removed: [] };
      await writeCustom(custom);
      return custom;
    }

    return parsed as CustomTokens;
  }

  async function writeCustom(custom: CustomTokens): Promise<void> {
    await fs.mkdir(dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(custom, null, 2));
  }

  function mergeTokens(custom: CustomTokens): TokenConfig[] {
    const removedSet = new Set(custom.removed);
    const addedByKey = new Map(custom.added.map((t) => [tokenKey(t.chainId, t.address), t]));

    const merged: TokenConfig[] = [];
    for (const token of DEFAULT_TOKENS) {
      const key = tokenKey(token.chainId, token.address);
      if (removedSet.has(key)) continue;
      merged.push(addedByKey.get(key) ?? token);
      addedByKey.delete(key);
    }
    // Append custom tokens that don't override a default
    for (const token of addedByKey.values()) {
      merged.push(token);
    }
    return merged;
  }

  return {
    async getTokens(chainId?: number): Promise<TokenConfig[]> {
      const custom = await readCustom();
      const tokens = mergeTokens(custom);
      if (chainId === undefined) return tokens;
      return tokens.filter((t) => t.chainId === chainId);
    },

    async addToken(token: TokenConfig): Promise<void> {
      const custom = await readCustom();
      const key = tokenKey(token.chainId, token.address);
      const idx = custom.added.findIndex(
        (t) => tokenKey(t.chainId, t.address) === key,
      );
      if (idx !== -1) {
        custom.added[idx] = token;
      } else {
        custom.added.push(token);
      }
      // Un-remove if it was removed
      custom.removed = custom.removed.filter((k) => k !== key);
      await writeCustom(custom);
    },

    async removeToken(chainId: number, address: string): Promise<boolean> {
      const custom = await readCustom();
      const key = tokenKey(chainId, address);
      const isDefault = DEFAULT_TOKENS.some(
        (t) => tokenKey(t.chainId, t.address) === key,
      );
      const wasAdded = custom.added.some(
        (t) => tokenKey(t.chainId, t.address) === key,
      );

      if (!isDefault && !wasAdded) return false;

      custom.added = custom.added.filter(
        (t) => tokenKey(t.chainId, t.address) !== key,
      );
      if (isDefault && !custom.removed.includes(key)) {
        custom.removed.push(key);
      }
      await writeCustom(custom);
      return true;
    },

    getDefaultTokens(): TokenConfig[] {
      return [...DEFAULT_TOKENS];
    },
  };
}

export type TokenService = ReturnType<typeof createTokenService>;
