import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
