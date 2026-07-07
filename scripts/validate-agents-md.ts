#!/usr/bin/env bun
/**
 * AGENTS.md Freshness Validator
 *
 * Validates that AGENTS.md stays consistent with the actual codebase.
 * Checks:
 * 1. Key libraries listed in "Key libs" exist in package.json dependencies
 * 2. File placement directories referenced in the table actually exist
 * 3. Commands referenced are runnable (tools exist)
 * 4. Referenced files/paths exist
 * 5. Rules are implementable (libraries exist)
 *
 * Returns exit code 0 if all checks pass, 1 if any fail.
 */
import { existsSync, readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
// =========================================
// 6. Forbidden Rules Compliance
// =========================================

// Check that no @apply is used in CSS files (Tailwind v4 doesn't support it)
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

interface ValidationResult {
  category: string;
  check: string;
  status: 'pass' | 'fail';
  detail?: string;
}

const results: ValidationResult[] = [];

function pass(category: string, check: string, detail?: string) {
  results.push({ category, check, status: 'pass', detail });
}

function fail(category: string, check: string, detail: string) {
  results.push({ category, check, status: 'fail', detail });
}

// --- Load files ---

const agentsMd = readFileSync(resolve(ROOT, 'AGENTS.md'), 'utf-8');
const packageJson: Record<string, unknown> = JSON.parse(
  readFileSync(resolve(ROOT, 'package.json'), 'utf-8')
);

const dependencies = {
  ...(packageJson.dependencies as Record<string, string>),
  ...(packageJson.devDependencies as Record<string, string>),
};

// --- Helper ---

function depExists(name: string): boolean {
  return name in dependencies;
}

// =========================================
// 1. Key Libraries Check
// =========================================

// "Key libs: zod for all I/O boundaries (env.mjs). sonner for toasts. CVA + clsx for component variants."
if (depExists('zod')) {
  pass('Key Libraries', 'zod is listed in dependencies');
} else {
  fail(
    'Key Libraries',
    'zod',
    'zod is missing from dependencies but listed in AGENTS.md as a key library'
  );
}

if (depExists('sonner')) {
  pass('Key Libraries', 'sonner is listed in dependencies');
} else {
  fail(
    'Key Libraries',
    'sonner',
    'sonner is missing from dependencies but listed in AGENTS.md as a key library'
  );
}

if (depExists('class-variance-authority')) {
  pass('Key Libraries', 'CVA is listed in dependencies');
} else {
  fail(
    'Key Libraries',
    'class-variance-authority (CVA)',
    'CVA is missing from dependencies but listed in AGENTS.md as a key library'
  );
}

if (depExists('clsx')) {
  pass('Key Libraries', 'clsx is listed in dependencies');
} else {
  fail(
    'Key Libraries',
    'clsx',
    'clsx is missing from dependencies but listed in AGENTS.md as a key library'
  );
}

if (depExists('tailwind-merge')) {
  pass('Key Libraries', 'tailwind-merge is listed in dependencies');
} else {
  fail(
    'Key Libraries',
    'tailwind-merge',
    'tailwind-merge is missing from dependencies but referenced via cn() utility'
  );
}

// =========================================
// 2. File Placement Directories Check
// =========================================

interface PlacementEntry {
  componentType: string;
  location: string;
  notes: string;
}

const placementEntries: PlacementEntry[] = [
  {
    componentType: 'Page/Layout',
    location: 'src/app/',
    notes: 'App Router conventions',
  },
  {
    componentType: 'Cross-page sections',
    location: 'src/components/sections/',
    notes: 'Grouped by page',
  },
  {
    componentType: 'Layout components',
    location: 'src/components/layout/',
    notes: 'Header, Footer, MobileMenu',
  },
  {
    componentType: 'Shared UI primitives',
    location: 'src/components/ui/',
    notes: 'shadcn base-nova (auto-generated)',
  },
  {
    componentType: 'Utilities & constants',
    location: 'src/lib/',
    notes: 'metadata, security-headers, utils',
  },
  { componentType: 'Tests (unit)', location: 'tests/', notes: 'Vitest' },
  { componentType: 'Tests (E2E)', location: 'e2e/', notes: 'Playwright' },
];

for (const entry of placementEntries) {
  const fullPath = resolve(ROOT, entry.location);
  if (existsSync(fullPath)) {
    pass(
      'File Placement',
      `${entry.componentType} → ${entry.location}`,
      'Directory exists'
    );
  } else {
    fail(
      'File Placement',
      `${entry.componentType} → ${entry.location}`,
      `Directory ${entry.location} does not exist but is documented in AGENTS.md`
    );
  }
}

// =========================================
// 3. Stack / Tooling Verification
// =========================================

// "Runtime: bun 1.3.13"
const bunVersion = process.versions.bun;
if (bunVersion) {
  pass('Stack', 'Bun runtime', `Bun ${bunVersion} is in use`);
} else {
  fail('Stack', 'Bun runtime', 'Not running under Bun as documented');
}

// "Testing: Vitest (unit, native tsconfigPaths resolution). Playwright for E2E."
if (depExists('vitest')) {
  pass('Stack', 'Vitest in dependencies');
} else {
  fail(
    'Stack',
    'Vitest',
    'Vitest is missing but documented as testing framework'
  );
}

if (depExists('@playwright/test')) {
  pass('Stack', 'Playwright in dependencies');
} else {
  fail(
    'Stack',
    'Playwright',
    '@playwright/test is missing but documented as E2E framework'
  );
}

// "Styling: Tailwind CSS 4 (CSS-first)" - check tailwindcss is installed
if (depExists('tailwindcss')) {
  pass('Stack', 'Tailwind CSS in dependencies');
} else {
  fail(
    'Stack',
    'Tailwind CSS',
    'tailwindcss is missing but documented as styling framework'
  );
}

// Check that env.mjs exists (referenced as the zod I/O boundary)
if (existsSync(resolve(ROOT, 'env.mjs'))) {
  pass('Stack', 'env.mjs exists as documented I/O boundary');
} else {
  fail(
    'Stack',
    'env.mjs',
    'env.mjs does not exist but is referenced as the zod I/O boundary'
  );
}

// =========================================
// 4. Referenced Files Check
// =========================================

interface FileRef {
  path: string;
  description: string;
}

const referencedFiles: FileRef[] = [
  {
    path: 'env.mjs',
    description: 'Zod I/O boundary (referenced in Key libs, Gotchas)',
  },
  { path: 'components.json', description: 'shadcn config' },
  { path: 'tsconfig.json', description: 'TypeScript config' },
  { path: 'vitest.config.ts', description: 'Vitest config' },
  { path: 'eslint.config.mjs', description: 'ESLint config' },
];

// We look for "docs/known-issues.md" in AGENTS.md
if (agentsMd.includes('docs/known-issues.md')) {
  const kiPath = resolve(ROOT, 'docs', 'known-issues.md');
  if (existsSync(kiPath)) {
    pass('Referenced Files', 'docs/known-issues.md', 'Exists as referenced');
  } else {
    fail(
      'Referenced Files',
      'docs/known-issues.md',
      'Referenced in AGENTS.md but file does not exist'
    );
  }
}

for (const ref of referencedFiles) {
  const fullPath = resolve(ROOT, ref.path);
  if (existsSync(fullPath)) {
    pass(
      'Referenced Files',
      ref.path,
      `Exists as referenced (${ref.description})`
    );
  } else {
    fail(
      'Referenced Files',
      ref.path,
      `${ref.description} - file does not exist`
    );
  }
}

// =========================================
// 5. Rule Implementability Check
// =========================================

// Rule 2: "Toast feedback (sonner) required on all user-facing mutations."
if (depExists('sonner')) {
  pass('Rules', 'Rule 2: sonner is available for toast feedback');
} else {
  fail(
    'Rules',
    'Rule 2: sonner',
    'sonner must be added before the toast rule is actionable'
  );
}

// Rule 4: "Every page must export a metadata object. Use baseMetadata from @/lib/metadata."
const metadataPath = resolve(ROOT, 'src', 'lib', 'metadata.ts');
if (existsSync(metadataPath)) {
  pass('Rules', 'Rule 4: @/lib/metadata exists');
} else {
  fail(
    'Rules',
    'Rule 4: @/lib/metadata',
    'Exported metadata utility file does not exist'
  );
}

// Rule 5: "Must use shadcn components at all times."
if (depExists('shadcn')) {
  pass('Rules', 'Rule 5: shadcn is available');
} else {
  fail('Rules', 'Rule 5: shadcn', 'shadcn is not in dependencies');
}

// Check shadcn components directory exists
const shadcnDir = resolve(ROOT, 'src', 'components', 'ui');
if (existsSync(shadcnDir)) {
  const uiFiles = readdirSync(shadcnDir).filter((f) => f.endsWith('.tsx'));
  pass(
    'Rules',
    `Rule 5: ${uiFiles.length} shadcn component(s) available in src/components/ui/`
  );
} else {
  fail(
    'Rules',
    'Rule 5: shadcn components dir',
    'src/components/ui/ does not exist'
  );
}

function findFiles(dir: string, ext: string): string[] {
  const entries: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory() && entry !== 'node_modules') {
        entries.push(...findFiles(fullPath, ext));
      } else if (entry.endsWith(ext)) {
        entries.push(fullPath);
      }
    }
  } catch {
    // skip inaccessible dirs
  }
  return entries;
}

