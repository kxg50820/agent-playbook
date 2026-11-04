# agent-playbook

*One rulebook, a handful of skills, and guardrails that actually run — the same AI coding workflow on every machine, in every tool.*

![works with](https://img.shields.io/badge/works%20with-Claude%20Code%20%C2%B7%20Codex%20%C2%B7%20Copilot%20%C2%B7%20Cursor%20%C2%B7%20Gemini-111111?style=flat-square)
![skills](https://img.shields.io/badge/skills-9-111111?style=flat-square)
![files](https://img.shields.io/badge/files-48-111111?style=flat-square)
![node](https://img.shields.io/badge/node-18%2B-111111?style=flat-square)
![dependencies](https://img.shields.io/badge/dependencies-0-111111?style=flat-square)

**48 files · 9 skills · 3 layers of guardrails · 0 npm dependencies**

Most AI coding setups live in one tool, on one machine, and quietly rot. This repo is the opposite: one source of truth for how I want an agent to work — the rules it follows, the skills it can pick up, and the hooks that stop the dangerous commands even when nobody is watching.

Clone it, run one installer, and Claude Code, Codex, Copilot, Cursor and Gemini all work the same way: same rules, same commit discipline, same safety net.

---

## How it works

Three layers, each doing one job:

1. **Rules — `AGENTS.md`.** The standing instructions every agent reads first: understand before editing, smallest complete change, verify with a real check, never force-push, no secrets. One file is the source of truth; `CLAUDE.md`, `.muserules` and `.github/muse-instructions.md` just point their tools at it.
2. **Skills — `skills/`.** Playbooks for recurring work, invoked on demand: tidying a branch into a PR, reviewing a diff, auditing a repo, cutting a release.
3. **Guardrails — hooks that run, not rules that ask.** An agent-hook guard checks tool calls before they execute, git hooks check the command when git runs it, and a per-project pre-commit hook scans for secrets. Overlapping on purpose: if one layer is off, the others still hold.

## What's inside

| Folder / file | What it is |
|---|---|
| `AGENTS.md` | The rules every agent follows. Read it first. |
| `CLAUDE.md` | Points Claude Code at `AGENTS.md`. |
| `.github/muse-instructions.md` | Points GitHub Copilot at `AGENTS.md`. |
| `.muserules` | Points Cursor at `AGENTS.md`. |
| `skills/` | Playbooks for recurring work — see the Skills table below. |
| `git-hooks/` | Guardrails that run when git actually runs a hook. |
| `hooks/` | Per-project bash hooks for a repo's `.git/hooks`. |
| `adapters/claude-code-hooks.json` | Claude Code settings that wire in the agent guard. |
| `agent-hooks/guard.js` | Guardrails that run before the agent's tool call. |
| `install.js` | One command to install everything. |
| `config.example.json` | Example config for protected branches. |
| `lib/` | Shared code used by `install.js` and the hooks. |
| `.claude-plugin/` | Claude Code plugin manifest and marketplace listing. |
| `.codex-plugin/`, `.agents/plugins/` | Codex plugin manifest and marketplace listing. |
| `PLAYBOOK.md` | This whole kit as one generated file — see below. |

## Install

**Requirements:** Node.js 18+, git on your PATH. (Bash is only needed for the per-project hooks on macOS / Linux; the Node hooks run anywhere. The plugin route needs neither Node nor git — the tool fetches everything.)

### Recommended — install as a plugin, no clone

In **Claude Code**:

```
/plugin marketplace add kxg50820/agent-playbook
/plugin install agent-playbook@agent-playbook
```

In **Codex**:

```bash
codex plugin marketplace add kxg50820/agent-playbook
codex plugin add agent-playbook@agent-playbook
```

The tool downloads the plugin and registers the skills and the guard hook for you; updates arrive through the tool as well. Nothing is cloned and nothing needs editing.

**Staying up to date:** installed plugins are cached per version. In Claude Code open `/plugin`, go to Marketplaces, pick `agent-playbook` and turn on auto-update; it then fetches new releases at startup. To update by hand: `/plugin marketplace update agent-playbook`.

**Maintainers:** bump `version` in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and `.codex-plugin/plugin.json` in every change users should receive (`npm test` fails if the three differ). Without a bump, installed copies do not update.

### From a clone — one machine, every tool

```bash
node install.js --git-hooks
```

This installs the skills, the `AGENTS.md` rules and the guardrails globally, so every tool on the machine picks them up. The installer never deletes your existing `AGENTS.md`, `CLAUDE.md`, `.muserules`, `.github/muse-instructions.md` or `.git/hooks` files without asking — it backs them up first.

Preview, limit, or remove:

```bash
node install.js --only claude,gemini   # only the tools you use
node install.js --dry-run              # show what would change
node install.js --uninstall            # take it all back out
```

**Option A — install into a repo you work on:**

```bash
git clone https://github.com/kxg50820/agent-playbook.git
cd <your-project>
node ../agent-playbook/install.js
```

**Option B — portable copy, no install:** copy `AGENTS.md`, `CLAUDE.md` and any skill folders you need into the project. For the secret scan, add the pre-commit hook by hand:

```bash
cp hooks/pre-commit .git/hooks/ && chmod +x .git/hooks/pre-commit
```

## Skills

| Skill | When you reach for it | What it does |
|---|---|---|
| `playbook` | Any task, in a project using this playbook | The umbrella skill of the agent-playbook plugin: the standing rules, plus routing to the right skill below — with compact fallbacks if the others aren't installed. |
| `split-commit-pr` | A branch is done and messy | Splits it into clean, logical commits and drafts the PR. **Jira ticket first:** the ticket goes in the PR description next to the Summary — and if there is no ticket in your message or the branch name, it asks before committing. Never invents one. |
| `change-ticket-release` | A change needs a ticket or a release | Writes the change ticket and release notes; its script diffs JSON semantically, so key-order noise disappears. |
| `ponytail` | Everyday coding | The smallest complete change: a YAGNI ladder (need it? → already here? → stdlib/platform? → installed dependency? → one line? → minimum that works), with `lite` / `full` / `ultra` levels. Never cuts validation, data-loss handling, security or accessibility. |
| `ponytail-review` | Before opening a PR | Reviews a change like the dev who gets paged when it breaks: bugs, security, load, missing tests, speed, and what to cut. Numbered findings in plain English — must fix / should fix / nice to have. Report only. |
| `ponytail-audit` | A repo feels bloated or risky | The same review across the whole codebase, ranked, most important first. Report only. |
| `ponytail-debt` | Shortcuts are piling up | Collects every `shortcut:` comment into a debt ledger, flagging the ones with no upgrade trigger. |
| `ponytail-gain` | Someone asks "is this worth it?" | Shows Ponytail's published benchmark scoreboard. Upstream figures, not a measurement of your repo. |
| `ponytail-help` | You forgot a command | One-card reference for the levels and skills above. |

New skills start from `templates/skill-template/`, and `skills/README.md` holds the house rules for adding one: read the source in full first, and record where it came from and when.

The Ponytail skills are imported from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) under MIT, with attribution in each file. This repo's own `AGENTS.md` wins on any conflict.

## Guardrails

Two global layers, plus a per-project one:

- **Git hooks (`git-hooks/`)** — run when git runs a hook. The pre-push guard blocks force-pushes, deleting protected branches, and direct pushes to protected branches. `run-hook.js` chains on to any local `.git/hooks` file, so repo-specific hooks still work.
- **Agent hooks (`agent-hooks/guard.js`, wired via `adapters/claude-code-hooks.json`)** — run before the agent's Bash / PowerShell tool call, before git is even invoked: force-pushes are blocked, and a commit or push on a protected branch asks first.
- **Project hooks (`hooks/`)** — per-project bash hooks for a repo's `.git/hooks`. The pre-commit hook blocks secret files, token patterns, and files over 5 MB.

The plugin install wires the agent hook for you. For the other layers:

```bash
node install.js --git-hooks                        # git hooks, every repo on this machine
cp hooks/pre-commit .git/hooks/pre-commit          # secret scan, current repo only
```

Without the plugin, merge `adapters/claude-code-hooks.json` into your tool's settings to get the agent hook.

To change what counts as protected — or to allow protected pushes on one machine — copy `config.example.json` to `config.local.json` and edit it. The local file is gitignored.

## Safety rules (summary)

- Never force-push. Never rewrite history or amend a pushed commit.
- Never push directly to `main` / `master`.
- Never commit `.env`, `.pem`, `.key`, private keys, tokens or passwords.
- Never run destructive commands (`rm -rf`, `git reset --hard`, `git clean -fd`) without explicit approval.
- Test and lint before finishing; if tests fail, say so — do not claim success.

The full rules are in `AGENTS.md`; the guardrails above are what enforce them.

## A normal day with it

Pick up a ticket → branch named with the ticket → code with ponytail on → `ponytail-review` on the diff → `split-commit-pr` to commit and draft the PR → the hooks check everything again on the way out. Once in a while: an audit, a debt pass, a release ticket.

## PLAYBOOK.md

`PLAYBOOK.md` is this same kit compiled into one generated file — for when you can't clone the repo, or a tool only accepts pasted text. It holds a catalogue, the folder structure, an extract script that rebuilds the repo from the file, and the full source of every other file.

It is generated, not hand-written: change a source file, regenerate `PLAYBOOK.md`, then commit.

## FAQ

**Do the skills change code on their own?**
No. Skills are instructions the agent follows while working; the review, audit, debt and gain skills are reports and change nothing at all.

**What if a tool doesn't support skills?**
It still gets the rules: the entry-point files (`CLAUDE.md`, `.muserules`, Copilot instructions) point every tool at `AGENTS.md`, and `PLAYBOOK.md` can be pasted anywhere.

**Windows or Mac?**
Both. The installer and the guards are Node and cross-platform; only the small per-project bash hooks assume macOS / Linux.

**Can I use this without cloning the repo?**
Yes. Install it as a plugin (see Install) and the tool fetches it for you. On a tool without plugin support, copy a single `skills/<name>/` folder into its skills directory, or paste `PLAYBOOK.md` into the chat.
