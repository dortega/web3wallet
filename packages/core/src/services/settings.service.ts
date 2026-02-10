import { dirname } from 'node:path';
import type { FileSystem } from '../utils/fs-adapter.js';

export interface AppSettings {
  currency: 'usd' | 'eur';
  showTestnets: boolean;
  privateWallets: boolean;
  privateBalances: boolean;
}

const DEFAULTS: AppSettings = {
  currency: 'usd',
  showTestnets: false,
  privateWallets: false,
  privateBalances: false,
};

export function createSettingsService(fs: FileSystem, configPath: string) {
  async function read(): Promise<AppSettings> {
    if (!(await fs.exists(configPath))) {
      return { ...DEFAULTS };
    }
    try {
      const raw = await fs.readFile(configPath);
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  }

  async function write(settings: AppSettings): Promise<void> {
    await fs.mkdir(dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(settings, null, 2));
  }

  return {
    async getSettings(): Promise<AppSettings> {
      return read();
    },

    async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
      const current = await read();
      const updated = { ...current, ...partial };
      await write(updated);
      return updated;
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