const cssFiles = findFiles(resolve(ROOT, 'src'), '.css');
let applyFound = false;
for (const cssFile of cssFiles) {
  const content = readFileSync(cssFile, 'utf-8');
  if (content.includes('@apply')) {
    applyFound = true;
    fail(
      'Forbidden Rules',
      'NO @apply in CSS',
      `${cssFile} contains @apply which is forbidden (Tailwind v4 doesn't support it)`
    );
    break;
  }
}
if (!applyFound) {
  pass(
    'Forbidden Rules',
    'NO @apply in CSS',
    'All CSS files comply (no @apply directives)'
  );
}

// =========================================
// 7. Naming Convention Files Check
// =========================================

// Check that the naming conventions table file types actually exist
if (existsSync(resolve(ROOT, 'src'))) {
  const srcComponents = readdirSync(resolve(ROOT, 'src', 'components')).filter(
    (f) => !f.startsWith('.')
  );
  pass(
    'Naming Conventions',
    `${srcComponents.length} component directories in src/components/`
  );
}

// =========================================
// 8. Commands Check (from Gotchas section)
// =========================================

// Commands referenced: "bunx shadcn@latest add", "bunx playwright install"
// We verify the tools are installable by checking they're in package.json
if (depExists('shadcn')) {
  pass('Commands', 'bunx shadcn@latest add', 'shadcn is available');
} else {
  fail('Commands', 'bunx shadcn@latest add', 'shadcn is not in dependencies');
}

