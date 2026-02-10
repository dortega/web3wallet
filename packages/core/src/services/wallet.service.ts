import { Wallet } from 'ethers';
import type { WalletCreateResult } from '../types/wallet.types.js';
import type { KeystoreService, ProgressCallback } from './keystore.service.js';

export function createWalletService(keystoreService: KeystoreService) {
  return {
    async create(
      password: string,
      onProgress?: ProgressCallback,
    ): Promise<WalletCreateResult> {
      const wallet = Wallet.createRandom();
      await keystoreService.save(
        {
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic: wallet.mnemonic ?? undefined,
        },
        password,
        onProgress,
      );
      return {
        address: wallet.address,
        publicKey: wallet.signingKey.publicKey,
        privateKey: wallet.privateKey,
      };
    },

    async importFromPrivateKey(
      privateKey: string,
      password: string,
      onProgress?: ProgressCallback,
    ): Promise<string> {
      const wallet = new Wallet(privateKey);
      await keystoreService.save(
        { address: wallet.address, privateKey: wallet.privateKey },
        password,
        onProgress,
      );
      return wallet.address;
    },

    async importFromMnemonic(
      phrase: string,
      password: string,
      onProgress?: ProgressCallback,
    ): Promise<string> {
      const wallet = Wallet.fromPhrase(phrase);
      await keystoreService.save(
        {
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic: wallet.mnemonic ?? undefined,
        },
        password,
        onProgress,
      );
      return wallet.address;
    },

    async exportPrivateKey(
      address: string,
      password: string,
      onProgress?: ProgressCallback,
    ): Promise<string> {
      const account = await keystoreService.load(address, password, onProgress);
      return account.privateKey;
    },

    async getPublicKey(
      address: string,
      password: string,
      onProgress?: ProgressCallback,
    ): Promise<string> {
      const account = await keystoreService.load(address, password, onProgress);
      const wallet = new Wallet(account.privateKey);
      return wallet.signingKey.publicKey;
    },

    async deleteWallet(address: string): Promise<void> {
      return keystoreService.delete(address);
    },

    async listWallets(): Promise<string[]> {
      return keystoreService.list();
    },
  };
}

export type WalletService = ReturnType<typeof createWalletService>;
