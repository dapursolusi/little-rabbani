#!/usr/bin/env bun
/**
 * TODO/FIXME/HACK Scanner
 *
 * Scans source files for technical debt markers (TODO, FIXME, HACK, XXX)
 * and reports them with file paths and line numbers.
 * Optionally requires TODOs to reference a ticket number (TODO(TICKET-123)).
 *
 * Usage:
 *   bun run scripts/check-todos.mjs
 *   bun run scripts/check-todos.mjs --require-ticket  # Enforce TODO(TICKET-123) format
 */
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const REQUIRE_TICKET = process.argv.includes('--require-ticket');

const SOURCE_DIRS = ['src', 'e2e', 'tests', 'scripts'];
const IGNORE_PATTERNS = ['node_modules', '.next', 'dist', 'coverage', 'src/components/ui', 'scripts/check-todos.mjs'];

const TODO_PATTERN = /\b(TODO|FIXME|HACK|XXX|WORKAROUND|TEMPORARY)\b/;
const TICKET_PATTERN = /TODO\(\S+\)/;

const findings = [];

function isSourceFile(filePath) {
  const ext = extname(filePath);
  return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts'].includes(ext);
}

function shouldIgnore(path) {
  return IGNORE_PATTERNS.some((p) => path.includes(p));
}

function scanDir(dir) {
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      if (shouldIgnore(fullPath)) continue;

      if (statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (isSourceFile(fullPath)) {
        scanFile(fullPath);
      }
    }
  } catch {
    // skip inaccessible dirs
  }
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(TODO_PATTERN);
    if (match) {
      const tag = match[0];
      const hasTicket = TICKET_PATTERN.test(lines[i]);
      findings.push({
        file: filePath.replace(ROOT + '/', ''),
        line: i + 1,
        content: lines[i].trim(),
        tag,
        hasTicket,
      });
    }
  }
}

for (const dir of SOURCE_DIRS) {
  const fullPath = resolve(ROOT, dir);
  try {
    if (statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    }
  } catch {
    // skip missing dirs
  }
}

// Also scan config files at root
for (const configFile of ['env.mjs', 'next.config.ts', 'vitest.config.ts']) {
  const fullPath = resolve(ROOT, configFile);
  try {
    if (statSync(fullPath).isFile()) {
      scanFile(fullPath);
    }
  } catch {
    // skip missing files
  }
}

console.log('\n=== Technical Debt Scanner ===\n');

if (findings.length === 0) {
  console.log('  No TODO/FIXME/HACK markers found. Clean codebase.\n');
  process.exit(0);
}

// Sort: items without tickets first
findings.sort((a, b) => {
  if (a.hasTicket !== b.hasTicket) return a.hasTicket ? 1 : -1;
  return a.file.localeCompare(b.file);
});

let noTicketCount = 0;
let withTicketCount = 0;

for (const f of findings) {
  const ticketMark = f.hasTicket ? ' [ticketed]' : ' [NO TICKET]';
  console.log(`  ${f.file}:${f.line}  ${f.tag}${ticketMark}`);
  console.log(`      ${f.content}`);
  if (f.hasTicket) withTicketCount++;
  else noTicketCount++;
}

console.log(`\n  Total: ${findings.length} markers (${noTicketCount} without ticket, ${withTicketCount} with ticket)\n`);

if (REQUIRE_TICKET && noTicketCount > 0) {
  console.log('  FAIL: All TODOs must reference a ticket (TODO(TICKET-123)).\n');
  process.exit(1);
}

process.exit(0);
