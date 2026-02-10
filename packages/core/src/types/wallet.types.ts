export interface WalletInfo {
  address: string;
}

export interface WalletCreateResult {
  address: string;
  publicKey: string;
  privateKey: string;
}

export interface TransferRequest {
  to: string;
  amount: string;
}

export interface BulkTransferRequest {
  from: string;
  password: string;
  transfers: TransferRequest[];
  chainId: number;
  tokenAddress?: string;
}

export interface TransferResult {
  to: string;
  amount: string;
  txHash: string | null;
  success: boolean;
  error?: string;
}
