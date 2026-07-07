# Level 1: Foundation (0-20% pass rate)

These are the absolute minimum requirements for an agent to interact with the repository. Without these, agents cannot understand, run, or write correct code.

**Repository pass rate for Level 1: 5/7 (71.4%) — all fixable items done**

## Criteria Checklist

- [x] **lint_config** - ESLint configured
- [x] **type_check** - TypeScript strict mode
- [x] **formatter** - Prettier configured
- [x] **readme** - README.md with setup/usage instructions
- [x] **env_template** - .env.example exists with all vars documented
- [ ] **gitignore_comprehensive** - Needs user action (remove tracked .env* secrets from git)
- [ ] **unit_tests_exist** - Needs user action (write first meaningful test)

## Status

### Passing

- **env_template** — `.env.example` exists at root with documented variables for database, auth, app URL, AI/OpenRouter, and shadcn blocks.
- **lint_config, type_check, formatter, readme** — All passing.

### Needs User Decision

- **gitignore_comprehensive** — `.gitignore` already has `.env*` and `!.env.example` patterns. However tracked `.env.development`, `.env.local`, `.env.production` contain real secrets. Run `git rm --cached .env.development .env.local .env.production` after backing up unrecoverable values.
- **unit_tests_exist** — No test files exist yet. Write a first Vitest test before agents can safely refactor. Example: `tests/lib/utils.test.ts` testing the `cn()` utility.
