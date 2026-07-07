# Level 3: Moderate Confidence (40-60% pass rate)

These criteria demonstrate that the project has quality monitoring, CI discipline, and documentation practices that enable agents to work more independently.

**Repository pass rate for Level 3: 21/29 (72.4%) — 21 passing, 3 failing, 5 skipped**

## Criteria Checklist

- [x] **agentic_development** - .factory/ + .agents/ with ponytail skills configured
- [x] **single_command_setup** - "bun install && bun run dev" documented
- [x] **skills** - ponytail skills in .factory/skills/ with valid SKILL.md
- [x] **documentation_freshness** - Key docs modified in last 180 days
- [x] **service_flow_documented** - CONTEXT.md domain model + ADRs + PRD
- [x] **secret_scanning** - GitGuardian + CodeQL in CI
- [x] **naming_consistency** - Naming conventions documented in AGENTS.md
- [x] **large_file_detection** - Pre-commit hook warns on files >1MB
- [x] **tech_debt_tracking** - TODO/FIXME/HACK scanner (scripts/check-todos.mjs)
- [x] **min_release_age** - Renovate config with minimumReleaseAge
- [x] **dead_code_detection** - knip configured (knip.json)
- [x] **duplicate_code_detection** - jscpd configured (.jscpd.json)
- [x] **unused_dependencies_detection** - knip detects unused dependencies
- [x] **test_performance_tracking** - Vitest verbose reporter + timeout
- [x] **distributed_tracing** - Request ID middleware (src/middleware.ts)
- [x] **log_scrubbing** - pino logger configured with redaction
- [x] **flaky_test_detection** - Vitest retry: 2
- [x] **release_notes_automation** - .changeset/config.json for automated changelog generation
- [x] **release_automation** - release-please workflow (.github/workflows/release-please.yml)
- [x] **integration_tests_exist** - playwright.config.ts + e2e/homepage.spec.ts with 3 Playwright tests
- [x] **pii_handling** - src/lib/pii.ts with detectPiiField, maskPiiValue, maskPiiFields for kid/guardian data
- [ ] **dead_feature_flag_detection** - Skipped (no feature flags — see Level 4)
- [ ] **devcontainer_runnable** - Skipped (no devcontainer CLI)
- [ ] **api_schema_docs** - Skipped (Server Actions)
- [ ] **metrics_collection** - Needs user action
- [ ] **alerting_configured** - Needs user action
- [ ] **health_checks** - Skipped (not deployed)
- [ ] **product_analytics_instrumentation** - Needs user action

## Status

### Added Since Previous Report

- **large_file_detection** — Pre-commit hook warns on staged files exceeding 1MB.
- **tech_debt_tracking** — `scripts/check-todos.mjs` scans source files for TODO/FIXME/HACK markers. Runs in CI.
- **min_release_age** — `.github/renovate.json` with `minimumReleaseAge` (7d default, 3d minor/patch, 14d major).
- **dead_code_detection** — `knip.json` configured. Reports unused files, dependencies, and exports.
- **duplicate_code_detection** — `.jscpd.json` configured for clone detection (0.2 threshold).
- **unused_dependencies_detection** — Knip covers unused deps.
- **test_performance_tracking** — Vitest verbose reporter with 10s timeout.
- **distributed_tracing** — `src/middleware.ts` adds `X-Request-Id` / `X-Trace-Id` headers.
- **log_scrubbing** — pino logger with redact for passwords, secrets, tokens, API keys, PII.
- **flaky_test_detection** — Vitest `retry: 2` configured.
- **release_notes_automation** — `.changeset/config.json` with changesets for automated changelog.
- **release_automation** — `.github/workflows/release-please.yml` creates releases on push to main.
- **integration_tests_exist** — `playwright.config.ts` + `e2e/homepage.spec.ts` with 3 smoke tests.
- **pii_handling** — `src/lib/pii.ts` with 11 unit tests covering detection, masking, and object scanning.

### Needs User Decision

- **metrics_collection / alerting / product_analytics** — Require external accounts.
