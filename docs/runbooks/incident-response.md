# Incident Response Runbook

## Severity Levels

| Severity  | Description                          | Response Time                   | Examples                                 |
| --------- | ------------------------------------ | ------------------------------- | ---------------------------------------- |
| **SEV-1** | Complete outage or data loss         | Immediate (anytime)             | Site down, DB corruption, auth broken    |
| **SEV-2** | Major feature broken, partial outage | < 4 hours during business hours | Login broken for subset, payment failing |
| **SEV-3** | Minor issue, no user impact          | < 2 business days               | UI glitch, non-critical error toast      |
| **SEV-4** | Cosmetic / low-priority              | Next planning cycle             | Typo, misaligned element                 |

## Incident Lifecycle

### 1. Detection

- **Automated**: Check [monitoring dashboard link](https://vercel.com/narasena/little-rabbani) for deploy impact
- **Manual**: User reports in [GitHub Issues](https://github.com/narasena/little-rabbani/issues)

### 2. Triage

1. Identify severity (see table above)
2. Check if related to recent deploy: `gh run list --limit 5`
3. Check environment health (local / production)
4. Create GitHub issue with `type:bug` and `priority:critical`/`priority:high` labels

### 3. Containment

- **Deploy rollback**: If caused by recent deploy, revert the merge commit and redeploy
- **Feature flag**: If feature flag exists, disable the flag
- **Hotfix branch**: Create `hotfix/<description>` from the last known-good commit

### 4. Resolution

1. Identify root cause
2. Write and test fix on a branch
3. Get code review (PR with `type:bug` label)
4. Merge to `main` and deploy

### 5. Post-Mortem

For SEV-1 incidents, document:

- Timeline of events
- Root cause
- What worked / didn't work in the response
- Action items to prevent recurrence

## Quick Commands

```bash
# List recent deployments
gh run list --limit 10

# Roll back to a specific commit
git revert --no-commit HEAD

# Create a hotfix branch
git checkout -b hotfix/<description> main
```

## Escalation Contacts

- **Primary**: @narasena (GitHub)
- **Secondary**: File an issue in the repository

## Related Resources

- [Runbook Index](./index.md)
- [Deployment Dashboard](https://vercel.com/narasena/little-rabbani)
