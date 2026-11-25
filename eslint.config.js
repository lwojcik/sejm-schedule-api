import { createConfig } from '@lwojcik/eslint-config';

export default createConfig({
  tsconfigRootDir: import.meta.dirname,
  importAliases: ['@sejm'],
  ignores: ['coverage/', 'dist/'],
  untypedFiles: ['vitest.config.ts', 'tsdown.config.ts', 'eslint.config.js'],
  nodeVersion: '>=24.0.0',
  overrides: [
    {
      files: ['src/**/*.ts'],
      rules: {
        'no-comments/disallowComments': [
          'error',
          { allow: ['global', 'eslint', '\\*'] },
        ],
        'max-len': [
          'error',
          {
            code: 80,
            ignoreComments: true,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true,
          },
        ],
        'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
        'unicorn/single-line-block-comment-style': 'off',
      },
    },
  ],
});
