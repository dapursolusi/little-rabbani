# Level 5: Agent-Native (80-100% pass rate)

These are the highest-level criteria showing mature engineering practices: complexity analysis and error-to-insight pipelines.

**Repository pass rate for Level 5: 1/2 (50.0%)**

## Criteria Checklist

- [x] **cyclomatic_complexity** - ESLint complexity rules (max 10, max-depth 4, max-params 4, max-nested-callbacks 4, max-statements 25)
- [ ] **error_to_insight_pipeline** - Needs user action

## Status

### Passing

- **cyclomatic_complexity** — ESLint configured with `complexity: [warn, { max: 10 }]`, `max-depth`, `max-params`, `max-nested-callbacks`, and `max-statements`.

### Needs User Decision

- **error_to_insight_pipeline** — Requires:
  1. Creating a Sentry account and project
  2. Adding `@sentry/nextjs` dependency
  3. Enabling Sentry-GitHub integration in Sentry dashboard
  4. Configuring `SENTRY_ORG` and `SENTRY_PROJECT` in env.mjs
