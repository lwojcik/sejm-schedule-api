import { createConfig } from '@lwojcik/eslint-config';

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  importAliases: ['@sejm'],
  ignores: ['coverage/', 'dist/'],
  untypedFiles: ['vitest.config.ts', 'tsdown.config.ts', 'eslint.config.js'],
  nodeVersion: '>=24.0.0',
});
