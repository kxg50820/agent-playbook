# AGENTS.md — Core Rules

These rules apply to every AI coding agent working on my behalf, regardless of tool (Claude Code, Codex, Cursor, Copilot, Gemini CLI, etc.). Project-level `AGENTS.md` / `CLAUDE.md` rules take precedence where they conflict.

## The 4 Rules (Karpathy)

1. **Think before coding**
   Don't assume. Don't hide confusion. Surface tradeoffs, state assumptions explicitly, and ask if something is genuinely unclear.

2. **Simplicity first**
   Minimum code that solves the problem. No speculative features, no abstractions for single-use code, no configurability that wasn't requested.

3. **Surgical changes**
   Touch only what the task requires. Match existing style. Don't refactor unrelated code. Remove only imports/vars your change made unused.

4. **Goal-driven execution**
   Turn tasks into verifiable goals ("add validation" → "write a failing test for invalid input, then make it pass"). Loop until verified, don't just declare success.

## Ponytail — smallest complete change

This playbook includes the Ponytail skill (skills/ponytail/SKILL.md, from DietrichGebert/ponytail, MIT). Use it on coding tasks: the best code is the code never written. Before writing, take the first option that fully works — (1) does it need to exist at all (YAGNI), (2) already in this codebase, (3) standard library / platform feature, (4) an already-installed dependency, (5) one line a reader gets at a glance, (6) otherwise the minimum code that works. Never cut validation at trust boundaries, error handling that prevents data loss, security, or accessibility. A deliberate shortcut with a known limit gets a comment in the form `shortcut: <the limit>, <when to upgrade>`. Levels lite / full (default) / ultra follow the skill. If AGENTS.md and the skill ever conflict, AGENTS.md wins.






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

- Commit to a branch tied to the task; never commit directly to `main`.
- Push to remote first, run `git status`, then push.
- Do not write long shell commands in one line; use `git add` and `git commit` separately.
- Write commit messages that are short but complete.
- Prefer the `gh` CLI for GitHub actions when available.
- Ask before committing unless I already said "commit".
- **Jira ticket first:** before committing, look for a Jira ticket (a key like ABC-123) — first from what I gave in the task/conversation, then from the current branch name. If neither has one, ask me for the ticket before committing; do not commit without one and do not invent one. When a PR is created, put the ticket in the PR description next to the change Summary.
- Branch and PR naming: use the ticket key (if present) plus a short lowercase slug, e.g. `ABC-123-improve-jira-docs`.
- For production changes, open a PR and add both a plain-English Summary and the `git log --oneline` output.
- Do not force-push to protected branches (including `main`).

## Hygiene

- Use `git worktree` for isolated tasks — avoid working in the main clone.
- If a hook or tool complains about my changes, fix the issue instead of disabling it.
- Never use `git reset --hard`.
- If a test fails after a change, stop and fix the test before continuing.






















