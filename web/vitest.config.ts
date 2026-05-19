import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['services/**/*.ts', 'hooks/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