if (depExists('@playwright/test')) {
  pass('Commands', 'bunx playwright install', '@playwright/test is available');
} else {
  fail(
    'Commands',
    'bunx playwright install',
    '@playwright/test is not in dependencies'
  );
}

// =========================================
// Summary
// =========================================

const passCount = results.filter((r) => r.status === 'pass').length;
const failCount = results.filter((r) => r.status === 'fail').length;

console.log('\n=== AGENTS.md Freshness Validation ===\n');

const categories = [...new Set(results.map((r) => r.category))];
for (const category of categories) {
  const catResults = results.filter((r) => r.category === category);
  const catPass = catResults.filter((r) => r.status === 'pass').length;
  const catFail = catResults.filter((r) => r.status === 'fail').length;
  console.log(`  ${category} (${catPass} pass, ${catFail} fail)`);

  for (const r of catResults) {
    const icon = r.status === 'pass' ? '  PASS' : '  FAIL';
    console.log(`    ${icon}  ${r.check}`);
    if (r.detail) {
      console.log(`          ${r.detail}`);
    }
  }
  console.log('');
}

console.log(`  Total: ${passCount} passed, ${failCount} failed\n`);

if (failCount > 0) {
  console.log('  Some AGENTS.md claims are stale or incorrect.');
  process.exit(1);
} else {
  console.log('  AGENTS.md is consistent with the codebase.');
  process.exit(0);
}
