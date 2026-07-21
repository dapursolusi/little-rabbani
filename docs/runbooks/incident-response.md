# Incident Response Runbook

## Severity Levels

| Severity  | Description                          | Response Time       | Examples                                 |
| --------- | ------------------------------------ | ------------------- | ---------------------------------------- |
| **SEV-1** | Complete outage / data loss          | Immediate (anytime) | Site down, DB corruption, auth broken    |
| **SEV-2** | Major feature broken, partial outage | <4h business hours  | Login broken for subset, payment failing |
| **SEV-3** | Minor issue, no user impact          | <2 business days    | UI glitch, non-critical error toast      |
| **SEV-4** | Cosmetic / low-priority              | Next planning cycle | Typo, misaligned element                 |

## Incident Lifecycle

1. **Detection** — [Vercel dashboard](https://vercel.com/narasena/little-rabbani) or [GitHub Issues](https://github.com/narasena/little-rabbani/issues)
2. **Triage** — Identify severity, check recent deploy (`gh run list --limit 5`), check env health, create issue with `type:bug` + `priority:*` labels
3. **Containment** — Revert merge commit (if deploy-caused), disable feature flag if available, or hotfix branch from last-known-good commit
4. **Resolution** — Root cause → fix → PR with `type:bug` → merge to main → deploy
5. **Post-Mortem** (SEV-1 only) — Timeline, root cause, what worked/didn't, action items

## Quick Commands

```bash
gh run list --limit 10                          # Recent deployments
git revert --no-commit HEAD                      # Rollback
git checkout -b hotfix/<description> main        # Hotfix branch
```

## Escalation

- **Primary:** @narasena (GitHub)
- **Secondary:** File an issue in the repository

## Related

- [Deployment Dashboard](https://vercel.com/narasena/little-rabbani)
