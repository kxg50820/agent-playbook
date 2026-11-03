# AGENTS.md — Core Rules

These rules apply to every AI coding agent working in this repo,
regardless of tool (Claude Code, Cursor, Copilot, etc.).

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

- Never force-push to `main`/`master` (hooks enforce this).
- Never commit `.env`, keys, tokens, or files >5 MB (hooks enforce this).
- Commit messages: short imperative subject, body explains why when non-obvious.
