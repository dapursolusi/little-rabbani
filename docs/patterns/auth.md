# Auth Patterns

## Important unresolved decision

Authorization checks are currently placed inconsistently between actions and services. Do not expand the inconsistency or establish a new convention until the decision is settled. See `docs/patterns/violations.md` (or the canonical decision issue).

## Security-sensitive behavior

- Inspect `src/proxy.ts`, `src/lib/auth.ts`, and the relevant auth action before changing authentication or authorization.
- Demo login and dev-session bypass are distinct mechanisms. Verify their environment guards before changing them; do not assume “development-only” means local-only.
- Never expose session tokens, secrets, or PII in logs.

## Source locations

- Configuration: `src/lib/auth.ts`
- Browser client: `src/lib/auth-client.ts`
- Route/session guard: `src/proxy.ts`
- Auth schema: `src/db/schema/auth.ts`
- PII utilities: `src/lib/pii.ts`

## Related debt

Link the current PII call-site or environment-validation issue from `docs/patterns/violations.md` / `docs/known-issues.md` if it is still open.
