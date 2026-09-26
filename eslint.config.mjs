import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The Material Symbols stylesheet is loaded once in the App Router root layout.
      '@next/next/no-page-custom-font': 'off',
    },
  },
];

export default config;
