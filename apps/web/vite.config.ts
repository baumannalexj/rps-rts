import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/${p}/src/index.ts`, import.meta.url));

export default defineConfig({
  // Relative base so the build works at https://<user>.github.io/<repo>/ and anywhere else.
  base: './',
  resolve: {
    alias: {
      '@rps/contracts': pkg('contracts'),
      '@rps/core': pkg('core'),
    },
  },
  build: { outDir: 'dist', target: 'es2022', sourcemap: true },
});
