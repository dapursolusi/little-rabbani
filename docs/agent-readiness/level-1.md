# Level 1: Foundation (0-20% pass rate)

These are the absolute minimum requirements for an agent to interact with the repository. Without these, agents cannot understand, run, or write correct code.

**Repository pass rate for Level 1: 4/7 (57.1%)**

## Criteria Checklist

- [x] **lint_config** - ESLint configured
- [x] **type_check** - TypeScript strict mode
- [x] **formatter** - Prettier configured
- [x] **readme** - README.md with setup/usage instructions
- [ ] **env_template** - No .env.example file
- [ ] **gitignore_comprehensive** - Tracked .env files contain real secrets
- [ ] **unit_tests_exist** - No test files exist

## Action Items

### 1. Create .env.example

Create a safe template from env.mjs that agents can copy:

```
# Create .env.example based on env.mjs
```

Expected content:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Auth
NEXTAUTH_SECRET=your-secret-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Fix .gitignore and remove tracked .env files

Stop tracking environment files with secrets:

```bash
# Remove tracked .env files
git rm --cached .env.development .env.local .env.production

# Update .gitignore
echo ".env" >> .gitignore
```

Keep only `.env.example` as the template.

### 3. Add at least one unit test

Create a basic test to establish the testing pattern:

```tsx
// tests/example.test.ts
import { describe, expect, it } from 'vitest';

describe('example', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

This validates the Vitest setup and gives agents a reference for writing tests.
