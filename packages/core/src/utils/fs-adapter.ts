import { readFile, writeFile, readdir, mkdir, access, rm } from 'node:fs/promises';

export interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readdir(path: string): Promise<string[]>;
  mkdir(path: string): Promise<void>;
  remove(path: string): Promise<void>;
}

export function createFsAdapter(): FileSystem {
  return {
    async readFile(path: string): Promise<string> {
      return readFile(path, 'utf-8');
    },

    async writeFile(path: string, data: string): Promise<void> {
      await writeFile(path, data, 'utf-8');
    },

    async exists(path: string): Promise<boolean> {
      try {
        await access(path);
        return true;
      } catch {
        return false;
      }
    },

    async readdir(path: string): Promise<string[]> {
      return readdir(path);
    },

    async mkdir(path: string): Promise<void> {
      await mkdir(path, { recursive: true });
    },

    async remove(path: string): Promise<void> {
      await rm(path);
    },
  };
}
