import {
	createFsAdapter,
	createChainService,
	createKeystoreService,
	createWalletService,
	createProviderService,
	createBalanceService,
	createTransferService,
	createTokenService,
	DEFAULT_KEYSTORE_DIR,
	DEFAULT_CHAINS_CONFIG,
	DEFAULT_TOKENS_CONFIG,
} from '@web3-wallet/core';

const fs = createFsAdapter();

export const chainService = createChainService(fs, DEFAULT_CHAINS_CONFIG);
export const keystoreService = createKeystoreService(fs, DEFAULT_KEYSTORE_DIR);
export const walletService = createWalletService(keystoreService);
export const tokenService = createTokenService(fs, DEFAULT_TOKENS_CONFIG);

const providerService = createProviderService();
const getProvider = providerService.getProvider.bind(providerService);

export const balanceService = createBalanceService(getProvider);
export const transferService = createTransferService(getProvider, keystoreService);
