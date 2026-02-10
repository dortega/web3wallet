import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createKeystoreService } from './keystore.service.js';
import type { FileSystem } from '../utils/fs-adapter.js';
import type { KeystoreAccount } from 'ethers';

function createMockFs(): FileSystem & { store: Record<string, string> } {
  const store: Record<string, string> = {};
  return {
    store,
    readFile: vi.fn(async (path: string) => {
      if (store[path] === undefined) throw new Error(`ENOENT: ${path}`);
      return store[path];
    }),
    writeFile: vi.fn(async (path: string, data: string) => {
      store[path] = data;
    }),
    exists: vi.fn(async (path: string) => path in store),
    readdir: vi.fn(async () =>
      Object.keys(store)
        .filter((k) => k.startsWith('/keystores/'))
        .map((k) => k.replace('/keystores/', '')),
    ),
    mkdir: vi.fn(async () => {}),
    remove: vi.fn(async (path: string) => {
      delete store[path];
    }),
  };
}

vi.mock('ethers', async () => {
  return {
    encryptKeystoreJson: vi.fn(async (account: KeystoreAccount) => {
      return JSON.stringify({ address: account.address, encrypted: true });
    }),
    decryptKeystoreJson: vi.fn(async (json: string) => {
      const parsed = JSON.parse(json);
      return {
        address: parsed.address,
        privateKey: '0xmockprivkey',
      } as unknown as KeystoreAccount;
    }),
  };
});

describe('KeystoreService', () => {
  const keystoreDir = '/keystores';
  let fs: ReturnType<typeof createMockFs>;

  beforeEach(() => {
    fs = createMockFs();
    vi.clearAllMocks();
  });

  it('save encrypts and writes keystore file', async () => {
    const service = createKeystoreService(fs, keystoreDir);
    const account = { address: '0xAbC123', privateKey: '0x123' } as unknown as KeystoreAccount;

    const path = await service.save(account, 'password');

    expect(path).toBe('/keystores/0xabc123.json');
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.store['/keystores/0xabc123.json']).toBeDefined();
  });

  it('load reads and decrypts keystore file', async () => {
    const service = createKeystoreService(fs, keystoreDir);
    fs.store['/keystores/0xabc123.json'] = JSON.stringify({ address: '0xabc123', encrypted: true });

    const account = await service.load('0xAbC123', 'password');

    expect(account.address).toBe('0xabc123');
  });

  it('list returns addresses from keystore directory', async () => {
    const service = createKeystoreService(fs, keystoreDir);
    fs.store['/keystores/0xaaa.json'] = '{}';
    fs.store['/keystores/0xbbb.json'] = '{}';

    const addresses = await service.list();
    expect(addresses).toEqual(['0xaaa', '0xbbb']);
  });

  it('exists returns true when keystore file exists', async () => {
    const service = createKeystoreService(fs, keystoreDir);
    fs.store['/keystores/0xabc.json'] = '{}';

    expect(await service.exists('0xAbc')).toBe(true);
  });

  it('exists returns false when keystore file does not exist', async () => {
    const service = createKeystoreService(fs, keystoreDir);
    expect(await service.exists('0xNONE')).toBe(false);
  });

  it('delete removes keystore file', async () => {
    const service = createKeystoreService(fs, keystoreDir);
    fs.store['/keystores/0xabc.json'] = '{}';

    await service.delete('0xAbc');
    expect(fs.store['/keystores/0xabc.json']).toBeUndefined();
  });
});
