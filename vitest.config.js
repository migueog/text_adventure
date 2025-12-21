import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/main.jsx',
      ],
      // Target thresholds for future milestones
      // Currently disabled to allow gradual test implementation
      // thresholds: {
      //   lines: 85,
      //   functions: 85,
      //   branches: 85,
      //   statements: 85,
      // },
    },
  },
});
