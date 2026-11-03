# agent-playbook

My portable AI coding workflow: skills, AGENTS.md rules, and git safety hooks that follow me across tools, teams, and companies.

Works with any agent that reads `SKILL.md` skills and/or `AGENTS.md` (Claude Code, OpenAI Codex, GitHub Copilot, Cursor, Gemini CLI, …). The git guardrails work for every tool — and for humans — because they run inside git itself.

## What's inside

| Path | What it is |
|---|---|
| `AGENTS.md` | Personal rules: the 4 "before coding" rules, git rules, hygiene |
| `skills/split-commit-pr/` | Branch → multiple logical commits → one PR whose title/body summarise the whole branch. `scripts/pr-draft.js` builds the body |
| `skills/change-ticket-release/` | Promote validated changes (e.g. stage → prod) under a change ticket, with a parity table. `scripts/json-diff.js` is a semantic JSON diff |
| `git-hooks/` | Global git hooks: block force-push and direct pushes to protected branches, then chain to each repo's own hooks |
| `agent-hooks/guard.js` + `adapters/` | Optional agent-level guard for tools with `PreToolUse` command hooks |
| `install.js` | Links skills into every detected tool, optionally enables the git hooks |
| `config.example.json` | Defaults. Override per machine in `config.local.json` (gitignored) |

Requirements: Git and Node.js 16+. No npm dependencies.

## Install

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

### Rules (`AGENTS.md`)

The installer prints where each tool reads global rules. Typical setup:
- **Claude Code:** add `@<path-to>/agent-playbook/AGENTS.md` to `~/.claude/CLAUDE.md`.
- **Codex:** copy or link `AGENTS.md` to `~/.codex/AGENTS.md`.
- **Gemini CLI:** reference it from `~/.gemini/GEMINI.md`.
- **Tools without global rules:** copy the relevant sections into the repo's `AGENTS.md`.

Project rules win over these personal ones when they conflict.

## Git guardrails

Enabled with `node install.js --git-hooks` (sets `git config --global core.hooksPath`). The `pre-push` guard blocks:

- force-pushes (remote tip isn't an ancestor of what you push);
- deleting a protected branch;
- direct pushes to protected branches (`main`, `master` by default).

Per-repo opt-out for direct pushes (e.g. personal repos):
```bash
git config agentPlaybook.allowProtectedPush true
```

Every hook stub chains to the repo's own `.git/hooks/<name>`, so tools like husky v4 keep working. Repos that set a local `core.hooksPath` (husky v5+, lefthook…) use their own hooks and skip these.

## Config

Copy `config.example.json` to `config.local.json` and adjust:

| Key | Default | Used by |
|---|---|---|
| `protectedBranches` | `["main", "master"]` | git guard, agent guard |
| `ticketPattern` / `ticketExample` | generic | reference for `change-ticket-release` |
| `commitFooter` / `prFooter` | empty | reference for commit/PR footers (pass to `pr-draft.js --footer`) |
| `extraTools` | none | extra tool folders for `install.js`, e.g. `{ "mytool": { "dir": ".mytool", "skills": "skills", "rules": "AGENTS.md" } }` |

## Adding a skill

Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter, keep scripts in `skills/<name>/scripts/` and self-contained (Node, no dependencies), and don't name any specific tool, company or internal system. Run `node install.js` again to link it.
