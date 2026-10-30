import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    include: [
      'apps/api/test/**/*.e2e-spec.ts',
      '**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false
  }
});
