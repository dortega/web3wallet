import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['source/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
});
