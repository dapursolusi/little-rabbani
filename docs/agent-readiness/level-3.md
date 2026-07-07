# Level 3: Moderate Confidence (40-60% pass rate)

These criteria demonstrate that the project has quality monitoring, CI discipline, and documentation practices that enable agents to work more independently.

**Repository pass rate for Level 3: 8/29 (27.6%)**

## Criteria Checklist

- [x] **agentic_development** - .factory/ + .agents/ with ponytail skills configured
- [x] **single_command_setup** - "bun install && bun run dev" documented
- [x] **skills** - ponytail skills in .factory/skills/ with valid SKILL.md
- [x] **documentation_freshness** - Key docs modified in last 180 days
- [x] **service_flow_documented** - CONTEXT.md domain model + ADRs + PRD
- [x] **secret_scanning** - GitGuardian + CodeQL in CI
- [x] **naming_consistency** - Naming conventions documented in AGENTS.md
- [ ] **large_file_detection** - No file size checks or LFS
- [ ] **tech_debt_tracking** - No TODO/FIXME scanner or SonarQube
- [ ] **release_notes_automation** - No changelog generation
- [ ] **dead_feature_flag_detection** - Skipped (no feature flags)
- [ ] **release_automation** - No CD pipeline or semantic-release
- [ ] **devcontainer_runnable** - Skipped (no devcontainer)
- [ ] **min_release_age** - No dependency delay policy
- [ ] **dead_code_detection** - No knip/unimported
- [ ] **duplicate_code_detection** - No jscpd/SonarQube CPD
- [ ] **unused_dependencies_detection** - No depcheck/knip
- [ ] **integration_tests_exist** - e2e/ is empty (.gitkeep only)
- [ ] **test_performance_tracking** - No timing or analytics
- [ ] **api_schema_docs** - Skipped (Server Actions, no REST API)
- [ ] **distributed_tracing** - No OpenTelemetry or tracing
- [ ] **metrics_collection** - No metrics instrumentation
- [ ] **alerting_configured** - No PagerDuty/OpsGenie
- [ ] **health_checks** - Skipped (not deployed)
- [ ] **pii_handling** - PII-relevant domain but no tooling
- [ ] **log_scrubbing** - No log sanitization
- [ ] **product_analytics_instrumentation** - No analytics tools
- [ ] **version_drift_detection** - Skipped (single app)
- [ ] **flaky_test_detection** - No retry config or tracking

## Action Items

### 1. Add dead code detection

Configure knip to detect unused exports, files, and dependencies:

```bash
bun add -d knip
# Create knip.json
```

### 2. Add integration/E2E tests

Populate the e2e/ directory with at least one Playwright test. Playwright is already configured.

### 3. Add structured logging

Install a logging library and configure it:

```bash
bun add pino
```

Create a logger module at `src/lib/logger.ts` for consistent structured logging across the app.
