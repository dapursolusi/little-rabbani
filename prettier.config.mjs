/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 80,
  plugins: [
    'prettier-plugin-tailwindcss',
    '@trivago/prettier-plugin-sort-imports',
  ],
  importOrder: [
    '^react$',
    '^next/(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^@/components/(.*)$',
    '^@/lib/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

export default config;
