# Level 2: Basic Confidence (20-40% pass rate)

These criteria establish baseline confidence that agents can navigate the project, build it, and follow project conventions.

**Repository pass rate for Level 2: 10/25 (40.0%)**

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
- [ ] **automated_pr_review** - No automated review comments on PRs
- [ ] **monorepo_tooling** - Skipped (single app)
- [ ] **automated_doc_generation** - No doc generation tooling
- [ ] **devcontainer** - No .devcontainer/ directory
- [ ] **local_services_setup** - Skipped (no external deps yet)
- [ ] **runbooks_documented** - No runbook references
- [ ] **branch_protection** - Skipped (no admin access)
- [ ] **codeowners** - No CODEOWNERS file
- [ ] **automated_security_review** - 1/1 (CodeQL + GitGuardian in CI)
- [ ] **issue_templates** - No .github/ISSUE_TEMPLATE/
- [ ] **issue_labeling_system** - No labels configured
- [ ] **pr_templates** - No pull_request_template.md
- [ ] **test_coverage_thresholds** - Coverage reports exist but no threshold
- [ ] **database_schema** - Drizzle deps present but no schema files
- [ ] **structured_logging** - No logging library
- [ ] **error_tracking_contextualized** - No Sentry/Bugsnag/Rollbar
- [ ] **secrets_management** - Secrets hardcoded in tracked .env files

## Action Items

### 1. Add .github/ISSUE_TEMPLATE/ directory

Create structured templates for bug reports and feature requests so agents know what information to provide:

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

### 2. Add pull_request_template.md

Create a PR template with sections for description, testing done, and context so agents submit structured PRs:

```
.github/pull_request_template.md
```

### 3. Add CODEOWNERS file

Define code ownership so agents know who to route reviews to:

```bash
# .github/CODEOWNERS
* @dapursolusi/maintainers
```
