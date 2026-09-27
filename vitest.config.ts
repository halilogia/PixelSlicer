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
    // The domain and infrastructure suites stay in plain Node; files marked with
    // `@vitest-environment happy-dom` get a DOM for the React tests.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/testUtils/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Everything under src/ is measured: a module that is not covered is a
      // module nobody is watching.
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/testUtils/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/**',
      ],
      // Per area floors: the pure logic must not silently rot, while the
      // untested UI can only hold the line it is at today.
      thresholds: {
        'src/domain/**': { lines: 90, functions: 95, branches: 85, statements: 90 },
        'src/infrastructure/atlas/**': { lines: 90, functions: 90, branches: 80, statements: 90 },
        'src/infrastructure/ExportService.ts': { lines: 90 },
        'src/infrastructure/ImageLoader.ts': { lines: 90 },
        'src/presentation/EditorViewModel.ts': { lines: 90 },
        'src/**': { lines: 70, functions: 72, branches: 85, statements: 70 },
      },
    },
  },
});
