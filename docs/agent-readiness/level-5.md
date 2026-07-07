# Level 5: Agent-Native (80-100% pass rate)

These are the highest-level criteria showing mature engineering practices: complexity analysis and error-to-insight pipelines.

**Repository pass rate for Level 5: 0/2 (0.0%)**

## Criteria Checklist

- [ ] **cyclomatic_complexity** - No complexity analysis tools
- [ ] **error_to_insight_pipeline** - No error-to-issue automation

## Action Items

### 1. Add complexity analysis (ESLint rule)

Configure the ESLint complexity rule to flag overly complex functions:

```js
// eslint.config.mjs - add to rules
{
  rules: {
    complexity: ['warn', { max: 10 }],
    'max-depth': ['warn', { max: 4 }],
    'max-statements': ['warn', { max: 25 }],
  },
}
```

### 2. Add error tracking with issue creation

Set up Sentry with GitHub integration so production errors automatically create issues:

1. Add Sentry SDK: `bun add @sentry/nextjs`
2. Enable Sentry's GitHub integration in the Sentry dashboard
3. Configure SENTRY_ORG and SENTRY_PROJECT in env.mjs
4. This creates a pipeline from production errors to actionable GitHub issues that agents can triage and fix.
