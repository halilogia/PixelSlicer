import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@domain': '/src/domain',
      '@infrastructure': '/src/infrastructure',
      '@presentation': '/src/presentation',
      '@ui': '/src/ui',
    },
  },
});