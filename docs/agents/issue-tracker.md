# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create issue:** `gh issue create --title "..." --body "..."` (heredoc for multi-line)
- **Read issue:** `gh issue view <number> --comments` (filter with `jq`, fetch labels)
- **List issues:** `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with `--label`/`--state` filters
- **Comment:** `gh issue comment <number> --body "..."`
- **Labels:** `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close:** `gh issue close <number> --comment "..."`

Infer repo from `git remote -v` — `gh` auto-detects inside a clone.

## PRs as triage surface

**PRs as a request surface: no.** _(Set to `yes` if external PRs are feature requests; `/triage` reads this.)_

When `yes`, use `gh pr` equivalents for same labels/states. List external PRs by filtering `authorAssociation` (`CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, `NONE`). GitHub shares number space — resolve ambiguous `#42` with `gh pr view 42` then fallback to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

`gh issue view <number> --comments`.

## Wayfinding operations (used by `/wayfinder`)

- **Map:** single issue labelled `wayfinder:map`. `gh issue create --label wayfinder:map`.
- **Child ticket:** issue linked as GitHub sub-issue. Where sub-issues unavailable, add task list in map body + `Part of #<map>` at child body top. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Claimed ticket assigned to driving dev.
- **Blocking:** GitHub native issue dependencies. Add edge: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`. Blocker DB ID: `gh api repos/<owner>/<repo>/issues/<n> --jq .id` (not `#number` or `node_id`). Fallback: `Blocked by: #<n>` at child body top.
- **Frontier query:** list map's open children, drop those with open blockers or assignment; first in map order wins.
- **Claim:** `gh issue edit <n> --add-assignee @me`
- **Resolve:** `gh issue comment <n> --body "<answer>"`, close, append context pointer to map decisions.
