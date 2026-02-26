import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/test/**/*.test.{ts,tsx}'],
    setupFiles: ['vitest.setup.ts'],
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
  },
});
