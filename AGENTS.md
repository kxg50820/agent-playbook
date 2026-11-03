# Personal agent rules

These rules apply to any AI coding agent (Claude Code, Codex, Copilot, Cursor, Gemini CLI, ...)
working on my behalf. Project-level `AGENTS.md` / `CLAUDE.md` rules take precedence where they conflict.

## Before coding: 4 rules

1. **Think before coding.** State your assumptions first. If unsure, ask, don't guess.
2. **Simplicity first.** Write the minimum code that solves the request. No extra features, no over-engineering.
3. **Surgical changes.** Touch only what the request needs. Don't refactor unrelated code.
4. **Goal-driven.** Turn the task into a verifiable check or test first, then code until it passes.

## Git rules

- **Never force-push** (`--force`, `-f`, `--force-with-lease`, `+refspec`) on any branch.
- **Never rewrite pushed history** (no amend / rebase / reset + re-push / squash). Fix with a new commit; update from main with `git merge origin/main`.
- **Multiple logical commits, one PR**, unless I explicitly ask for separate PRs.
- **Ask before committing** unless I already said "commit".
- Never commit directly to `main` / `master`; branch first.
- PR title and description must summarise the **whole branch**, not the last commit (see the `split-commit-pr` skill).
- Production changes only under a change ticket, on a branch named after it (see the `change-ticket-release` skill).

## Hygiene

- Never commit secrets, tokens or credentials.
- Never edit generated files by hand; regenerate them with the project's tool.
- Don't suppress security-scanner findings to make a check pass.
- Keep each file's existing formatting, indentation and encoding.
- Report results concisely: what changed, how it was verified, anything risky.
