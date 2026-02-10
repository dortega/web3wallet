import { homedir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_BASE_DIR = join(homedir(), '.web3-wallet');
export const DEFAULT_KEYSTORE_DIR = join(DEFAULT_BASE_DIR, 'keystores');
export const DEFAULT_CHAINS_CONFIG = join(DEFAULT_BASE_DIR, 'chains.json');
export const DEFAULT_TOKENS_CONFIG = join(DEFAULT_BASE_DIR, 'tokens.json');
