import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWalletService } from './wallet.service.js';
import type { KeystoreService } from './keystore.service.js';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

function createMockKeystoreService(): KeystoreService {
  const store = new Map<string, { address: string; privateKey: string }>();

  return {
    save: vi.fn(async (account) => {
      store.set(account.address.toLowerCase(), {
        address: account.address,
        privateKey: account.privateKey,
      });
      return `/keystores/${account.address.toLowerCase()}.json`;
    }),
    load: vi.fn(async (address: string) => {
      const key = address.toLowerCase();
      const data = store.get(key);
      if (!data) throw new Error(`Keystore not found: ${address}`);
      return data as any;
    }),
    list: vi.fn(async () => Array.from(store.keys())),
    exists: vi.fn(async (address: string) => store.has(address.toLowerCase())),
    delete: vi.fn(async (address: string) => {
      store.delete(address.toLowerCase());
    }),
  };
}

describe('WalletService', () => {
  let keystoreService: ReturnType<typeof createMockKeystoreService>;

  beforeEach(() => {
    keystoreService = createMockKeystoreService();
  });

  it('create generates a new wallet and saves keystore', async () => {
    const service = createWalletService(keystoreService);
    const result = await service.create('password');

    expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.publicKey).toMatch(/^0x/);
    expect(result.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(keystoreService.save).toHaveBeenCalledOnce();
  });

  it('importFromPrivateKey imports wallet and saves keystore', async () => {
    const service = createWalletService(keystoreService);
    const address = await service.importFromPrivateKey(TEST_PRIVATE_KEY, 'password');

    expect(address.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
    expect(keystoreService.save).toHaveBeenCalledOnce();
  });

  it('importFromPrivateKey rejects invalid private key', async () => {
    const service = createWalletService(keystoreService);
    await expect(service.importFromPrivateKey('invalid', 'password')).rejects.toThrow();
  });

  it('importFromMnemonic imports wallet from 12-word phrase', async () => {
    const service = createWalletService(keystoreService);
    const phrase = 'test test test test test test test test test test test junk';
    const address = await service.importFromMnemonic(phrase, 'password');

    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(keystoreService.save).toHaveBeenCalledOnce();
    const savedAccount = vi.mocked(keystoreService.save).mock.calls[0]![0];
    expect(savedAccount.mnemonic).toBeDefined();
  });

  it('importFromMnemonic rejects invalid phrase', async () => {
    const service = createWalletService(keystoreService);
    await expect(service.importFromMnemonic('invalid phrase', 'password')).rejects.toThrow();
  });

  it('exportPrivateKey returns private key after decryption', async () => {
    const service = createWalletService(keystoreService);
    await service.importFromPrivateKey(TEST_PRIVATE_KEY, 'password');

    const privateKey = await service.exportPrivateKey(TEST_ADDRESS, 'password');
    expect(privateKey).toBe(TEST_PRIVATE_KEY);
  });

  it('getPublicKey returns public key after decryption', async () => {
    const service = createWalletService(keystoreService);
    await service.importFromPrivateKey(TEST_PRIVATE_KEY, 'password');

    const publicKey = await service.getPublicKey(TEST_ADDRESS, 'password');
    expect(publicKey).toMatch(/^0x/);
    expect(publicKey.length).toBe(132); // uncompressed public key
  });

  it('listWallets delegates to keystore list', async () => {
    const service = createWalletService(keystoreService);
    await service.importFromPrivateKey(TEST_PRIVATE_KEY, 'password');

    const wallets = await service.listWallets();
    expect(wallets.length).toBe(1);
  });
});
