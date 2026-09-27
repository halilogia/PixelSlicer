import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const src = (segment: string) => fileURLToPath(new URL(segment, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': src('./src'),
      '@domain': src('./src/domain'),
      '@infrastructure': src('./src/infrastructure'),
      '@presentation': src('./src/presentation'),
      '@ui': src('./src/ui'),
      '@hooks': src('./src/hooks'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**/*.ts', 'src/infrastructure/atlas/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
