import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTokenService } from './token.service.js';
import type { FileSystem } from '../utils/fs-adapter.js';

function createMockFs(): FileSystem {
  const files = new Map<string, string>();
  return {
    readFile: vi.fn(async (path: string) => {
      const content = files.get(path);
      if (!content) throw new Error(`File not found: ${path}`);
      return content;
    }),
    writeFile: vi.fn(async (path: string, data: string) => {
      files.set(path, data);
    }),
    exists: vi.fn(async (path: string) => files.has(path)),
    readdir: vi.fn(async () => []),
    mkdir: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  };
}

describe('TokenService', () => {
  let fs: ReturnType<typeof createMockFs>;
  const configPath = '/test/tokens.json';

  beforeEach(() => {
    fs = createMockFs();
  });

  it('returns default tokens when no config file exists', async () => {
    const service = createTokenService(fs, configPath);
    const tokens = await service.getTokens();

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some((t) => t.symbol === 'USDT')).toBe(true);
  });

  it('filters tokens by chainId', async () => {
    const service = createTokenService(fs, configPath);
    const ethTokens = await service.getTokens(1);

    expect(ethTokens.every((t) => t.chainId === 1)).toBe(true);
    expect(ethTokens.length).toBeGreaterThan(0);
  });

  it('merges defaults with custom tokens', async () => {
    const custom = {
      added: [{ address: '0x1234567890abcdef1234567890abcdef12345678', symbol: 'TEST', decimals: 18, chainId: 1 }],
      removed: [],
    };
    fs = createMockFs();
    // Manually set the file
    await fs.writeFile(configPath, JSON.stringify(custom));
    vi.mocked(fs.writeFile).mockClear();

    const service = createTokenService(fs, configPath);
    const tokens = await service.getTokens(1);
    expect(tokens.some((t) => t.symbol === 'TEST')).toBe(true);
    expect(tokens.some((t) => t.symbol === 'USDT')).toBe(true);
  });

  it('addToken persists a new custom token', async () => {
    const service = createTokenService(fs, configPath);
    const token = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      symbol: 'TEST',
      decimals: 18,
      chainId: 1,
    };

    await service.addToken(token);
    const tokens = await service.getTokens(1);
    expect(tokens.some((t) => t.symbol === 'TEST')).toBe(true);
    // Defaults still present
    expect(tokens.some((t) => t.symbol === 'USDT')).toBe(true);
  });

  it('addToken overrides default token with same address', async () => {
    const service = createTokenService(fs, configPath);
    const token = {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT-UPDATED',
      decimals: 6,
      chainId: 1,
    };

    await service.addToken(token);
    const tokens = await service.getTokens(1);
    const usdt = tokens.filter(
      (t) => t.address.toLowerCase() === token.address.toLowerCase(),
    );
    expect(usdt).toHaveLength(1);
    expect(usdt[0]!.symbol).toBe('USDT-UPDATED');
  });

  it('removeToken removes a default token', async () => {
    const service = createTokenService(fs, configPath);
    const removed = await service.removeToken(
      1,
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    );

    expect(removed).toBe(true);
    const tokens = await service.getTokens(1);
    expect(
      tokens.some(
        (t) =>
          t.address.toLowerCase() ===
          '0xdac17f958d2ee523a2206206994597c13d831ec7',
      ),
    ).toBe(false);
  });

  it('removeToken removes a custom token', async () => {
    const service = createTokenService(fs, configPath);
    const token = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      symbol: 'TEST',
      decimals: 18,
      chainId: 1,
    };
    await service.addToken(token);
    const removed = await service.removeToken(1, token.address);
    expect(removed).toBe(true);

    const tokens = await service.getTokens(1);
    expect(tokens.some((t) => t.symbol === 'TEST')).toBe(false);
  });

  it('removeToken returns false for nonexistent token', async () => {
    const service = createTokenService(fs, configPath);
    const removed = await service.removeToken(1, '0x0000000000000000000000000000000000000000');

    expect(removed).toBe(false);
  });

  it('addToken un-removes a previously removed default', async () => {
    const service = createTokenService(fs, configPath);
    await service.removeToken(1, '0xdAC17F958D2ee523a2206206994597C13D831ec7');

    const tokensBefore = await service.getTokens(1);
    expect(tokensBefore.some((t) => t.address.toLowerCase() === '0xdac17f958d2ee523a2206206994597c13d831ec7')).toBe(false);

    await service.addToken({
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      decimals: 6,
      chainId: 1,
    });

    const tokensAfter = await service.getTokens(1);
    expect(tokensAfter.some((t) => t.address.toLowerCase() === '0xdac17f958d2ee523a2206206994597c13d831ec7')).toBe(true);
  });

  it('migrates old format (plain array) to new format', async () => {
    const oldFormat = [
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6, chainId: 1 },
      { address: '0x9999999999999999999999999999999999999999', symbol: 'CUSTOM', decimals: 18, chainId: 1 },
    ];
    await fs.writeFile(configPath, JSON.stringify(oldFormat));
    vi.mocked(fs.writeFile).mockClear();

    const service = createTokenService(fs, configPath);
    const tokens = await service.getTokens(1);

    // Default USDT still present + custom token migrated
    expect(tokens.some((t) => t.symbol === 'USDT')).toBe(true);
    expect(tokens.some((t) => t.symbol === 'CUSTOM')).toBe(true);
    // File rewritten in new format
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('getDefaultTokens returns a copy', () => {
    const service = createTokenService(fs, configPath);
    const a = service.getDefaultTokens();
    const b = service.getDefaultTokens();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
