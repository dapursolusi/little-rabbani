# Level 2: Basic Confidence (20-40% pass rate)

These criteria establish baseline confidence that agents can navigate the project, build it, and follow project conventions.

**Repository pass rate for Level 2: 16/25 (64.0%) — 9 passing, 7 failing, 3 skipped**

## Criteria Checklist

- [x] **build_cmd_doc** - "bun run build" documented in README + AGENTS.md
- [x] **deps_pinned** - bun.lock committed
- [x] **vcs_cli_tools** - gh CLI authenticated
- [x] **agents_md** - Comprehensive AGENTS.md (5.7KB)
- [x] **pre_commit_hooks** - Husky + lint-staged + commitlint
- [x] **strict_typing** - TypeScript strict + noImplicitAny + strictNullChecks
- [x] **unit_tests_runnable** - Vitest runs successfully
- [x] **test_naming_conventions** - Vitest default patterns
- [x] **dependency_update_automation** - Dependabot + auto-merge configured
- [x] **automated_doc_generation** - Auto doc generation script + check in CI
- [x] **devcontainer** - .devcontainer configured (TS/Node, Bun, ESLint, Prettier, Tailwind)
- [x] **issue_templates** - Bug report + feature request templates created
- [x] **pr_templates** - pull_request_template.md created
- [x] **test_coverage_thresholds** - Coverage thresholds enforced in vitest (10% baseline)
- [x] **structured_logging** - pino logger with redaction at src/lib/logger.ts
- [x] **automated_security_review** - 1/1 (CodeQL + GitGuardian in CI)
- [ ] **automated_pr_review** - Needs user action
- [ ] **monorepo_tooling** - Skipped (single app)
- [ ] **local_services_setup** - Skipped (no external deps)
- [ ] **runbooks_documented** - Needs user action
- [ ] **branch_protection** - Skipped (no admin access)
- [ ] **codeowners** - Needs user action
- [ ] **issue_labeling_system** - Needs user action
- [ ] **database_schema** - Needs user action
- [ ] **error_tracking_contextualized** - Needs user action
- [ ] **secrets_management** - Needs user action

## Status

### Added Since Previous Report

- **automated_doc_generation** — `scripts/generate-docs.mjs` generates route map and component inventory to `docs/generated/`. Validated via `bun run docs:check` in CI.
- **devcontainer** — `.devcontainer/devcontainer.json` configured with Node/TS image, Bun, and VS Code extensions.
- **issue_templates** — `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`.
- **pr_templates** — `.github/pull_request_template.md` with testing checklist.
- **test_coverage_thresholds** — Vitest enforces minimum 10% coverage thresholds.
- **structured_logging** — `pino` installed, `src/lib/logger.ts` with redaction support.

### Needs User Decision

- **codeowners** — Define GitHub team handles before creating `.github/CODEOWNERS`.
- **automated_pr_review** — Configure review bot (droid review, danger.js, etc.).
- **issue_labeling_system** — Create issue labels on GitHub.
- **database_schema** — Write Drizzle schema files in `src/db/schema/`.
- **error_tracking_contextualized** — Set up Sentry project.
- **secrets_management** — Remove secrets from tracked `.env.*` files.
