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

export function createTokenService(fs: FileSystem, configPath: string) {
  async function readTokens(): Promise<TokenConfig[]> {
    if (!(await fs.exists(configPath))) {
      return [...DEFAULT_TOKENS];
    }
    const raw = await fs.readFile(configPath);
    return JSON.parse(raw) as TokenConfig[];
  }

  async function writeTokens(tokens: TokenConfig[]): Promise<void> {
    await fs.mkdir(dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(tokens, null, 2));
  }

  return {
    async getTokens(chainId?: number): Promise<TokenConfig[]> {
      const tokens = await readTokens();
      if (chainId === undefined) return tokens;
      return tokens.filter((t) => t.chainId === chainId);
    },

    async addToken(token: TokenConfig): Promise<void> {
      const tokens = await readTokens();
      const key = `${token.chainId}:${token.address.toLowerCase()}`;
      const idx = tokens.findIndex(
        (t) => `${t.chainId}:${t.address.toLowerCase()}` === key,
      );
      if (idx !== -1) {
        tokens[idx] = token;
      } else {
        tokens.push(token);
      }
      await writeTokens(tokens);
    },

    async removeToken(chainId: number, address: string): Promise<boolean> {
      const tokens = await readTokens();
      const lower = address.toLowerCase();
      const filtered = tokens.filter(
        (t) => !(t.chainId === chainId && t.address.toLowerCase() === lower),
      );
      if (filtered.length === tokens.length) return false;
      await writeTokens(filtered);
      return true;
    },

    getDefaultTokens(): TokenConfig[] {
      return [...DEFAULT_TOKENS];
    },
  };
}

export type TokenService = ReturnType<typeof createTokenService>;
