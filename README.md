# agent-playbook

My portable AI coding workflow: skills, AGENTS.md rules, and git safety hooks that follow me across tools, teams, and companies.

One source of truth for how I want AI coding agents to work — usable in Claude Code, Codex, Cursor, Copilot, Gemini CLI and other tools, on any machine.

## What's inside

| Folder / file | What it does |
|---|---|
| `AGENTS.md` | The core rules every agent should follow. Tool-agnostic. |
| `CLAUDE.md` | Claude Code entry point — imports `AGENTS.md`, no duplication. |
| `.github/muse-instructions.md` | Copilot entry point — same core rules. |
| `.muserules` | Cursor entry point — same core rules. |
| `skills/` | Reusable skills. Start from `skills/_template/SKILL.md`. |
| `skills/split-commit-pr/` | Branch → multiple logical commits → one PR whose title/body summarise the whole branch. `scripts/pr-draft.js` builds the body from the branch's commits. |
| `skills/change-ticket-release/` | Compare two environments' JSON, file a change ticket, compare with `scripts/json-diff.js`, get the parity table approved, then release. |
| `git-hooks/` | Node guardrails — one executable file per git hook name, chained through `run-hook.js` to an optional local `.git/hooks` file. |
| `hooks/` | Per-project bash git hook: blocks secrets and large files. |
| `adapters/claude-code-hooks.json` | Claude Code hook configuration — runs `agent-hooks/guard.js` on `Bash` / `PowerShell` tool calls. |
| `agent-hooks/guard.js` | Optional agent guard: block force-pushes, ask before committing/pushing on a protected branch. |
| `install.js` | Cross-platform installer — symlinks `skills/` into Claude, Codex, Copilot, Cursor and Gemini, and can install the rules and git hooks. |
| `config.example.json` | Example machine config for the guards (protected branches, allowed commands). Copy to `config.local.json` and edit; the local file is gitignored. |
| `lib/` | Shared helpers for the Node tools: `git.js` (branch / remote parsing) and `config.js` (local config loading). |

## Requirements

- Node.js 18+ for `install.js` and the Node hooks.
- git on your `PATH`.
- bash for `hooks/`.

## Install (one machine, every tool)

```bash
node install.js --git-hooks --agent-guard
```

This is the recommended path: it installs the agent rules into Claude Code, Codex, Copilot, Cursor and Gemini, links `skills/` into each tool, and installs the guardrails.

Install only what you need:

```bash
node install.js --only claude,gemini
node install.js --dry-run
node install.js --uninstall
```

The installer never overwrites a skill that already exists as a real file (not a symlink). Skills are symlinked where the OS supports it, and copied otherwise. Skills under folders starting with `_` (for example `_template`) are not installed — templates are for reference only.

## Option A — use it in one project (`install.js`)

```bash
git clone https://github.com/kxg50820/agent-playbook.git
cd <your-project>
node ../agent-playbook/install.js
```

## Option B — carry the rules into one project (no install)

Or manually: copy `AGENTS.md`, `CLAUDE.md` and any skill folders you need into the project, then, if you use git, run `cp hooks/pre-commit .git/hooks/ && chmod +x .git/hooks/pre-commit`.





























## Skills

Current skills, and where to find them:

- `split-commit-pr` — Split a branch into small, logical commits and open one PR whose title and body summarise the whole branch. See `skills/split-commit-pr/SKILL.md`.
- `change-ticket-release` — Compare two environments' JSON, file a change ticket, compare the before/after JSON with the semantic diff, get the parity table approved, then release. See `skills/change-ticket-release/SKILL.md`.
- `ponytail` — Lazy senior dev mode: smallest complete change, YAGNI ladder, levels lite/full/ultra. See `skills/ponytail/SKILL.md`, imported from DietrichGebert/ponytail under MIT.

Skills are read-only building blocks: the agent should not change a skill's steps for one task. To add a skill, read the whole `SKILL.md` first, then follow `skills/README.md` (for example: offer an office-safe prompt first, note the source URL and date, and remove any skill you no longer use).




## Global guardrails — and why they are complementary

There are two kinds of guardrails, at two different stages — and `hooks/` — keep working.

- Git hooks (`git-hooks/`) — run when git actually runs a hook: the pre-push guard blocks force-pushes, deleting protected branches, and direct pushes to protected branches, and `run-hook.js` chains on to any local `.git/hooks` file so repo-specific hooks still work.
- Agent hooks (`agent-hooks/guard.js`, wired via `adapters/claude-code-hooks.json`) — run before the agent's `Bash` / `PowerShell` tool call: they block force-pushes and ask before a commit or push on a protected branch, before git is even invoked.
- Project hooks (`hooks/`) — per-project bash hooks in a repo's `.git/hooks`. The pre-commit hook blocks secret files, token patterns, and files over 5 MB.

The agent guard and the git hooks overlap on purpose: an agent call can be blocked before it runs, and a manual `git push` is still caught by the git hook. If either layer is disabled, the other still protects you.

Install the guardrails (global, every repo):

```bash
node install.js --git-hooks --agent-guard
```

Install the guardrails (one repo, current repo only):

```bash
node install.js --git-hooks
```

To change what counts as protected, or to allow protected pushes on one machine, copy `config.example.json` to `config.local.json` and edit it — the local file is gitignored.

To remove the guardrails later:

```bash
node install.js --uninstall
```

To confirm what is installed:

```bash
node install.js --dry-run
```

## Safety rules (summary)

- Never force-push. Never rewrite history or amend a pushed commit.
- Never push directly to `main` / `master`.
- Never commit `.env`, `.pem`, `.key`, private keys, tokens or passwords.
- Never run destructive commands (`rm -rf`, `git reset --hard`, `git clean -fd`) without explicit approval.
- Test and lint before finishing; if tests fail, say so — do not claim success.

The full rules are in `AGENTS.md`; the safety guardrails are enforced by the hooks above.

## PLAYBOOK.md

`PLAYBOOK.md` is the same kit as one generated file — useful when you can't clone the repo, or when a tool only accepts pasted text. It contains a catalogue, the folder structure, a rebuild script (`extract.js` in the generated file) and the full source of every other file.

It is generated, not hand-written. If you change a source file, regenerate it before committing.















