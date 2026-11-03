---
name: change-ticket-release
description: Promote already-validated changes from a lower environment (dev/stage) to a higher one (prod) under a change ticket. Asks for the ticket first, works on a branch named exactly after it, builds a parity table, copies only approved items, and opens one multi-commit PR without force-pushing. Use for "sync stage to prod", "promote these changes to prod", "release under change ticket X", "check stage/prod parity".
---

# Change-ticket release (lower env → higher env)

Production is customer-facing. Use this skill only when the user explicitly asks for a higher-environment change.

## Before coding: 4 rules

1. **Think first.** State the assumptions: ticket, environments, files/keys, and which changes are in scope. If unsure, ask. Never guess the ticket or the scope.
2. **Simplicity.** Copy only the approved items, with the minimum edit.
3. **Surgical.** Touch only those target files and keys. Never touch CI- or bot-managed values or unrelated differences.
4. **Goal-driven.** Define the check before editing, e.g. "the diff between source and target shows only the *Intentionally different* and *Pending* rows, and the tests pass". Edit until it passes.

## 0. Ask for the change ticket (always first)

- Ask: "What is the change ticket number for this release?" If the user already typed one, confirm it.
- Never infer it from the current branch, other branches, history or earlier chats.
- Validate it against the format the user or project uses. If the user has none, stop. A read-only parity check (step 2) is still allowed.

## 1. Gather inputs (ask if missing)

| Input | Notes |
|---|---|
| Ticket | Exact branch name; goes into every commit and the PR title |
| Source → target env | e.g. stage → prod |
| Files / config keys | Only the ones the user names |
| Source of truth | Only what is **already merged to the default branch and validated** in the source env |

If the source change isn't merged yet, stop: ship it first (`split-commit-pr`), then come back.

## 2. Branch

```bash
git fetch origin
git checkout <default> && git pull --ff-only origin <default>
git log --oneline -5                       # let the user confirm the source change is in
git branch -a --list '<TICKET>' '*/<TICKET>'
git checkout -b <TICKET>                   # exact name, no suffix
```
- **One ticket = one branch = one PR.** Never reuse another ticket's branch, a feature branch or the default branch.
- If the branch already exists, ask: continue on it (merge `origin/<default>` in) or stop. Never delete, recreate or force-push it.
- Uncommitted work: list it and ask before stashing. Never discard it.

## 3. Diff source vs target

JSON files (key order and BOM ignored; array items matched by `id`/`key`/`name`/`field`, configurable):
```bash
node <this-skill-dir>/scripts/json-diff.js <source.json> <target.json> [--keys id,key,name] [--path config]
```
Output: `+` only in source (candidate to copy), `-` only in target, `~` changed (`target -> source`). Exit code 0 = identical, 1 = differences.

Other formats (YAML, .env, properties): compare entry by entry for the same keys; copy values **verbatim**, never re-serialise.

## 4. Parity table — get approval before editing

| File / key | Change (source → target) | Action |
|---|---|---|
| `<file>` | +3 items | **Copy** |
| `<file>` `<key>` | new value | **Copy** |
| `<bot-managed value>` | differs | **Skip (CI-managed)** |

Classify every difference:
- **Copy** — requested and validated in the source env.
- **Intentionally different** — env-specific URLs/IDs/labels, or items the user deliberately holds back.
- **Pending** — in source but not requested. List it, don't copy it.

## 5. Apply

- Targeted edits only. Never overwrite the whole target file with the source file.
- Keep each file's indentation, quoting style, encoding (BOM) and line endings, so the diff shows only the intended change.
- Re-run step 3: only *Intentionally different* and *Pending* rows may remain.
- Run the relevant tests and linters.

## 6. Commit + PR

Follow `split-commit-pr`: one commit per file × key/feature, all on `<TICKET>`, one PR, never force-push, ask before committing.

- Commit/PR title pattern: `[<TICKET>] <target env>: <summary of everything promoted>`.
- PR body (`--extra-file`): final parity table, where/when it was validated in the source env, rollback (revert this PR; list the previous values), out-of-scope items.

## 7. After merge

Tell the user (don't do it yourself): watch the deployment pipeline for the ticket, never deploy manually, and spot-check the changed features in the target env.
