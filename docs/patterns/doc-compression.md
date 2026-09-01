# Doc Compression Rules

Agent-only .md files compressed before commit. Manual compression only — `caveman-compress` corrupts files.

## What to compress

Patterns, ADRs (after review), audit reports, checklists, generated docs. Target 40-60% for heavy, 20-30% for moderate.

## What NOT to compress

Behavioral protocols (CLAUDE.md S1-S8), vocab glossaries (CONTEXT.md Language), ADRs (reasoning is load-bearing), public-facing docs. Also: never when compression removes the "why".

## Rules

1. **Verify cross-references** after compression — every inline link must resolve. Run `grep -oP 'docs/[a-z/-]+\.md' <file>` and check each path exists.
2. **Subagents self-compress** specs, plans, audit reports at write time. Pass instruction in spawn prompt.
3. **`docs/superpowers/` is ephemeral** — delete after work ships or compress+archive. Never accumulate.
4. **Backup is git, not `.original.md`** — confirm file is committed before compressing. Rollback via `git checkout`. Never sidecar backups.
5. **Fidelity check** — skim diff for meaning-shifts. Compare compressed vs original side-by-side for dense sections.
6. **Compression targets by density:**
   - Behavioral rules, vocab glossaries: 0-15% (light trim only)
   - Reference/spec files: 40-60%
   - Audit reports, checklists: 60-80%
   - ADRs: 0% — compress only after decision settles
7. **Clean up backups** — `rm -rf ~/.local/share/caveman-compress/backups/` after verifying compressed file is correct.