// eslint-plugin-react 7.x is incompatible with ESLint 10.
// ESLint 10 removed context.getFilename() — the plugin uses it
// in lib/util/version.js to detect React version.
// Patch: use context.filename (direct property) instead.
// Remove when eslint-plugin-react ships a compatible version (8.x+).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const filePath = require.resolve('eslint-plugin-react/lib/util/version.js');

// ponytail: https://unpkg.com/eslint-plugin-react@7.37.5/lib/util/version.js
// line 31: const filename = ... contextOrFilename.getFilename();
// ESLint 10 replaced context.getFilename() with context.filename
let src = readFileSync(filePath, 'utf8');
const patched = src.replace(
  'contextOrFilename.getFilename()',
  'contextOrFilename.filename'
);

if (src !== patched) {
  writeFileSync(filePath, patched);
  console.log('[postinstall] patched eslint-plugin-react for ESLint 10 compat');
} else {
  console.log('[postinstall] eslint-plugin-react already patched or compat');
}
