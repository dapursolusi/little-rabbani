# Agent Readiness Report

**Repository:** `git@github.com:narasena/little-rabbani`
**Branch:** main
**Commit:** c07c7c5
**Level:** 2 (34.85% pass rate)
**Report ID:** 187ff7d4-25b2-4145-a8b2-a0f6793b1523

## Applications

1. `.` - Next.js full-stack web template with opinionated tooling (shadcn/ui, Tailwind v4, Vitest, Playwright, Husky, Drizzle ORM placeholder)

## Summary

This is a well-structured Next.js template with solid foundational tooling. It excels in code quality basics (ESLint, TypeScript strict, Prettier, Husky), CI fundamentals, and agent configuration. However, it lacks env templates, test files, observability infrastructure, and has secrets tracked in version control.

## Criteria by Category

### Style & Validation

- lint_config: 1/1 - ESLint configured
- type_check: 1/1 - TypeScript strict: true
- formatter: 1/1 - Prettier configured
- pre_commit_hooks: 1/1 - Husky + lint-staged + commitlint
- strict_typing: 1/1 - strict + noImplicitAny + strictNullChecks
- naming_consistency: 1/1 - Conventions in AGENTS.md
- cyclomatic_complexity: 0/1 - No complexity analysis
- dead_code_detection: 0/1 - No knip/unimported
- duplicate_code_detection: 0/1 - No jscpd/SonarQube CPD
- code_modularization: 0/1 - No boundary enforcement

### Build System

- build_cmd_doc: 1/1 - "bun run build" documented
- deps_pinned: 1/1 - bun.lock committed
- vcs_cli_tools: 1/1 - gh CLI authenticated
- build_performance_tracking: 0/1 - No caching/metrics
- single_command_setup: 1/1 - "bun install && bun run dev"
- heavy_dependency_detection: 0/1 - No bundle analyzer
- unused_dependencies_detection: 0/1 - No depcheck/knip

### Testing

- unit_tests_exist: 0/1 - No test files
- integration_tests_exist: 0/1 - e2e/ is empty
- unit_tests_runnable: 1/1 - Vitest runs successfully
- test_performance_tracking: 0/1 - No timing/analytics
- flaky_test_detection: 0/1 - No retry config
- test_coverage_thresholds: 0/1 - No threshold enforced
- test_naming_conventions: 1/1 - Vitest defaults
- test_isolation: 1/1 - Vitest parallel threads

### Documentation

- agents_md: 1/1 - Comprehensive (5.7KB)
- readme: 1/1 - Setup, scripts, structure
- automated_doc_generation: 0/1 - No doc generation
- skills: 1/1 - ponytail skills configured
- documentation_freshness: 1/1 - Docs updated recently
- service_flow_documented: 1/1 - CONTEXT.md + ADRs + PRD
- agents_md_validation: 0/1 - No CI validation
- env_template: 0/1 - No .env.example
- runbooks_documented: 0/1 - No runbook references

### Dev Environment

- devcontainer: 0/1 - Not configured
- local_services_setup: skipped
- devcontainer_runnable: skipped

### Debugging & Observability

- structured_logging: 0/1 - No logging library
- distributed_tracing: 0/1 - No tracing
- metrics_collection: 0/1 - No metrics
- error_tracking_contextualized: 0/1 - No Sentry/Bugsnag
- alerting_configured: 0/1 - No alerting
- deployment_observability: 0/1 - No dashboards
- log_scrubbing: 0/1 - No sanitization
- error_to_insight_pipeline: 0/1 - No error-to-issue
- code_quality_metrics: 0/1 - Coverage not monitored

### Security

- secret_scanning: 1/1 - GitGuardian + CodeQL
- automated_security_review: 1/1 - CodeQL configured
- dependency_update_automation: 1/1 - Dependabot + auto-merge
- gitignore_comprehensive: 0/1 - .env secrets tracked
- secrets_management: 0/1 - Secrets in tracked .env
- min_release_age: 0/1 - No delay policy
- codeowners: 0/1 - No CODEOWNERS
- pii_handling: 0/1 - PII domain but no tooling
- branch_protection: skipped
- privacy_compliance: skipped

### Project Management

- issue_templates: 0/1 - No templates
- issue_labeling_system: 0/1 - No labels
- pr_templates: 0/1 - No PR template
- release_notes_automation: 0/1 - No changelog
- release_automation: 0/1 - No CD pipeline
- feature_flag_infrastructure: 0/1 - No flags
- tech_debt_tracking: 0/1 - No TODO scanner
- large_file_detection: 0/1 - No file size checks
- backlog_health: skipped
- progressive_rollout: skipped
- rollback_automation: skipped
- monorepo_tooling: skipped
- version_drift_detection: skipped
- dead_feature_flag_detection: skipped
- n_plus_one_detection: skipped
- api_schema_docs: skipped
- health_checks: skipped
- circuit_breakers: skipped
- profiling_instrumentation: skipped
- dast_scanning: skipped

---

View the full report: https://app.factory.ai/analytics/readiness/https%253A%252F%252Fgithub.com%252Fnarasena%252Flittle-rabbani
