import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/test/**/*.{ts,tsx}'],
    coverage: {
      enabled: true,
      provider: 'v8', // or 'istanbul'
      include: ['packages/**/src/**/*.{ts,tsx}'],
    },
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
        emitDecoratorMetadata: true,
      } as any,
    },
  },
  resolve: {
    alias: {
      '@power-di/class-loader': path.resolve(__dirname, 'packages/class-loader/src/index.ts'),
      '@power-di/di': path.resolve(__dirname, 'packages/di/src/index.ts'),
      '@power-di/aspect': path.resolve(__dirname, 'packages/aspect/src/index.ts'),
      '@power-di/react': path.resolve(__dirname, 'packages/react/src/index.ts'),
      'power-di': path.resolve(__dirname, 'packages/legacy-di/src/index.ts'),
      'power-di/react': path.resolve(__dirname, 'packages/legacy-di/src/react.ts'),
      'power-di/utils': path.resolve(__dirname, 'packages/legacy-di/src/utils.ts'),
    },
  },
});
