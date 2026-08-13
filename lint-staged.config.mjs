export default {
  'src/**/*.{js,jsx,ts,tsx,mjs,mts}': ['eslint --fix', 'prettier --write'],
  'src/**/*.{json,md,css,yml,yaml}': ['prettier --write'],
  'AGENTS.md': ['bun run validate:agents-md'],
};
