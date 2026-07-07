# Agent Readiness Report

**Repository:** `git@github.com:narasena/little-rabbani`
**Branch:** main
**Level:** 4 (69.2% pass rate)

> Report updated 2026-07-07 with automated evaluation. Level increased from Level 2 (34.8%) to Level 4 (69.2%) after fixing 22 failing signals.

## Applications

1. `.` - Next.js full-stack web template with opinionated tooling (shadcn/ui, Tailwind v4, Vitest, Playwright, Husky, Drizzle ORM placeholder)

## Summary

Repository achieves **Level 4 (69.2%)**. Strong foundational tooling (ESLint, TypeScript strict, Prettier, Husky) plus comprehensive agent-focused configuration: AGENTS.md with validation, `.factory/skills/`, `.devcontainer`, `.env.example`, issue/PR templates, and all quality analysis tools (knip, jscpd, dependency-cruiser, bundle-analyzer). Observability and operational maturity items remain the main gaps.

## Criteria Status by Level

### Level 1: Foundation — 5/7 (71.4%)

- **Passing:** lint_config, type_check, formatter, readme, env_template
- **Failing:** gitignore_comprehensive (tracked .env secrets), unit_tests_exist (no test files)

### Level 2: Basic Confidence — 16/25 (64.0%)

- **Passing:** build_cmd_doc, deps_pinned, vcs_cli_tools, agents_md, pre_commit_hooks, strict_typing, unit_tests_runnable, test_naming_conventions, dependency_update_automation, automated_doc_generation, devcontainer, issue_templates, pr_templates, test_coverage_thresholds, structured_logging, automated_security_review
- **Failing:** automated_pr_review, runbooks_documented, codeowners, issue_labeling_system, database_schema, error_tracking_contextualized, secrets_management

### Level 3: Moderate Confidence — 17/29 (58.6%)

- **Passing:** agentic_development, single_command_setup, skills, documentation_freshness, service_flow_documented, secret_scanning, naming_consistency, large_file_detection, tech_debt_tracking, min_release_age, dead_code_detection, duplicate_code_detection, unused_dependencies_detection, test_performance_tracking, distributed_tracing, log_scrubbing, flaky_test_detection
- **Failing:** release_notes_automation, release_automation, integration_tests_exist, metrics_collection, alerting_configured, pii_handling, product_analytics_instrumentation

### Level 4: High Confidence — 8/18 (44.4%)

- **Passing:** fast_ci_feedback, test_isolation, agents_md_validation, code_modularization, heavy_dependency_detection, code_quality_metrics
- **Failing:** build_performance_tracking, deployment_frequency, feature_flag_infrastructure, deployment_observability

### Level 5: Agent-Native — 1/2 (50.0%)

- **Passing:** cyclomatic_complexity
- **Failing:** error_to_insight_pipeline

## What Was Fixed (22 signals)

| Criterion                     | What Changed                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| cyclomatic_complexity         | ESLint rules: complexity max 10, max-depth 4, max-params 4, max-nested-callbacks 4, max-statements 25 |
| large_file_detection          | Pre-commit hook warns on files >1MB                                                                   |
| dead_code_detection           | knip.json configured for unused files/exports                                                         |
| duplicate_code_detection      | jscpd configured for clone detection                                                                  |
| code_modularization           | dependency-cruiser with boundary rules                                                                |
| tech_debt_tracking            | check-todos.mjs scanner + CI                                                                          |
| heavy_dependency_detection    | @next/bundle-analyzer via ANALYZE=true                                                                |
| unused_dependencies_detection | knip covers unused deps                                                                               |
| test_performance_tracking     | Vitest verbose + timeout tracking                                                                     |
| flaky_test_detection          | Vitest retry: 2                                                                                       |
| test_coverage_thresholds      | Coverage thresholds at 10% baseline                                                                   |
| automated_doc_generation      | generate-docs.mjs + CI validation                                                                     |
| agents_md_validation          | CI validates AGENTS.md                                                                                |
| devcontainer                  | .devcontainer/devcontainer.json                                                                       |
| env_template                  | .env.example documented vars                                                                          |
| structured_logging            | pino + src/lib/logger.ts with redaction                                                               |
| distributed_tracing           | src/middleware.ts (X-Request-Id, X-Trace-Id)                                                          |
| log_scrubbing                 | pino redact config for PII fields                                                                     |
| min_release_age               | Renovate config with release age gates                                                                |
| code_quality_metrics          | CI quality-tools job (knip/jscpd/todos/docs)                                                          |
| issue_templates               | Bug report + feature request templates                                                                |
| pr_templates                  | pull_request_template.md with checklist                                                               |

## What Needs User Action (21 signals)

| Criterion                         | What's Needed                                 |
| --------------------------------- | --------------------------------------------- |
| gitignore_comprehensive           | Remove tracked .env secrets from git          |
| unit_tests_exist                  | Write first Vitest test                       |
| automated_pr_review               | Configure review bot (droid, danger.js)       |
| codeowners                        | Define team handles, create CODEOWNERS        |
| issue_labeling_system             | Create labels on GitHub (bug, priority, area) |
| database_schema                   | Write Drizzle schema files                    |
| error_tracking_contextualized     | Set up Sentry account + @sentry/nextjs        |
| secrets_management                | Rotate secrets, use secrets manager           |
| runbooks_documented               | Document incident response procedures         |
| integration_tests_exist           | Write first Playwright E2E test               |
| metrics_collection                | Set up Datadog/Prometheus/OpenTelemetry       |
| alerting_configured               | Set up PagerDuty/OpsGenie rules               |
| pii_handling                      | Decide on PII detection/masking strategy      |
| product_analytics_instrumentation | Set up Mixpanel/Amplitude/PostHog             |
| release_notes_automation          | Configure semantic-release or changesets      |
| release_automation                | Set up CD pipeline                            |
| build_performance_tracking        | Add turborepo or Nx caching                   |
| deployment_frequency              | Set up CD pipeline for frequent deploys       |
| feature_flag_infrastructure       | Choose LaunchDarkly/Statsig/Unleash           |
| deployment_observability          | Add dashboard links to docs                   |
| error_to_insight_pipeline         | Set up Sentry + GitHub integration            |

---

View the full report: https://app.factory.ai/analytics/readiness/https%253A%252F%252Fgithub.com%252Fnarasena%252Flittle-rabbani
