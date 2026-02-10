import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSettingsService } from './settings.service.js';
import type { FileSystem } from '../utils/fs-adapter.js';

function createMockFs(files: Record<string, string> = {}): FileSystem {
  const store = { ...files };
  return {
    readFile: vi.fn(async (path: string) => {
      if (store[path] === undefined) throw new Error(`ENOENT: ${path}`);
      return store[path];
    }),
    writeFile: vi.fn(async (path: string, data: string) => {
      store[path] = data;
    }),
    exists: vi.fn(async (path: string) => path in store),
    readdir: vi.fn(async () => []),
    mkdir: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  };
}

describe('SettingsService', () => {
  const configPath = '/test/settings.json';
  let fs: FileSystem;

  beforeEach(() => {
    fs = createMockFs();
  });

  it('returns defaults when no config file exists', async () => {
    const service = createSettingsService(fs, configPath);
    const settings = await service.getSettings();
    expect(settings).toEqual({
      currency: 'usd',
      showTestnets: false,
      privateWallets: false,
      privateBalances: false,
    });
  });

  it('reads settings from file', async () => {
    fs = createMockFs({
      [configPath]: JSON.stringify({ currency: 'eur', showTestnets: true }),
    });
    const service = createSettingsService(fs, configPath);
    const settings = await service.getSettings();
    expect(settings.currency).toBe('eur');
    expect(settings.showTestnets).toBe(true);
    expect(settings.privateWallets).toBe(false);
  });

  it('updateSettings merges and persists', async () => {
    const service = createSettingsService(fs, configPath);
    const updated = await service.updateSettings({ currency: 'eur' });
    expect(updated.currency).toBe('eur');
    expect(updated.showTestnets).toBe(false);

    const reread = await service.getSettings();
    expect(reread.currency).toBe('eur');
  });

  it('updateSettings preserves existing values', async () => {
    const service = createSettingsService(fs, configPath);
    await service.updateSettings({ currency: 'eur', showTestnets: true });
    await service.updateSettings({ privateWallets: true });

    const settings = await service.getSettings();
    expect(settings.currency).toBe('eur');
    expect(settings.showTestnets).toBe(true);
    expect(settings.privateWallets).toBe(true);
  });

  it('handles corrupted config file gracefully', async () => {
    fs = createMockFs({ [configPath]: 'not json' });
    const service = createSettingsService(fs, configPath);
    const settings = await service.getSettings();
    expect(settings).toEqual({
      currency: 'usd',
      showTestnets: false,
      privateWallets: false,
      privateBalances: false,
    });
  });
});
