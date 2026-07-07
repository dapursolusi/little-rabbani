#!/usr/bin/env bun
/**
 * Automated Documentation Generator
 *
 * Generates documentation artifacts from the codebase:
 * 1. Architecture overview from source structure
 * 2. Component inventory from src/components/
 * 3. Route map from src/app/ directory structure
 *
 * Usage:
 *   bun run scripts/generate-docs.mjs          # Generate docs to docs/generated/
 *   bun run scripts/generate-docs.mjs --check   # Check existing docs are up-to-date
 */
import { readFileSync, writeFileSync, statSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'docs', 'generated');
const CHECK_MODE = process.argv.includes('--check');

function ensureDir(dir) {
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    // already exists
  }
}

function scanDir(dir, prefix = '') {
  const result = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === '.gitkeep' || entry === 'node_modules') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        result.push(`${prefix}${entry}/`);
        result.push(...scanDir(full, `${prefix}  `));
      } else {
        result.push(`${prefix}${entry}`);
      }
    }
  } catch {
    // skip inaccessible
  }
  return result;
}

function generateRouteMap() {
  const appDir = resolve(ROOT, 'src', 'app');
  const content = [
    '# Route Map',
    '',
    'Auto-generated from `src/app/` directory structure.',
    '',
    '```',
  ];
  content.push(...scanDir(appDir));
  content.push('```', '');
  return content.join('\n');
}

function generateComponentInventory() {
  const uiDir = resolve(ROOT, 'src', 'components', 'ui');
  const sectionsDir = resolve(ROOT, 'src', 'components', 'sections');
  const layoutDir = resolve(ROOT, 'src', 'components', 'layout');

  const content = [
    '# Component Inventory',
    '',
    'Auto-generated from `src/components/` directory structure.',
    '',
    '## UI Primitives (shadcn base-nova)',
    '```',
  ];
  content.push(...scanDir(uiDir));
  content.push('```', '');
  content.push('## Sections', '```');
  content.push(...scanDir(sectionsDir));
  content.push('```', '');
  content.push('## Layout', '```');
  content.push(...scanDir(layoutDir));
  content.push('```', '');
  return content.join('\n');
}

const generators = [
  { filename: 'routes.md', generate: generateRouteMap },
  { filename: 'components.md', generate: generateComponentInventory },
];

ensureDir(OUTPUT_DIR);

let changed = false;

for (const gen of generators) {
  const content = gen.generate();
  const filePath = join(OUTPUT_DIR, gen.filename);

  if (CHECK_MODE) {
    try {
      const existing = readFileSync(filePath, 'utf-8');
      if (existing !== content) {
        console.error(`❌ ${gen.filename} is stale — re-run scripts/generate-docs.mjs`);
        changed = true;
      } else {
        console.log(`✅ ${gen.filename} is up-to-date`);
      }
    } catch {
      console.error(`❌ ${gen.filename} is missing — re-run scripts/generate-docs.mjs`);
      changed = true;
    }
  } else {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`📝 Generated ${gen.filename}`);
  }
}

if (changed) {
  process.exit(1);
}
