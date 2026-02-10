export interface ChainConfig {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  decimals: number;
  testnet?: boolean;
  explorerUrl?: string;
}

export interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
}
