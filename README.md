# agent-playbook

My portable AI coding workflow: skills, AGENTS.md rules, and git safety hooks that follow me across tools, teams, and companies.

One source of truth for how I want AI coding agents to work — usable in
Claude Code, Codex, Cursor, Copilot, Gemini CLI and other tools, on any machine.

## What's inside

| Folder / file | What it does |
|---|---|
| `AGENTS.md` | The core rules every agent should follow. Tool-agnostic. |
| `CLAUDE.md` | Claude Code entry point — imports `AGENTS.md`, no duplication. |
| `.github/muse-instructions.md` | Copilot entry point — same core rules. |
| `.muserules` | Cursor entry point — same core rules. |
| `skills/` | Reusable skills. Start from `skills/_template/SKILL.md`. |
| `skills/split-commit-pr/` | Branch → multiple logical commits → one PR whose title/body summarise the whole branch. `scripts/pr-draft.js` builds the body |
| `skills/change-ticket-release/` | Promote validated changes (e.g. stage → prod) under a change ticket, with a parity table. `scripts/json-diff.js` is a semantic JSON diff |
| `hooks/` | Per-project bash git hooks: block secrets, large files, and force-pushes to main. Installed by `install.sh`. |
| `install.sh` | Copies the rules + installs `hooks/` into one repo. |
| `git-hooks/` | Global, cross-platform (Node) git hooks: block force-push and direct pushes to protected branches, then chain to each repo's own hooks. Enabled by `install.js --git-hooks`. |
| `agent-hooks/guard.js` + `adapters/` | Optional agent-level guard for tools with `PreToolUse` command hooks |
| `install.js` | Links skills into every detected tool, optionally enables `git-hooks/` globally |
| `config.example.json` | Defaults. Override per machine in `config.local.json` (gitignored) |
| `PLAYBOOK.md` | Everything above in one file: catalogue, structure and full sources, plus an extractor |

Requirements: Git; Node.js 16+ for the `*.js` tools (no npm dependencies); bash for `install.sh` / `hooks/`.

## Option A — use it in one project (`install.sh`)

```bash
git clone https://github.com/kxg50820/agent-playbook.git
cd <your-project>
../agent-playbook/install.sh .
```

Or manually: copy `AGENTS.md` to your project root and run
`cp hooks/pre-commit hooks/pre-push .git/hooks/ && chmod +x .git/hooks/pre-*`

## Option B — install for every tool and repo on this machine (`install.js`)

```bash
git clone https://github.com/kxg50820/agent-playbook.git ~/agent-playbook
cd ~/agent-playbook
node install.js --dry-run          # preview
node install.js                    # link skills into detected tools (~/.claude, ~/.codex, ...)
node install.js --git-hooks        # also enable the global git guardrails
```

- Limit to some tools: `node install.js --only claude,codex`.
- Update: `git pull` — skills are links, so changes apply immediately.
- Remove: `node install.js --uninstall`.
- Windows: run the same commands in PowerShell or Git Bash. Skills are linked with directory junctions (no admin rights needed); git runs the hooks through Git for Windows' `sh`.

Global rules: the installer prints where each tool reads them. Typical setup:
- **Claude Code:** add `@<path-to>/agent-playbook/AGENTS.md` to `~/.claude/CLAUDE.md`.
- **Codex:** copy or link `AGENTS.md` to `~/.codex/AGENTS.md`.
- **Gemini CLI:** reference it from `~/.gemini/GEMINI.md`.
- **Tools without global rules:** copy the relevant sections into the repo's `AGENTS.md`.

### Global git guardrails (`git-hooks/`)

Enabled with `node install.js --git-hooks` (sets `git config --global core.hooksPath`). The `pre-push` guard blocks:

- force-pushes (remote tip isn't an ancestor of what you push);
- deleting a protected branch;
- direct pushes to protected branches (`main`, `master` by default).

Per-repo opt-out for direct pushes (e.g. personal repos):
```bash
git config agentPlaybook.allowProtectedPush true
```

Every hook stub chains to the repo's own `.git/hooks/<name>`, so tools like husky v4 — and `hooks/` installed by `install.sh` — keep working. Repos that set a local `core.hooksPath` (husky v5+, lefthook…) use their own hooks and skip these.

### Config

Copy `config.example.json` to `config.local.json` and adjust:

| Key | Default | Used by |
|---|---|---|
| `protectedBranches` | `["main", "master"]` | git guard, agent guard |
| `ticketPattern` / `ticketExample` | generic | reference for `change-ticket-release` |
| `commitFooter` / `prFooter` | empty | reference for commit/PR footers (pass to `pr-draft.js --footer`) |
| `extraTools` | none | extra tool folders for `install.js`, e.g. `{ "mytool": { "dir": ".mytool", "skills": "skills", "rules": "AGENTS.md" } }` |

## Principles

1. **One source, many tools** — edit `AGENTS.md`, the tool files just point to it.
2. **No secrets, ever** — hooks block `.env`, keys, and token-shaped strings.
3. **No company code/data** — this playbook is personal workflow only, safe to
   carry between employers. Never paste employer code into it.
4. **Read before you install** — read any third-party skill's SKILL.md first.

## Adding a skill

Start from `skills/_template/SKILL.md`. Give it `name` and `description` frontmatter, keep scripts in `skills/<name>/scripts/` and self-contained (Node, no dependencies), and don't name any specific tool, company or internal system. Run `node install.js` again to link it.

## Stack notes

Built for my day-to-day: Java, TypeScript/React, Python, and AWS.
Language-specific guidance lives in `AGENTS.md` and can be trimmed per project.
