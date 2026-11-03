# AGENTS.md — Core Rules

These rules apply to every AI coding agent working on my behalf,
regardless of tool (Claude Code, Codex, Cursor, Copilot, Gemini CLI, etc.).
Project-level `AGENTS.md` / `CLAUDE.md` rules take precedence where they conflict.

## The 4 Rules (Karpathy)

1. **Think before coding**
   Don't assume. Don't hide confusion. Surface tradeoffs, state
   assumptions explicitly, and ask if something is genuinely unclear.

2. **Simplicity first**
   Minimum code that solves the problem. No speculative features,
   no abstractions for single-use code, no configurability that
   wasn't requested.

3. **Surgical changes**
   Touch only what the task requires. Match existing style. Don't
   refactor unrelated code. Remove only imports/vars your change
   made unused.

4. **Goal-driven execution**
   Turn tasks into verifiable goals ("add validation" → "write a
   failing test for invalid input, then make it pass"). Loop until
   verified, don't just declare success.

## Working rules

- Read the existing code before proposing a change.
- Prefer the codebase's existing patterns, libraries, and helpers.
- Run the relevant tests/build after a change; show the result.
- Never invent an API, flag, or file path — check first.
- Keep diffs small and reviewable. Explain *why*, not just *what*.
- No secrets in code, prompts, commits, or this file.
- No employer / company code or data in personal projects, and vice versa.

## Stack defaults

- **Java:** follow existing Spring/project conventions, no new deps without reason.
- **TypeScript/React:** typed props, existing component patterns, no `any` shortcuts.
- **Python:** idiomatic, type hints, dataclasses/pathlib where they clarify.
- **AWS:** least-privilege IAM, never hardcode credentials, prefer IaC over console steps.

## Git

- **Never force-push** (`--force`, `-f`, `--force-with-lease`, `+refspec`) on any branch (hooks enforce this).
- **Never rewrite pushed history** (no amend / rebase / reset + re-push / squash). Fix with a new commit; update from main with `git merge origin/main`.
- Never commit `.env`, keys, tokens, or files >5 MB (hooks enforce this).
- Never commit directly to `main` / `master`; branch first.
- **Multiple logical commits, one PR**, unless I explicitly ask for separate PRs.
- **Ask before committing** unless I already said "commit".
- Commit messages: short imperative subject, body explains why when non-obvious.
- PR title and description must summarise the **whole branch**, not the last commit (see the `split-commit-pr` skill).
- Production changes only under a change ticket, on a branch named after it (see the `change-ticket-release` skill).

## Hygiene

- Never edit generated files by hand; regenerate them with the project's tool.
- Don't suppress security-scanner findings to make a check pass.
- Keep each file's existing formatting, indentation and encoding.
- Report results concisely: what changed, how it was verified, anything risky.
