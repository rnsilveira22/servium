import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Nest depende de metadados de decorator que se perdem quando as
    // dependências ficam externalizadas no transform do vitest.
    server: {
      deps: {
        inline: [/@nestjs/, 'reflect-metadata', '@node-rs/argon2'],
      },
    },
  },
});
