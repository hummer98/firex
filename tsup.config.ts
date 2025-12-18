import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/commands/*.ts',
    'src/services/*.ts',
    'src/domain/*.ts',
    'src/presentation/*.ts',
    'src/shared/*.ts',
    '!src/**/*.test.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  target: 'node18',
  outDir: 'dist',
});
