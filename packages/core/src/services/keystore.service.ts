import { join } from 'node:path';
import { encryptKeystoreJson, decryptKeystoreJson } from 'ethers';
import type { KeystoreAccount } from 'ethers';
import type { FileSystem } from '../utils/fs-adapter.js';

export type ProgressCallback = (progress: number) => void;

export function createKeystoreService(fs: FileSystem, keystoreDir: string) {
  async function ensureDir(): Promise<void> {
    if (!(await fs.exists(keystoreDir))) {
      await fs.mkdir(keystoreDir);
    }
  }

  function filePath(address: string): string {
    const normalized = address.toLowerCase();
    return join(keystoreDir, `${normalized}.json`);
  }

  return {
    async save(
      account: KeystoreAccount,
      password: string,
      onProgress?: ProgressCallback,
    ): Promise<string> {
      await ensureDir();
      const json = await encryptKeystoreJson(account, password, {
        scrypt: { N: 131072 },
        progressCallback: onProgress,
      });
      const path = filePath(account.address);
      await fs.writeFile(path, json);
      return path;
    },

    async load(
      address: string,
      password: string,
      onProgress?: ProgressCallback,
    ): Promise<KeystoreAccount> {
      const path = filePath(address);
      const json = await fs.readFile(path);
      return decryptKeystoreJson(json, password, onProgress);
    },

    async list(): Promise<string[]> {
      await ensureDir();
      const files = await fs.readdir(keystoreDir);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''));
    },

    async exists(address: string): Promise<boolean> {
      return fs.exists(filePath(address));
    },

    async delete(address: string): Promise<void> {
      const path = filePath(address);
      await fs.remove(path);
    },
  };
}

export type KeystoreService = ReturnType<typeof createKeystoreService>;
