import {
  createFsAdapter,
  createChainService,
  createKeystoreService,
  createWalletService,
  createProviderService,
  createBalanceService,
  createTransferService,
  createTokenService,
  createSettingsService,
  DEFAULT_KEYSTORE_DIR,
  DEFAULT_CHAINS_CONFIG,
  DEFAULT_TOKENS_CONFIG,
  DEFAULT_SETTINGS_CONFIG,
  type ChainService,
  type KeystoreService,
  type WalletService,
  type ProviderService,
  type BalanceService,
  type TransferService,
  type TokenService,
  type SettingsService,
  type ChainConfig,
} from '@web3-wallet/core';

export interface Services {
  chainService: ChainService;
  keystoreService: KeystoreService;
  walletService: WalletService;
  providerService: ProviderService;
  balanceService: BalanceService;
  transferService: TransferService;
  tokenService: TokenService;
  settingsService: SettingsService;
  getProvider: (chain: ChainConfig) => ReturnType<ProviderService['getProvider']>;
}

export function createServices(): Services {
  const fs = createFsAdapter();
  const chainService = createChainService(fs, DEFAULT_CHAINS_CONFIG);
  const keystoreService = createKeystoreService(fs, DEFAULT_KEYSTORE_DIR);
  const walletService = createWalletService(keystoreService);
  const providerService = createProviderService();
  const getProvider = providerService.getProvider.bind(providerService);
  const balanceService = createBalanceService(getProvider);
  const transferService = createTransferService(getProvider, keystoreService);
  const tokenService = createTokenService(fs, DEFAULT_TOKENS_CONFIG);
  const settingsService = createSettingsService(fs, DEFAULT_SETTINGS_CONFIG);

  return {
    chainService,
    keystoreService,
    walletService,
    providerService,
    balanceService,
    transferService,
    tokenService,
    settingsService,
    getProvider,
  };
}
