# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

Before exploring, read these:

- **`CONTEXT.md`** at repo root, or **`CONTEXT-MAP.md`** (points at one `CONTEXT.md` per context — read relevant ones)
- **`docs/adr/`** — read ADRs touching the area you're about to work on. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any don't exist, proceed silently. The `/domain-modeling` skill creates them lazily when terms/decisions get resolved.

## File structure

Single-context:

```
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context (presence of `CONTEXT-MAP.md`):

```
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When naming domain concepts, use terms as defined in `CONTEXT.md`. Don't drift to synonyms the glossary avoids. If a concept isn't in the glossary, either reconsider the language or flag a real gap for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly:

> _Contradicts ADR-0007 but worth reopening because…_
