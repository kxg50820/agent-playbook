# agent-playbook — everything in one file

Portable skills, rules and git guardrails for any AI coding agent (Claude Code, Codex, Copilot, Cursor, Gemini CLI, …), any company, any project.
This single file contains the catalogue, the folder structure and the full source of every file, so the repo can be rebuilt anywhere.

## 1. Catalogue

### Rules (`AGENTS.md`)
| Rule | Summary |
|---|---|
| Think before coding | State assumptions first; ask, don't guess |
| Simplicity first | Minimum code that solves the request |
| Surgical changes | Touch only what the request needs |
| Goal-driven | Define a verifiable check first, code until it passes |
| Git | Jira ticket first; never force-push or rewrite pushed history; multiple commits, one PR; ask before committing; never commit to main/master |
| Ponytail | Smallest complete change; lite / full / ultra levels |
| Hygiene | No secrets, don't hand-edit generated files, don't suppress scanner findings, keep file formatting/encoding |

### Tool entry points
| File | Tool | Content |
|---|---|---|
| `CLAUDE.md` | Claude Code | Imports `@AGENTS.md` + Claude-specific notes |
| `.github/muse-instructions.md` | Copilot | Points to AGENTS.md |
| `.muserules` | Cursor | Points to AGENTS.md |
| `README.md` | Project docs | Overview of the rules, skills, installation and guardrails |

### Plugins
| Path | Tool | Content |
|---|---|---|
| `.claude-plugin/` | Claude Code | Plugin manifest and marketplace listing |
| `.codex-plugin/` + `.agents/plugins/` | Codex | Plugin manifest and marketplace listing |
| `hooks/plugin-hooks.json` | Claude Code | Wires the agent guard into plugin tool-call hooks |

### Skills (`skills/`)
| Skill | Use when | Helper script |
|---|---|---|
| `agent-playbook` | Any task in a project using this playbook; routes work to the relevant skill | — |
| `split-commit-pr` | Create a branch, split work into logical commits, push (never force), open ONE PR whose title/body cover the whole branch; ask for the Jira ticket before committing if missing | `scripts/pr-draft.js` — builds the PR body from all commits, prints `gh` commands and a prefilled compare URL |
| `_template` | Starting point for a new skill (not installed) | — |
| `change-ticket-release` | Promote validated changes (e.g. stage → prod) under a change ticket: ask ticket first, branch named after it, parity table, copy only approved items | `scripts/json-diff.js` — semantic JSON diff (ignores key order/BOM, matches array items by id) |
| `ponytail` | Coding tasks where the smallest complete change is preferred | — |
| `ponytail-review` | Review a change for correctness, safety, load, tests, speed and lean code | — |
| `ponytail-audit` | Audit a whole repo for bugs, risks, load, tests, speed and what to cut | — |
| `ponytail-debt` | List deliberate `shortcut:` comments in a debt ledger | — |
| `ponytail-gain` | Display Ponytail's published benchmark results | — |
| `ponytail-help` | Show a quick reference for Ponytail levels and skills | — |

### Hooks / guardrails
| Hook | Where it runs | What it does |
|---|---|---|
| `git-hooks/pre-push` → `guards/pre-push.js` | git itself (any tool or human), via global `core.hooksPath` | Blocks force-push, deleting protected branches, direct push to `main`/`master` (per-repo opt-in: `git config agentPlaybook.allowProtectedPush true`) |
| `git-hooks/<other hooks>` | git | No guard; just chain to the repo's own `.git/hooks/<name>` so husky etc. keep working |
| `hooks/pre-commit` (bash) | One repo, copied to `.git/hooks/pre-commit` | Blocks secret-looking files (.env, .pem, .key, id_rsa, credentials), token-shaped strings, and files > 5 MB |
| `hooks/plugin-hooks.json` | Claude Code plugin | Runs `agent-hooks/guard.js` before Bash / PowerShell calls |
| `agent-hooks/guard.js` | Agents with command hooks | Denies force-push commands; asks before commit/push on a protected branch. Fails open |

## 2. Structure

48 files total, including `PLAYBOOK.md`.

```text
agent-playbook/
├── .agents/
│   └── plugins/
│       └── marketplace.json
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── .codex-plugin/
│   └── plugin.json
├── .github/
│   └── muse-instructions.md   # Copilot entry point -> AGENTS.md
├── adapters/   # hook config snippets per tool
│   └── claude-code-hooks.json
├── agent-hooks/   # optional agent-level guard
│   └── guard.js
├── git-hooks/   # global git hooks (core.hooksPath)
│   ├── guards/
│   │   └── pre-push.js   # blocks force-push, protected-branch push/delete
│   ├── applypatch-msg
│   ├── commit-msg
│   ├── post-applypatch
│   ├── post-checkout
│   ├── post-commit
│   ├── post-merge
│   ├── post-rewrite
│   ├── pre-applypatch
│   ├── pre-auto-gc
│   ├── pre-commit
│   ├── pre-merge-commit
│   ├── prepare-commit-msg
│   ├── pre-push
│   ├── pre-rebase
│   └── run-hook.js   # dispatcher: guard, then the repo's own .git/hooks/<name>
├── hooks/   # per-project bash hooks and plugin hook configuration
│   ├── plugin-hooks.json
│   └── pre-commit
├── lib/   # shared helpers for hooks/installer
│   ├── config.js
│   └── git.js
├── skills/   # SKILL.md skills (open format)
│   ├── _template/   # starting point for a new skill
│   │   └── SKILL.md
│   ├── agent-playbook/
│   │   └── SKILL.md
│   ├── change-ticket-release/
│   │   ├── scripts/
│   │   │   └── json-diff.js
│   │   └── SKILL.md
│   ├── ponytail/
│   │   └── SKILL.md
│   ├── ponytail-audit/
│   │   └── SKILL.md
│   ├── ponytail-debt/
│   │   └── SKILL.md
│   ├── ponytail-gain/
│   │   └── SKILL.md
│   ├── ponytail-help/
│   │   └── SKILL.md
│   ├── ponytail-review/
│   │   └── SKILL.md
│   ├── split-commit-pr/
│   │   ├── scripts/
│   │   │   └── pr-draft.js
│   │   └── SKILL.md
│   └── README.md   # install + usage
├── .gitignore
├── .muserules   # Cursor entry point -> AGENTS.md
├── AGENTS.md   # personal rules for every agent
├── CLAUDE.md   # Claude Code entry point -> AGENTS.md
├── config.example.json   # defaults (override in config.local.json, gitignored)
├── install.js   # links skills into detected tools, optional git hooks
├── PLAYBOOK.md
└── README.md   # install + usage
```
## 3. Rebuild the repo from this file

Save the script below as `extract.js` next to this file, then run (macOS, Linux or Windows):

```bash
node extract.js PLAYBOOK.md agent-playbook
cd agent-playbook
node install.js --dry-run     # preview
node install.js               # link skills into detected tools
node install.js --git-hooks   # optional: global git guardrails
```

```js
#!/usr/bin/env node
// Recreates the agent-playbook repo from PLAYBOOK.md. Usage: node extract.js PLAYBOOK.md [targetDir]
"use strict";
const fs = require("fs");
const path = require("path");
const [src, out = "agent-playbook"] = process.argv.slice(2);
const text = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n");
const re = /<!-- file: (\S+?)( exec)? -->\n~~~~[a-z]*\n([\s\S]*?)\n~~~~\n/g;
let m, n = 0;
while ((m = re.exec(text))) {
  const dest = path.join(out, m[1]);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, m[3] + "\n");
  if (m[2]) fs.chmodSync(dest, 0o755);
  n++;
}
console.log("Wrote " + n + " files to " + path.resolve(out));
```

## 4. Files

### `.github/muse-instructions.md`

<!-- file: .github/muse-instructions.md -->
~~~~markdown
<!-- Copilot entry point. Source of truth is ../AGENTS.md — keep this in sync. -->

Follow the rules in AGENTS.md at the repo root: think before coding,
simplicity first, surgical changes, and goal-driven execution with
verification. Match existing patterns, run tests after changes, and
never include secrets or invent APIs.
~~~~

### `.gitignore`

<!-- file: .gitignore -->
~~~~
config.local.json
node_modules/
.env
.env.*
*.pem
*.key
id_rsa*
.DS_Store
~~~~

### `.muserules`

<!-- file: .muserules -->
~~~~
Follow AGENTS.md at the repo root as the source of truth.
Think before coding, simplicity first, surgical changes only,
goal-driven execution — verify with tests/build before finishing.
Never include secrets. Match existing code patterns.
~~~~

### `AGENTS.md`

<!-- file: AGENTS.md -->
~~~~markdown
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






















~~~~

### `CLAUDE.md`

<!-- file: CLAUDE.md -->
~~~~markdown
# CLAUDE.md

All rules live in AGENTS.md — this file is only the Claude Code entry point.

@AGENTS.md

Claude-specific notes:
- Prefer plan mode / thinking before large or ambiguous changes.
- Verify with tests or a build before saying a task is done.
~~~~

### `README.md`

<!-- file: README.md -->
~~~~markdown
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

The tool downloads the plugin and registers the skills and the guard hook for you; updates arrive through the tool as well. Nothing is cloned and nothing needs editing. (While this repo is private, the plugin route needs a GitHub login with access to it; the clone route below installs the same content by hand.)

### From a clone — one machine, every tool

```bash
node install.js --git-hooks --agent-guard
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
| `agent-playbook` | Any task, in a project using this playbook | The umbrella skill: the standing rules, plus routing to the right skill below — with compact fallbacks if the others aren't installed. |
| `split-commit-pr` | A branch is done and messy | Splits it into clean, logical commits and drafts the PR. **Jira ticket first:** the ticket goes in the PR description next to the Summary — and if there is no ticket in your message or the branch name, it asks before committing. Never invents one. |
| `change-ticket-release` | A change needs a ticket or a release | Writes the change ticket and release notes; its script diffs JSON semantically, so key-order noise disappears. |
| `ponytail` | Everyday coding | The smallest complete change: a YAGNI ladder (need it? → already here? → stdlib/platform? → installed dependency? → one line? → minimum that works), with `lite` / `full` / `ultra` levels. Never cuts validation, data-loss handling, security or accessibility. |
| `ponytail-review` | Before opening a PR | Reviews a change like the dev who gets paged when it breaks: bugs, security, load, missing tests, speed, and what to cut. Numbered findings in plain English — must fix / should fix / nice to have. Report only. |
| `ponytail-audit` | A repo feels bloated or risky | The same review across the whole codebase, ranked, most important first. Report only. |
| `ponytail-debt` | Shortcuts are piling up | Collects every `shortcut:` comment into a debt ledger, flagging the ones with no upgrade trigger. |
| `ponytail-gain` | Someone asks "is this worth it?" | Shows Ponytail's published benchmark scoreboard. Upstream figures, not a measurement of your repo. |
| `ponytail-help` | You forgot a command | One-card reference for the levels and skills above. |

New skills start from `skills/_template/`, and `skills/README.md` holds the house rules for adding one: read the source in full first, and record where it came from and when.

The Ponytail skills are imported from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) under MIT, with attribution in each file. This repo's own `AGENTS.md` wins on any conflict.

## Guardrails

Two global layers, plus a per-project one:

- **Git hooks (`git-hooks/`)** — run when git runs a hook. The pre-push guard blocks force-pushes, deleting protected branches, and direct pushes to protected branches. `run-hook.js` chains on to any local `.git/hooks` file, so repo-specific hooks still work.
- **Agent hooks (`agent-hooks/guard.js`, wired via `adapters/claude-code-hooks.json`)** — run before the agent's Bash / PowerShell tool call, before git is even invoked: force-pushes are blocked, and a commit or push on a protected branch asks first.
- **Project hooks (`hooks/`)** — per-project bash hooks for a repo's `.git/hooks`. The pre-commit hook blocks secret files, token patterns, and files over 5 MB.

Install them globally, or for one repo only:

```bash
node install.js --git-hooks --agent-guard   # every repo on this machine
node install.js --git-hooks                 # current repo only
```

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

**Why is this repo private?**
It's a personal workflow, tuned to my projects and my employers' conventions. The Ponytail parts remain MIT under their own attribution, as noted in each imported file.
~~~~

### `adapters/claude-code-hooks.json`

<!-- file: adapters/claude-code-hooks.json -->
~~~~json
{
  "_comment": "Merge the 'hooks' block into your tool's user settings (e.g. ~/.claude/settings.json). Replace <PLAYBOOK> with the absolute path of this repo.",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|PowerShell",
        "hooks": [
          {
            "type": "command",
            "command": "node \"<PLAYBOOK>/agent-hooks/guard.js\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
~~~~

### `agent-hooks/guard.js`

<!-- file: agent-hooks/guard.js -->
~~~~js
#!/usr/bin/env node
/*
 * Optional agent-level guard for tools that support command hooks with the
 * "PreToolUse" JSON protocol (Claude Code and compatible tools). See adapters/.
 *
 * Reads the hook payload on stdin. For shell commands it:
 *   - denies force-push;
 *   - asks for confirmation before commit/push while on, or pushing to, a protected branch.
 * Never blocks anything else; any internal error means "allow" (the git hooks remain the backstop).
 */
"use strict";

const fs = require("fs");
const { currentBranch } = require("../lib/git");
const { loadConfig } = require("../lib/config");

function decide(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: reason },
    })
  );
  process.exit(0);
}

function main() {
  const raw = fs.readFileSync(0, "utf8");
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const cmd = String((payload.tool_input || {}).command || "");
  if (!cmd) return;

  for (const seg of cmd.split(/&&|\|\||;|\||\n/)) {
    if (!/\bgit\b.*\bpush\b/.test(seg)) continue;
    const forceFlag = /(^|\s)(--force(-with-lease|-if-includes)?(=\S*)?|-[a-zA-Z]*f[a-zA-Z]*)(?=\s|$)/.test(seg);
    const plusRefspec = /\s\+\S+/.test(seg);
    if (forceFlag || plusRefspec) {
      decide("deny", "Force-push is not allowed. Add a new commit and use a plain git push.");
    }
  }

  if (/\bgit\s+(commit|push)\b/.test(cmd)) {
    const protectedBranches = loadConfig().protectedBranches || ["main", "master"];
    const branch = currentBranch(payload.cwd);
    const target = protectedBranches.find(
      (b) => branch === b || new RegExp("git\\s+push\\s+\\S+\\s+(\\S+:)?(refs/heads/)?" + b + "(\\s|$)").test(cmd)
    );
    if (target) decide("ask", "Commit/push involves protected branch '" + target + "'. Create a feature branch first?");
  }
}

try {
  main();
} catch (e) {
  // Fail open: never break the agent because of this guard.
}
process.exit(0);
~~~~

### `config.example.json`

<!-- file: config.example.json -->
~~~~json
{
  "ticketPattern": "^[A-Z][A-Z0-9]+-?[0-9]+$",
  "ticketExample": "CR-1234",
  "protectedBranches": ["main", "master"],
  "commitFooter": "",
  "prFooter": ""
}
~~~~

### `git-hooks/applypatch-msg`

<!-- file: git-hooks/applypatch-msg -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/applypatch-msg).
exec node "$(dirname "$0")/run-hook.js" applypatch-msg "$@"
~~~~

### `git-hooks/commit-msg`

<!-- file: git-hooks/commit-msg -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/commit-msg).
exec node "$(dirname "$0")/run-hook.js" commit-msg "$@"
~~~~

### `git-hooks/guards/pre-push.js`

<!-- file: git-hooks/guards/pre-push.js -->
~~~~js
"use strict";
/*
 * pre-push guard. Blocks:
 *   - force-pushes (the remote tip is not an ancestor of what is being pushed);
 *   - deleting a protected branch;
 *   - pushing to a protected branch (main/master by default).
 *
 * Per-repo opt-in for direct pushes to protected branches (e.g. personal repos):
 *   git config agentPlaybook.allowProtectedPush true
 * Protected branch names: "protectedBranches" in config.local.json.
 */

const { git } = require("../../lib/git");
const { loadConfig } = require("../../lib/config");

const isZero = (sha) => /^0+$/.test(sha);

module.exports = function prePush(args, stdin) {
  const remote = args[0] || "origin";
  const protectedBranches = loadConfig().protectedBranches || ["main", "master"];
  const allowProtected = git(["config", "--bool", "agentPlaybook.allowProtectedPush"]) === "true";

  for (const line of (stdin || "").split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    const [, localSha, remoteRef, remoteSha] = parts;
    const branch = remoteRef.replace(/^refs\/heads\//, "");
    const isProtected = remoteRef.startsWith("refs/heads/") && protectedBranches.includes(branch);

    if (isZero(localSha)) {
      if (isProtected) return "Refusing to delete protected branch '" + branch + "' on " + remote + ".";
      continue;
    }

    if (isProtected && !allowProtected) {
      return (
        "Direct push to protected branch '" + branch + "' blocked. Push a feature branch and open a PR.\n" +
        "  (Personal repo? Allow it once per repo: git config agentPlaybook.allowProtectedPush true)"
      );
    }

    if (!isZero(remoteSha)) {
      const known = git(["cat-file", "-e", remoteSha + "^{commit}"]) !== null;
      if (!known) {
        return (
          "'" + branch + "' on " + remote + " has commits you don't have locally; pushing over them would be a " +
          "force-push.\n  Run: git pull --no-rebase " + remote + " " + branch + "  then push again."
        );
      }
      const fastForward = git(["merge-base", "--is-ancestor", remoteSha, localSha]) !== null;
      if (!fastForward) {
        return (
          "Force-push to '" + branch + "' blocked: it would rewrite history on " + remote + ".\n" +
          "  Add a new commit (fix:/revert:) or merge instead of rebasing/amending."
        );
      }
    }
  }
  return null;
};
~~~~

### `git-hooks/post-applypatch`

<!-- file: git-hooks/post-applypatch -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-applypatch).
exec node "$(dirname "$0")/run-hook.js" post-applypatch "$@"
~~~~

### `git-hooks/post-checkout`

<!-- file: git-hooks/post-checkout -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-checkout).
exec node "$(dirname "$0")/run-hook.js" post-checkout "$@"
~~~~

### `git-hooks/post-commit`

<!-- file: git-hooks/post-commit -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-commit).
exec node "$(dirname "$0")/run-hook.js" post-commit "$@"
~~~~

### `git-hooks/post-merge`

<!-- file: git-hooks/post-merge -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-merge).
exec node "$(dirname "$0")/run-hook.js" post-merge "$@"
~~~~

### `git-hooks/post-rewrite`

<!-- file: git-hooks/post-rewrite -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-rewrite).
exec node "$(dirname "$0")/run-hook.js" post-rewrite "$@"
~~~~

### `git-hooks/pre-applypatch`

<!-- file: git-hooks/pre-applypatch -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-applypatch).
exec node "$(dirname "$0")/run-hook.js" pre-applypatch "$@"
~~~~

### `git-hooks/pre-auto-gc`

<!-- file: git-hooks/pre-auto-gc -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-auto-gc).
exec node "$(dirname "$0")/run-hook.js" pre-auto-gc "$@"
~~~~

### `git-hooks/pre-commit`

<!-- file: git-hooks/pre-commit -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-commit).
exec node "$(dirname "$0")/run-hook.js" pre-commit "$@"
~~~~

### `git-hooks/pre-merge-commit`

<!-- file: git-hooks/pre-merge-commit -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-merge-commit).
exec node "$(dirname "$0")/run-hook.js" pre-merge-commit "$@"
~~~~

### `git-hooks/prepare-commit-msg`

<!-- file: git-hooks/prepare-commit-msg -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/prepare-commit-msg).
exec node "$(dirname "$0")/run-hook.js" prepare-commit-msg "$@"
~~~~

### `git-hooks/pre-push`

<!-- file: git-hooks/pre-push -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-push).
exec node "$(dirname "$0")/run-hook.js" pre-push "$@"
~~~~

### `git-hooks/pre-rebase`

<!-- file: git-hooks/pre-rebase -->
~~~~bash
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-rebase).
exec node "$(dirname "$0")/run-hook.js" pre-rebase "$@"
~~~~

### `git-hooks/run-hook.js`

<!-- file: git-hooks/run-hook.js -->
~~~~js
#!/usr/bin/env node
/*
 * Global git hook dispatcher (used via `git config --global core.hooksPath <repo>/git-hooks`).
 *
 * 1. Runs this playbook's guard for the hook (currently: pre-push).
 * 2. Then runs the repository's own hook from .git/hooks/<name> (e.g. husky), so setting a global
 *    core.hooksPath doesn't silently disable per-repo hooks.
 *
 * Repos that set their own local core.hooksPath (e.g. husky v5+) bypass this file entirely.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { git } = require("../lib/git");

const hook = process.argv[2];
const args = process.argv.slice(3);

// Only these hooks receive data on stdin. Reading stdin for others could block on a terminal.
const STDIN_HOOKS = new Set(["pre-push", "post-rewrite"]);
const stdin = STDIN_HOOKS.has(hook) ? fs.readFileSync(0, "utf8") : null;

const guards = { "pre-push": require("./guards/pre-push") };

if (guards[hook]) {
  const problem = guards[hook](args, stdin);
  if (problem) {
    process.stderr.write("\n[agent-playbook] " + problem + "\n\n");
    process.exit(1);
  }
}

// Chain to the repository's own hook. (Not `--git-path hooks`: that resolves to core.hooksPath, i.e. us.)
const commonDir = git(["rev-parse", "--git-common-dir"]);
if (commonDir) {
  const local = path.resolve(commonDir, "hooks", hook);
  const self = path.resolve(__dirname, hook);
  if (local !== self && fs.existsSync(local)) {
    const isWin = process.platform === "win32";
    const r = spawnSync(isWin ? "sh" : local, isWin ? [local].concat(args) : args, {
      stdio: [stdin === null ? "inherit" : "pipe", "inherit", "inherit"],
      input: stdin === null ? undefined : stdin,
      windowsHide: true,
    });
    if (r.error) {
      // Not executable / no shell: same behaviour as git, which ignores non-executable hooks.
      if (r.error.code !== "EACCES" && r.error.code !== "ENOENT") throw r.error;
    } else {
      process.exit(r.status === null ? 1 : r.status);
    }
  }
}
process.exit(0);
~~~~

### `hooks/pre-commit`

<!-- file: hooks/pre-commit -->
~~~~bash
#!/usr/bin/env bash
# Playbook pre-commit: block secrets and large files.
set -euo pipefail

fail=0

# 1. Block obviously secret files
if git diff --cached --name-only | grep -E '(^|/)\.env($|\.)|\.pem$|\.key$|id_rsa|credentials'; then
  echo "✗ Blocked: staged file looks like a secret/credential file."
  fail=1
fi

# 2. Block token-shaped strings in staged changes
if git diff --cached | grep -E '(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'; then
  echo "✗ Blocked: staged change contains a token / private key pattern."
  fail=1
fi

# 3. Block files > 5 MB
for f in $(git diff --cached --name-only --diff-filter=ACM); do
  [ -f "$f" ] || continue
  size=$(wc -c < "$f")
  if [ "$size" -gt 5242880 ]; then
    echo "✗ Blocked: $f is $((size/1024/1024)) MB (>5 MB limit)."
    fail=1
  fi
done

[ "$fail" -eq 0 ] || { echo "Commit aborted by agent-playbook pre-commit hook."; exit 1; }
exit 0
~~~~

### `install.js`

<!-- file: install.js -->
~~~~js
#!/usr/bin/env node
/*
 * Installs the playbook for whichever AI coding tools exist on this machine.
 * Cross-platform (macOS, Linux, Windows), no dependencies, idempotent.
 *
 *   node install.js                      # link skills into every detected tool
 *   node install.js --only claude,codex  # limit to some tools
 *   node install.js --git-hooks          # also set global core.hooksPath to ./git-hooks
 *   node install.js --dry-run            # show what would happen
 *   node install.js --uninstall          # remove links created by this script (and core.hooksPath if ours)
 *
 * Never overwrites an existing skill folder that isn't a link to this repo.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { git } = require("./lib/git");
const { loadConfig } = require("./lib/config");

const ROOT = __dirname;
const HOME = os.homedir();
const SKILLS = path.join(ROOT, "skills");
const HOOKS = path.join(ROOT, "git-hooks");

// Tool -> its user-level config dir and skills dir. Add more tools here, or add
// machine-specific ones via "extraTools" in config.local.json, e.g.
//   "extraTools": { "mytool": { "dir": ".mytool", "skills": "skills", "rules": "AGENTS.md" } }
const TOOLS = Object.assign(
  {
    claude: { dir: ".claude", skills: "skills", rules: "CLAUDE.md (add: @" + path.join(ROOT, "AGENTS.md") + ")" },
    codex: { dir: ".codex", skills: "skills", rules: "AGENTS.md" },
    copilot: { dir: ".copilot", skills: "skills", rules: "per repo: .github/copilot-instructions.md or AGENTS.md" },
    cursor: { dir: ".cursor", skills: "skills", rules: "per repo: AGENTS.md" },
    gemini: { dir: ".gemini", skills: "skills", rules: "GEMINI.md" },
  },
  loadConfig().extraTools || {}
);

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const DRY = has("--dry-run");
const UNINSTALL = has("--uninstall");
const onlyIdx = argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? (argv[onlyIdx + 1] || "").split(",").filter(Boolean) : null;

const log = (s) => console.log((DRY ? "[dry-run] " : "") + s);

function realOrNull(p) {
  try {
    return fs.realpathSync(p);
  } catch (e) {
    return null;
  }
}

function linkDir(target, linkPath) {
  if (DRY) return;
  // Junctions need no admin rights on Windows; ignored elsewhere.
  fs.symlinkSync(target, linkPath, process.platform === "win32" ? "junction" : "dir");
}

// Removes only the link itself, never the target's contents.
function removeLink(p) {
  try {
    fs.unlinkSync(p);
  } catch (e) {
    fs.rmdirSync(p); // Windows junctions
  }
}

// Folders starting with "_" (e.g. _template) are not installed.
const skills = fs
  .readdirSync(SKILLS)
  .filter((n) => !n.startsWith("_") && fs.existsSync(path.join(SKILLS, n, "SKILL.md")));
const tools = Object.keys(TOOLS).filter((t) => (!ONLY || ONLY.includes(t)) && fs.existsSync(path.join(HOME, TOOLS[t].dir)));

if (ONLY) for (const t of ONLY) if (!TOOLS[t]) console.warn("Unknown tool '" + t + "'. Known: " + Object.keys(TOOLS).join(", "));
if (!tools.length) console.log("No supported tool folders found in " + HOME + (ONLY ? " for --only " + ONLY : "") + ".");

for (const t of tools) {
  const skillsDir = path.join(HOME, TOOLS[t].dir, TOOLS[t].skills);
  console.log("\n" + t + ": " + skillsDir);
  if (!UNINSTALL && !fs.existsSync(skillsDir) && !DRY) fs.mkdirSync(skillsDir, { recursive: true });

  for (const name of skills) {
    const src = path.join(SKILLS, name);
    const dest = path.join(skillsDir, name);
    const current = realOrNull(dest);
    const ours = current === realOrNull(src);

    if (UNINSTALL) {
      if (ours) {
        log("  remove " + name);
        if (!DRY) removeLink(dest);
      }
      continue;
    }
    if (ours) {
      log("  ok     " + name + " (already linked)");
    } else if (fs.existsSync(dest) || current !== null) {
      log("  SKIP   " + name + " (a different '" + name + "' already exists; rename or remove it first)");
    } else {
      log("  link   " + name);
      linkDir(src, dest);
    }
  }
  if (!UNINSTALL) console.log("  rules: " + TOOLS[t].rules);
}

// Global git hooks (opt-in).
const currentHooksPath = git(["config", "--global", "core.hooksPath"]);
if (has("--git-hooks") && !UNINSTALL) {
  if (currentHooksPath && path.resolve(currentHooksPath) !== HOOKS) {
    console.log("\ncore.hooksPath is already set to " + currentHooksPath + "; not changing it.");
  } else {
    log("\nSet global core.hooksPath -> " + HOOKS);
    if (!DRY) git(["config", "--global", "core.hooksPath", HOOKS]);
  }
} else if (UNINSTALL && currentHooksPath && path.resolve(currentHooksPath) === HOOKS) {
  log("\nUnset global core.hooksPath");
  if (!DRY) git(["config", "--global", "--unset", "core.hooksPath"]);
}

if (!UNINSTALL) {
  console.log("\nOptional agent-level guard (Claude Code-style hooks): see adapters/claude-code-hooks.json");
  console.log("  command: node \"" + path.join(ROOT, "agent-hooks", "guard.js") + "\"");
}
~~~~

### `lib/config.js`

<!-- file: lib/config.js -->
~~~~js
"use strict";
// Loads config.example.json, overlaid by config.local.json (gitignored, per machine).

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return {};
  }
}

function loadConfig() {
  return Object.assign(
    readJson(path.join(ROOT, "config.example.json")),
    readJson(path.join(ROOT, "config.local.json"))
  );
}

module.exports = { ROOT, loadConfig };
~~~~

### `lib/git.js`

<!-- file: lib/git.js -->
~~~~js
"use strict";

const { spawnSync } = require("child_process");

// Returns trimmed stdout, or null when git fails.
function git(args, cwd) {
  const r = spawnSync("git", args, {
    cwd: cwd || undefined,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 256 * 1024 * 1024,
  });
  if (r.error || r.status !== 0) return null;
  return r.stdout.trim();
}

function currentBranch(cwd) {
  return git(["branch", "--show-current"], cwd) || "";
}

// "git@host:owner/repo.git" | "https://host/owner/repo.git" -> { host, slug, web }
function remoteInfo(remote, cwd) {
  const url = git(["remote", "get-url", remote || "origin"], cwd);
  if (!url) return null;
  const m = url.match(/^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?([^/:]+)[:/](?:\d+\/)?(.+?)(?:\.git)?\/?$/i);
  if (!m) return null;
  return { host: m[1], slug: m[2], web: "https://" + m[1] + "/" + m[2] };
}

module.exports = { git, currentBranch, remoteInfo };
~~~~

### `skills/_template/SKILL.md`

<!-- file: skills/_template/SKILL.md -->
~~~~markdown
---
name: my-skill-name
description: One line — what this skill does and when an agent should use it.
---

# My Skill

## When to use
Describe the trigger clearly, so an agent picks this up at the right moment.

## Steps
1. ...
2. ...
3. Verify: ...

## Guardrails
- Read this file fully before running any install/command in it.
- No company code or data to external tools.
- Show the result, don't just claim success.
~~~~

### `skills/change-ticket-release/scripts/json-diff.js`

<!-- file: skills/change-ticket-release/scripts/json-diff.js -->
~~~~js
#!/usr/bin/env node
/*
 * Semantic JSON diff between two files: ignores key order and BOM, matches array items by
 * identity keys so one added item shows as one line. Read-only, no dependencies.
 *
 * Usage:
 *   node json-diff.js <source.json> <target.json> [--keys id,key,name,field] [--path a.b] [--limit 300]
 * Output: "+" only in source, "-" only in target, "~" changed (target -> source).
 * Exit code: 0 identical, 1 different, 2 usage/parse error.
 */
"use strict";

const fs = require("fs");

const argv = process.argv.slice(2);
function opt(name, def) {
  const i = argv.indexOf("--" + name);
  if (i === -1) return def;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
}
const KEYS = opt("keys", "id,key,name,field,headerName,label").split(",").filter(Boolean);
const SUBPATH = opt("path", "");
const LIMIT = Number(opt("limit", "300"));
const [srcFile, tgtFile] = argv;

if (!srcFile || !tgtFile) {
  console.error("Usage: json-diff.js <source.json> <target.json> [--keys id,key,name] [--path a.b] [--limit N]");
  process.exit(2);
}

function load(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    return SUBPATH ? SUBPATH.split(".").reduce((o, k) => (o == null ? o : o[k]), data) : data;
  } catch (e) {
    console.error("Cannot read " + file + ": " + e.message);
    process.exit(2);
  }
}

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

function idOf(x, i) {
  if (isObj(x)) for (const k of KEYS) if (x[k] !== undefined) return k + "=" + x[k];
  return "#" + i;
}

function keyed(arr) {
  const m = new Map();
  const seen = new Map();
  arr.forEach((x, i) => {
    let k = idOf(x, i);
    const n = (seen.get(k) || 0) + 1;
    seen.set(k, n);
    if (n > 1) k += "~" + n;
    m.set(k, x);
  });
  return m;
}

const brief = (x) => {
  const s = JSON.stringify(x);
  return s === undefined ? "undefined" : s.length > 160 ? s.slice(0, 157) + "..." : s;
};

function diff(src, tgt, p, out) {
  if (Array.isArray(src) && Array.isArray(tgt)) {
    const ms = keyed(src);
    const mt = keyed(tgt);
    for (const [k, v] of ms) if (!mt.has(k)) out.add.push(p + "[" + k + "]  " + brief(v));
    for (const [k, v] of mt) if (!ms.has(k)) out.del.push(p + "[" + k + "]  " + brief(v));
    for (const [k, v] of ms) if (mt.has(k)) diff(v, mt.get(k), p + "[" + k + "]", out);
    return;
  }
  if (isObj(src) && isObj(tgt)) {
    for (const k of Object.keys(src)) {
      if (!(k in tgt)) out.add.push(p + "." + k + "  " + brief(src[k]));
      else diff(src[k], tgt[k], p + "." + k, out);
    }
    for (const k of Object.keys(tgt)) if (!(k in src)) out.del.push(p + "." + k + "  " + brief(tgt[k]));
    return;
  }
  if (JSON.stringify(src) !== JSON.stringify(tgt)) out.chg.push(p + "  " + brief(tgt) + " -> " + brief(src));
}

const out = { add: [], del: [], chg: [] };
diff(load(srcFile), load(tgtFile), "$", out);

const print = (label, sign, list) => {
  console.log(label + " (" + list.length + ")");
  list.slice(0, LIMIT).forEach((l) => console.log("  " + sign + " " + l));
  if (list.length > LIMIT) console.log("  ... " + (list.length - LIMIT) + " more (use --limit)");
};
print("Only in source", "+", out.add);
print("Only in target", "-", out.del);
print("Changed", "~", out.chg);

process.exit(out.add.length + out.del.length + out.chg.length ? 1 : 0);
~~~~

### `skills/change-ticket-release/SKILL.md`

<!-- file: skills/change-ticket-release/SKILL.md -->
~~~~markdown
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
~~~~

### `skills/ponytail/SKILL.md`

<!-- file: skills/ponytail/SKILL.md -->
~~~~markdown
---
name: ponytail
description: >
  Lazy senior dev mode: the smallest change that fully solves the task, and a
  reply a busy human understands in one read. Use on any coding task (writing,
  fixing, refactoring, reviewing, choosing dependencies) and when the user says
  "ponytail", "be lazy", "simplest solution", "yagni", or complains about
  over-engineering or bloat. Levels: lite, full (default), ultra.
argument-hint: "[lite|full|ultra|off]"
license: MIT
---

> Source: https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md
> Retrieved 2026-11-03. MIT License — © Dietrich Gebert and contributors.
> Imported into agent-playbook as-is; local rules in this repo's AGENTS.md still win on any conflict.

# Ponytail

You are a lazy senior developer. The best code is the code never written. You solve the whole problem with the least new code. End your reply with one or two lines: what you skipped or did not check, and any risk the user must know.

Active for the whole session until the user says "stop ponytail" or "normal mode". Switch level: `/ponytail lite|full|ultra`.

## Before you write

Read the task and the code it touches. List every place your change must reach: callers, tests, fixtures, config, exports. Check what your change could break for users: data it would destroy or expose, callers that stop working. That is scope. Extra features are not.

## The smallest complete change

Take the first option that fully works:

1. Does it need to exist? Skip features, options and flexibility nobody asked for, and name them in one line. A vague request ("build me X") gets the smallest version that does the core job.
2. Already in this codebase (a helper, component, service, pattern)? Use it the way the surrounding code does.
3. Standard library or a platform feature? Use it, unless the project has its own. A house component beats a native widget.
4. An installed dependency? Use it. Never add a dependency for a few lines.
5. Can it be one line a reader gets at a glance? One line.
6. Otherwise: the minimum code that works.

- Be lazy about the solution, never about the change itself: finish every part the task needs, including the callers, tests and fixtures your change breaks.
- No abstraction, wrapper, type conversion, option, config, boilerplate or "for later" code nobody asked for. Keep values in the form the platform already gives you. Deletion beats addition. Keep the structure the codebase already has: its layers, interfaces and conventions.
- The shortest working diff wins, once you know everything it must touch. A one-liner that needs decoding is not short.
- Comment only the why the code cannot show, in one line.
- Bug fix: before you edit, grep every caller of the function you touch, then fix the root cause once in the shared code.
- Code you move or merge keeps its error handling and validation.
- Between options of equal size, take the one that is correct on edge cases.
- Lazy code without its check is unfinished: new non-trivial logic (a branch, a loop, a parser, money or security, or a whole new script or app) leaves one small test or an assert-based self-check. Trivial changes need none.
- A shortcut with a known limit gets a code comment in this form: `shortcut: <the limit>, <when to upgrade>`.

Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, the calibration real hardware needs, anything the user asked for.

## Levels

| Level | Behavior |
|-------|----------|
| **lite** | Build what was asked. Name the smaller option in one line and let the user pick. |
| **full** | The rules above. Default. |
| **ultra** | Also question the request: before building, push back on any part the need does not justify. |
~~~~

### `skills/README.md`

<!-- file: skills/README.md -->
~~~~markdown
# Skills

One folder per skill, each with a `SKILL.md` (see `_template/`).

Rules for adding a skill here:
1. Read its full SKILL.md/source before adding — no blind installs.
2. Note where it came from (repo URL + date) at the top of the skill.
3. Keep it office-safe: a prompt/copy-paste version first, install second.
4. Remove skills you no longer use — a short playbook gets followed.
~~~~

### `skills/split-commit-pr/scripts/pr-draft.js`

<!-- file: skills/split-commit-pr/scripts/pr-draft.js -->
~~~~js
#!/usr/bin/env node
/*
 * Build a PR title + body from ALL commits on the current branch.
 * Self-contained (no dependencies), works on macOS, Linux and Windows.
 * Usage (from the repo root):
 *   node pr-draft.js --title "<title>" --summary "<1-3 lines>"
 *        [--refs "<tickets>"] [--extra-file notes.md] [--footer "<line>"] [--base main] [--remote origin]
 * Ticket: --refs takes precedence; otherwise the ticket is extracted
 * from the current branch name (e.g. ABC-123). If neither has one,
 * the body notes that a ticket is required and must be asked for;
 * a ticket is never invented.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
function git(args, optional) {
  const r = spawnSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (r.error || r.status !== 0) {
    if (optional) return "";
    console.error("git " + args.join(" ") + " failed: " + (r.stderr || r.error));
    process.exit(1);
  }
  return r.stdout.trim();
}
function defaultBranch(remote) {
  const head = git(["symbolic-ref", "--short", "refs/remotes/" + remote + "/HEAD"], true);
  return head ? head.replace(remote + "/", "") : "main";
}
function remoteInfo(remote) {
  const url = git(["remote", "get-url", remote], true);
  const m = url.match(/^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?([^/:]+)[:/](?:\d+\/)?(.+?)(?:\.git)?\/?$/i);
  return m ? { host: m[1], slug: m[2], web: "https://" + m[1] + "/" + m[2] } : null;
}
const remote = arg("remote", "origin");
const base = arg("base", defaultBranch(remote));
const title = arg("title", "");
const summary = arg("summary", "");
const refs = arg("refs", "");
const extraFile = arg("extra-file", "");
const footer = arg("footer", "");
if (!title || !summary) {
  console.error('Required: --title "<title>" --summary "<summary of the WHOLE branch>"');
  process.exit(1);
}
const branch = git(["branch", "--show-current"]);
const ticketFromRefs = (refs.match(/[A-Z0-9]+-[0-9]+/) || [])[0] || "";
const ticketFromBranch = (branch.match(/[A-Z0-9]+-[0-9]+/) || [])[0] || "";
const ticket = ticketFromRefs || ticketFromBranch;






















































const baseRef = remote + "/" + base;
const commits = git(["log", "--reverse", "--format=%h%x09%s", baseRef + "..HEAD"])
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [sha, subject] = line.split("\t");
    const files = git(["show", "--name-only", "--format=", sha]).split("\n").filter(Boolean);
    return { sha, subject, files };
  });
if (!commits.length) {
  console.error("No commits on " + branch + " ahead of " + baseRef + " (run git fetch?)");
  process.exit(1);
}
const stat = git(["diff", "--shortstat", baseRef + "...HEAD"]);
const fileCount = git(["diff", "--name-only", baseRef + "...HEAD"]).split("\n").filter(Boolean).length;
const short = (f) => (f.length > 70 ? "…" + f.slice(-69) : f);
const cell = (s) => s.replace(/\|/g, "\\|");
const summaryLine = ticket ? "Jira: " + ticket : "Jira ticket required — ask the user for the ticket before committing; none was given and none was found in the branch name.";
const lines = ["## Summary", summaryLine, summary, "", "## Commits", "| Commit | Change | Files |", "|---|---|---|" , ""];
for (const c of commits) {
  lines.push(
    "| `" + c.sha + "` | " + cell(c.subject) + " | " + c.files.map((f) => "`" + cell(short(f)) + "`").join("<br>") + " |"
  );
}
lines.push("", "**Files changed (" + fileCount + "):** " + stat, "");
if (extraFile) lines.push(fs.readFileSync(extraFile, "utf8").trim(), "");
lines.push("## References", refs || ticket || "_None_", "");
if (footer) lines.push(footer);
const body = lines.join("\n").trim() + "\n";
const out = path.join(os.tmpdir(), "pr-" + branch.replace(/[^\w.-]+/g, "_") + ".md");
fs.writeFileSync(out, body);
const q = (s) => '"' + s.replace(/"/g, '\\"') + '"';
const info = remoteInfo(remote);
console.log("TITLE: " + title);
console.log("BODY FILE: " + out + "  (" + commits.length + " commits, " + fileCount + " files)");
if (!ticket) {
  console.log("\nWARNING: No Jira ticket found — ask the user for the ticket before committing; none was invented.");
}
if (info) {
  const ghBase = "gh pr %s --repo " + info.host + "/" + info.slug;
  console.log("\n# gh (authenticated):");
  console.log("  new PR:      " + ghBase.replace("%s", "create") + " --base " + base + " --head " + q(branch) + " --title " + q(title) + " --body-file " + q(out));
  console.log("  existing PR: " + ghBase.replace("%s", "edit") + " " + q(branch) + " --title " + q(title) + " --body-file " + q(out));
  const compare = info.web + "/compare/" + base + "..." + encodeURIComponent(branch) + "?expand=1&title=" + encodeURIComponent(title);
  const full = compare + "&body=" + encodeURIComponent(body);
  console.log("\n# Browser (title and body prefilled):");
  if (full.length > 7500) {
    console.log("  Body too long for a URL; title-only link below, paste the body from " + out);
    console.log("  " + compare);
  } else {
    console.log("  " + full);
  }
} else {
  console.log("\nNo parsable '" + remote + "' remote; paste the body from " + out);
}























































~~~~

### `skills/split-commit-pr/SKILL.md`

<!-- file: skills/split-commit-pr/SKILL.md -->
~~~~markdown
---
name: split-commit-pr
description: Sync with the default branch, create a feature branch, split the work into multiple logical commits, push without ever force-pushing, and open ONE pull request whose title and description summarise the whole branch. Use for "create a branch", "commit and open a PR", "split this into multiple commits", "write the PR description", "update the PR description".
---

# Split commits → one PR

## Standing rules

1. **Never force-push.** No `--force`, `-f`, `--force-with-lease` or `+refspec`, on any branch.
2. **Never rewrite pushed history.** No amend, rebase, reset + re-push or squash on a pushed branch. Fix forward with a new commit.
3. **Multiple commits, one PR.** Split the work into logical commits and open a single PR. One commit per logical step — never one giant commit, never one PR per commit unless the user explicitly asks for separate PRs.
4. **PR body is the whole branch.** Title + description cover the whole branch, not just the latest commit.
5. **Ask before committing.** Do not commit without asking the user first — even if the branch is ready.
6. The diff must follow AGENTS.md. Keep it small, typed, tested and understandable.

## 0. Jira ticket first

Jira ticket first. If you didn't give one and the branch name doesn't have one, the agent asks before committing. The ticket goes in the PR description next to the change Summary.

- Before any commit, look for a Jira ticket (a key like ABC-123) in this order: first, what the user gave in the task/conversation; then the current branch name.
- If neither has one, ask the user for the ticket before committing — do not commit without one and do not invent one.
- When the PR is created, put the ticket in the PR description next to the Summary of changes (see §4).

## 1. Sync and branch

1. `git switch main` (or the default branch for this repo) and run `git pull --ff-only`.
2. Create the branch from the synced main with a ticket-led, lowercase slug, for example `feature/JIRA-123-add-login` (use the actual ticket key).
3. If the user gave a different name, use that name exactly.
4. Run `git status` to confirm the tree is clean.















## 2. Work and check

1. Implement the change with small, reviewable diffs.
2. Run the relevant tests/builds. If any fail, fix before continuing.
3. Show what changed, what was verified, and what is still open — be honest about failures.

## 3. Split commits

1. Ask the user: "I want to split this work into these commits. Is that right?"
2. Show the proposed commit list before committing.
3. If the user agrees, commit in order, one logical step per commit, with a conventional message:
   - `feat: add login validation`
   - `fix: correct error message`
   - `docs: update login docs`
4. Each commit message should be short but complete.

## 4. PR body

Generate the PR body from the *whole branch* using `scripts/pr-draft.js`. The script uses only files inside the skill folder.

1. Make sure the branch is pushed: `git push -u origin <branch>` — never force-push.
2. Run `node scripts/pr-draft.js` from the repo root.
3. The body uses this structure:
   - Summary: 1–3 lines — why, scope, and what is intentionally out of scope, with the Jira ticket next to it (e.g. `Jira: ABC-123`).
   - Changes: a list of the commits in this branch and what each one does.
   - Testing: which tests/builds were run and the result.
   - Follow-up: anything left to do, and the next step for the reviewer.
4. Generate the body with `node scripts/pr-draft.js`, inspect it, then paste it into the PR description — do not paste anything the script did not generate. The script puts the Jira ticket next to the Summary; if it cannot find a ticket, it says a ticket is required instead of inventing one.
5. If the user gives you a PR title, use it. Otherwise, use the ticket key plus a short summary of the whole branch, e.g. `ABC-123 Add login validation`.

## 5. Open the PR

1. If `gh` is available, run the `gh` command exactly as `scripts/pr-draft.js` prints it, then check that the PR was created.
2. If `gh` is not available, print the exact PR creation URL the script prints and the full PR title and body, so the user can paste them.
3. Do not edit the PR body by hand unless the user asks for a change. If they do, make the change, then regenerate the body with the script.
4. Never open a PR per commit unless the user explicitly asks for separate PRs.




















~~~~

### `skills/ponytail-audit/SKILL.md`

<!-- file: skills/ponytail-audit/SKILL.md -->
~~~~markdown
---
name: ponytail-audit
description: >
  Quality audit of a whole repo: bugs, security holes, what breaks under real
  load, risky code without tests, slow paths, and what to delete, merge or
  split. Ranked, each finding explained in plain English. One-shot report,
  changes nothing. Use for "audit this codebase", "review the whole repo",
  "find bloat", "what can I delete", /ponytail-audit.
---

> Imported from https://github.com/DietrichGebert/ponytail (skills/ponytail-audit/SKILL.md), MIT © Dietrich Gebert. Retrieved 2026-11-03. Local AGENTS.md rules win on any conflict.

Audit the whole repo like the senior developer who just inherited it and will be paged when it breaks. Order of importance: correct, safe, holds under load, tested, fast, lean. Lean still matters: every extra line must be read, tested and fixed later. This is a report the user asked for, so give it in full.

## 1. Map first

- Audit what the user names: a folder, a package, or the whole repo. Nothing named: the whole repo.
- Read the README, the deploy and build config, the dependency list, the entry points (main, routes, handlers, jobs, CLI commands) and the tests.
- Find the expected load: one person running a script, or many users and processes at once. Judge scale against that, and say which load you assumed.
- Trace the main flows end to end: where data comes in, what is stored, what goes out. Read those paths fully: input from users, money, auth, data writes, background jobs, anything shared between processes.
- Big repo: go deep where a mistake costs the most, not file by file. Say which parts you did not read.

## 2. Look for

1. **Bug:** wrong result, crash, missed edge case (empty, zero, last item, rounding, time zones), callers that disagree with what a function returns, the same rule applied differently in two places.
2. **Risk:** security holes (injection, weak randomness, secrets in code, missing checks on input from users), data loss (errors swallowed, writes in the wrong order, no transaction).
3. **Scale:** fine for one user, wrong for many: check-then-write races, the same work done by every process, memory or lists that only grow, a query per item, O(n^2) on big input, per-process state that must be shared.
4. **Missing test:** risky logic (a branch, a parser, money, security, data writes) with no test that fails when it breaks. One good test, not coverage.
5. **Speed:** big slowdowns are problems. Small wins (work repeated in a hot loop) are suggestions; some software counts every millisecond.
6. **Lean:** code that should not exist or should be smaller.
   - delete: dead code, unused options, flags and config, speculative features
   - reuse: two helpers doing the same thing (keep one, name the path)
   - stdlib / native: the standard library or platform already does it; a dependency doing what a few lines or the platform can do
   - yagni: interface with one implementation, factory with one product, wrapper that only passes calls through
   - merge: near-copies that must change together
   - split: one function or class doing several unrelated jobs, so it is hard to read or test. Split by job, never by line count, and never into helpers that exist only to make a function shorter.

## 3. Check before you report

- Every finding needs a concrete case: "this input or situation leads to this wrong result". No case, no finding.
- Before calling code unused, grep the whole tree for it, including tests, fixtures, config, and string or dynamic references.
- A shortcut marked with a `shortcut:` (or older `ponytail:`) comment that names its limit is a decision, not a finding, unless the expected load already crosses it.
- Propose the smallest fix that works. Prefer fixes that delete code. Never add layers, frameworks or config the problem does not need.
- No style taste, no "consider", no vague worries.

## 4. Output

Very simple English: short sentences, everyday words. Explain a technical term the first time you use it. The reader may never have seen this code.

Start with `What this repo does:` in two or three sentences, and the load you assumed.

Then the findings in three groups, most important first, skip empty groups:

- **Must fix:** bug, security, data loss, breaks at the expected load.
- **Should fix:** risky code without a test, real slowness, duplication, a function that mixes jobs, code that should not exist.
- **Nice to have:** small speed-ups, shorter forms.

Number findings across all groups, so the user can say "fix 2 and 5". At most 20 findings; if you left smaller ones out, say how many.

Every finding has all four parts, each one or two short sentences:

2. **Orders land on the wrong day** (`billing/close_day.py:L40-52`)
   - **What this is:** At midnight this job closes the day and bills all orders of that day.
   - **Problem:** It takes "today" from the server clock, which runs in UTC. An order placed at 00:30 in Berlin is billed on the day before.
   - **Fix:** Compute the day once in the shop's time zone: `datetime.now(ZoneInfo("Europe/Berlin")).date()`. One line, nothing else changes.
   - **If we skip it:** Late orders show the wrong date, and accounting fixes them by hand.

End with:

- `Verdict:` one line: healthy, or what to fix first.
- `Lean: -<N> lines, -<M> dependencies possible.` when lean findings exist.
- `Not checked:` the parts you did not read or could not run.

Nothing found: `What this repo does:`, then `Healthy. Nothing to fix.` and one line on what you checked.

One-shot report, changes no code.
~~~~

### `skills/ponytail-debt/SKILL.md`

<!-- file: skills/ponytail-debt/SKILL.md -->
~~~~markdown
---
name: ponytail-debt
description: >
  List every `shortcut:` comment (and older `ponytail:` ones) as a debt ledger. One-shot report,
  changes nothing. Use for "ponytail debt", "what did ponytail defer", "list the
  shortcuts", /ponytail-debt.
---

> Imported from https://github.com/DietrichGebert/ponytail (skills/ponytail-debt/SKILL.md), MIT © Dietrich Gebert. Retrieved 2026-11-03. Local AGENTS.md rules win on any conflict.

Every deliberate ponytail shortcut is marked with a `shortcut:` comment naming its ceiling and upgrade path (older code may say `ponytail:`). This collects them into one ledger so a deferral can't quietly become permanent.

## Scan

Grep the repo for comment markers, skipping `.git` and everything the `.gitignore` files ignore (dependencies, build output, caches, in any stack):

`git grep --no-index --exclude-standard -nE '(#|//|/[*]) ?(shortcut|ponytail):'`  (add other comment prefixes if your stack uses them)

If the user names their own marker word (`/ponytail-debt TODO`), grep for that word instead.

Each hit is one ledger row. The comment prefix keeps prose that merely mentions the convention out of the ledger. Skip hits that are not a deferral, like a note about a keyboard shortcut.

## Output

One row per marker, grouped by file:

`<file>:<line>, <what was simplified>. ceiling: <the limit named>. upgrade: <the trigger to revisit>.`

The convention is `shortcut: <ceiling>, <upgrade path>`, so pull the ceiling and the trigger straight from the comment. Want an owner per row too? add `git blame -L<line>,<line>`.

Flag the rot risk: any marker comment that names no upgrade path or trigger gets a `no-trigger` tag, those are the ones that silently rot.

End with `<N> markers, <M> with no trigger.` Nothing found: `No shortcut debt. Clean ledger.`

## Boundaries

Reads and reports only, changes nothing. To persist it, ask and it writes the ledger to a file (e.g. `PONYTAIL-DEBT.md`). One-shot.
~~~~

### `skills/ponytail-gain/SKILL.md`

<!-- file: skills/ponytail-gain/SKILL.md -->
~~~~markdown
---
name: ponytail-gain
description: >
  Show ponytail's measured savings (code, cost, speed) from the benchmark.
  One-shot display. Use for /ponytail-gain, "what does ponytail save",
  "ponytail impact".
---

> Imported from https://github.com/DietrichGebert/ponytail (skills/ponytail-gain/SKILL.md), MIT © Dietrich Gebert. Retrieved 2026-11-03. The figures below are the upstream author's published benchmark claims, not independently verified. Local AGENTS.md rules win on any conflict.

# Ponytail Gain

Display this scoreboard when invoked. One-shot: do NOT change mode, write flag files, or persist anything.

The figures are the published agentic benchmark of Ponytail 5: headless Claude Code (Opus 5.5, default effort) on 39 tasks (feature tickets in a real FastAPI + React repo, bug fixes, security and privacy cases, small apps), 5 runs each, against the same agent without the skill. 18 of the tasks have hidden checks for correctness and safety. Each figure is the geometric mean of the per-task medians. They are measured, not computed from the current repo.

Source: `benchmarks/results/2026-10-07-agentic.md` and the README.

## Scoreboard

Render plain ASCII bars. The bar length shows ponytail as a share of the no-skill baseline; the label carries the exact figure:

```
  ponytail gain           benchmark · 39 tasks × 5 runs · Opus 5.5

  no-skill        ████████████████████  100%
  Lines of code   █████████···········   47%   ▼ 53%
  Output tokens   ███████████·········   55%   ▼ 45%
  Cost            ███████████████·····   74%   ▼ 26%
  Time            ████████████········   59%   ▼ 41%

  Hidden checks passed   97%  (no-skill 96%)
  Tests where the logic needs one   98%  (no-skill 68%)

  This repo:  /ponytail-debt  (shortcuts you deferred)
              /ponytail-audit (what's still cuttable)
```

## Honesty boundary

These are benchmark averages, not this repo. NEVER print a per-repo savings number ("you saved X lines/tokens here"): the unbuilt version was never written, so there is no real baseline to subtract from in a live repo. The only real per-repo figures come from `/ponytail-debt` (a counted ledger), and this card points there instead of inventing one.

## Boundaries

One-shot display. Edits nothing, changes no mode.
~~~~

### `skills/ponytail-help/SKILL.md`

<!-- file: skills/ponytail-help/SKILL.md -->
~~~~markdown
---
name: ponytail-help
description: >
  Quick reference for ponytail levels, skills and commands. One-shot display.
  Use for /ponytail-help, "ponytail help", "how do I use ponytail".
---

> Imported from https://github.com/DietrichGebert/ponytail (skills/ponytail-help/SKILL.md), MIT © Dietrich Gebert. Retrieved 2026-11-03. Local AGENTS.md rules win on any conflict.

# Ponytail Help

Display this reference card when invoked. One-shot, do NOT change mode, write flag files, or persist anything.

## Levels

| Level | Trigger | What change |
|-------|---------|-------------|
| **Lite** | `/ponytail lite` | Build what was asked, name the smaller option in one line. |
| **Full** | `/ponytail` | The smallest complete change, a check where the logic needs one, and a reply that names what was skipped and any risk. Default. |
| **Ultra** | `/ponytail ultra` | Also questions the request and pushes back before building. |

Level sticks until changed or session end.

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **ponytail** | `/ponytail` | Lazy mode itself: least new code, clear replies that name skipped work and risks. |
| **ponytail-review** | `/ponytail-review` | Quality review of a diff: bugs, security, load, missing tests, speed, what to cut. Each finding says what goes wrong and how to fix it. |
| **ponytail-audit** | `/ponytail-audit` | The same quality review for the whole repo, ranked. |
| **ponytail-debt** | `/ponytail-debt` | Harvest `shortcut:` comments into a tracked ledger. |
| **ponytail-gain** | `/ponytail-gain` | Measured-impact scoreboard: less code, less cost, more speed. |
| **ponytail-help** | `/ponytail-help` | This card. |

In Codex CLI and the IDE extension, invoke skills with `$ponytail:ponytail`, `$ponytail:ponytail-review`, or `$ponytail:ponytail-help`. Claude Code and OpenCode use the slash-command forms above (OpenCode ships all six as slash commands).

## Deactivate

Say "stop ponytail" or "normal mode". Resume anytime with `/ponytail`. `/ponytail off` also works.

## Band (Claude Code)

`/ponytail band` hides the band above the prompt, the same command brings it back. `/ponytail band on` and `/ponytail band off` set it directly. The level stays. `/ponytail band import` adds your past Claude Code sessions (cost, agent time, tokens) to the board.

Note: the band itself is part of the upstream plugin and is NOT installed by this playbook; only the skills are imported.

## Configure Default Mode

Default mode = `full`, auto-active every session. Change it:

**Environment variable** (highest priority):

```bash
export PONYTAIL_DEFAULT_MODE=ultra
```

**Config file** (`~/.config/ponytail/config.json`, Windows: `%APPDATA%\ponytail\config.json`):

```json
{ "defaultMode": "lite" }
```

Set `"off"` to disable auto-activation on session start, activate manually with `/ponytail` when wanted.

Resolution: env var > config file > `full`.

## Update

Enable auto-update once: open `/plugin`, go to Marketplaces, pick ponytail, Enable auto-update. Claude Code then pulls new versions at startup (run `/reload-plugins` when it prompts). Manual refresh: `/plugin marketplace update ponytail` then `/reload-plugins`.

If `/plugin` is not recognized, your Claude Code is out of date. Update it (`npm install -g @anthropic-ai/claude-code@latest`, or `brew upgrade claude-code`) and restart. Other hosts use their own update flow.

Note: the plugin update flow above applies to upstream plugin installs; in this playbook the skills are plain files, updated by re-importing from the source repo.

## More

Full docs + examples: https://github.com/DietrichGebert/ponytail
~~~~

### `skills/ponytail-review/SKILL.md`

<!-- file: skills/ponytail-review/SKILL.md -->
~~~~markdown
---
name: ponytail-review
description: >
  Quality review of a change: is the logic right, is it safe, does it hold
  under real load, is risky code tested, is it fast enough, and is every line
  needed. Reads the connected code, not only the diff. Each finding is
  explained in plain English. Use for "review this", "code review", "review
  the last commit", "review my PR", "is this over-engineered", /ponytail-review.
---

> Imported from https://github.com/DietrichGebert/ponytail (skills/ponytail-review/SKILL.md), MIT © Dietrich Gebert. Retrieved 2026-11-03. Local AGENTS.md rules win on any conflict.

Review a change like the senior developer who will be paged when it breaks.

Order of importance: correct, safe, holds under load, tested, fast, lean.

Lean still matters: every extra line must be read, tested and fixed later.

This is a report the user asked for, so give it in full.

## 1. Understand first

- Review what the user names: uncommitted or staged changes, a branch, a PR link, or files. Nothing named: the uncommitted changes, or the last commit if there are none.
- Read the diff, then the code it touches: callers of every changed function, the functions it calls, the tests, the README.
- Trace the real flow: where data comes in, what is stored, what goes out.
- A change can break code it does not touch. When a signature, return value or behavior changes, grep every caller.
- Find the expected load in the repo (README, deploy config): one person running a script, or many users and processes at once. Judge scale against that, and say which load you assumed.

## 2. Look for

1. **Bug:** wrong result, crash, missed edge case (empty, zero, last item, rounding, time zones), a caller broken by the change, a fix applied in one caller while the shared function stays broken.
2. **Risk:** security holes (injection, weak randomness, secrets, missing checks on input from users), data loss (errors swallowed, writes in the wrong order, no transaction).
3. **Scale:** fine for one user, wrong for many: check-then-write races, the same work done by every process, memory or lists that only grow, a query per item, O(n^2) on big input, per-process state that must be shared.
4. **Missing test:** risky new logic (a branch, a parser, money, security, data writes, a bug fix) with no test that fails when it breaks. One good test, not coverage.
5. **Speed:** big slowdowns are problems. Small wins (work repeated in a hot loop) are suggestions; some software counts every millisecond.
6. **Lean:** code that should not exist or should be smaller.
   - delete: dead code, unused options, speculative features
   - reuse: the repo already has this helper (name the path)
   - stdlib / native: the standard library or platform already does it; a new dependency for a few lines
   - yagni: abstraction with one implementation, config nobody sets
   - merge: near-copies that must change together
   - split: one function doing several unrelated jobs, so it is hard to read or test. Split by job, never by line count, and never into helpers that exist only to make a function shorter.

## 3. Check before you report

- Every finding needs a concrete case: "this input or situation leads to this wrong result". No case, no finding.
- Re-read the lines and confirm: the caller exists, the value can really be empty, the code really is unused.
- A shortcut marked with a `shortcut:` (or older `ponytail:`) comment that names its limit is a decision, not a finding, unless the expected load already crosses it.
- Propose the smallest fix that works. Prefer fixes that delete code. Never add layers, frameworks or config the problem does not need.
- No style taste, no "consider", no vague worries.

## 4. Output

Very simple English: short sentences, everyday words. Explain a technical term the first time you use it. The reader may never have seen this code.

Start with `What this change does:` in two or three sentences.

Then the findings in three groups, skip empty groups:

- **Must fix:** bug, security, data loss, breaks at the expected load.
- **Should fix:** risky code without a test, real slowness, duplication, a function that mixes jobs, code that should not exist.
- **Nice to have:** small speed-ups, shorter forms.

Number findings across all groups, so the user can say "fix 2 and 5".

Every finding has all four parts, each one or two short sentences:

2. **Orders land on the wrong day** (`billing/close_day.py:L40-52`)
   - **What this is:** At midnight this job closes the day and bills all orders of that day.
   - **Problem:** It takes "today" from the server clock, which runs in UTC. An order placed at 00:30 in Berlin is billed on the day before.
   - **Fix:** Compute the day once in the shop's time zone: `datetime.now(ZoneInfo("Europe/Berlin")).date()`. One line, nothing else changes.
   - **If we skip it:** Late orders show the wrong date, and accounting fixes them by hand.

End with:

- `Verdict: Ship.` or `Verdict: fix 1 and 3 first.`
- `Lean: -<N> lines possible.` when lean findings exist.
- `Not checked:` one line, if something mattered and you could not check it.

Nothing found: `What this change does:`, then `Looks good. Ship.` and one line on what you checked.

Lists findings, changes no code.
~~~~

### `.agents/plugins/marketplace.json`

<!-- file: .agents/plugins/marketplace.json -->
~~~~json
{"interface":{"displayName":"Agent Playbook"},"name":"agent-playbook","plugins":[{"category":"Productivity","name":"agent-playbook","policy":{"authentication":"ON_INSTALL","installation":"AVAILABLE"},"source":{"ref":"main","source":"url","url":"https://github.com/kxg50820/agent-playbook.git"}}]}
~~~~

### `.claude-plugin/marketplace.json`

<!-- file: .claude-plugin/marketplace.json -->
~~~~json
{"$schema":"https://anthropic.com/claude-code/marketplace.schema.json","description":"A portable AI coding workflow: rules, skills and git guardrails that follow you across tools, teams and companies.","name":"agent-playbook","owner":{"name":"Kruthik Gandrathi","url":"https://github.com/kxg50820"},"plugins":[{"category":"productivity","description":"Standing agent rules, nine skills (commits and PRs, diff and repo reviews, debt ledger, releases, Ponytail) and safety guard hooks, installed as one plugin.","name":"agent-playbook","source":"./"}]}
~~~~

### `.claude-plugin/plugin.json`

<!-- file: .claude-plugin/plugin.json -->
~~~~json
{"author":{"name":"Kruthik Gandrathi","url":"https://github.com/kxg50820"},"description":"Portable AI coding workflow: standing agent rules, a library of skills for commits, PRs, reviews, audits, debt and releases, plus git safety guard hooks.","homepage":"https://github.com/kxg50820/agent-playbook","hooks":["./hooks/plugin-hooks.json"],"keywords":["skills","code-review","git-hooks","workflow","agents"],"name":"agent-playbook","repository":"https://github.com/kxg50820/agent-playbook","version":"1.0.0"}
~~~~

### `.codex-plugin/plugin.json`

<!-- file: .codex-plugin/plugin.json -->
~~~~json
{"author":{"name":"Kruthik Gandrathi","url":"https://github.com/kxg50820"},"description":"Portable AI coding workflow: standing agent rules, a library of skills for commits, PRs, reviews, audits, debt and releases, plus git safety guard hooks.","homepage":"https://github.com/kxg50820/agent-playbook","hooks":"./hooks/plugin-hooks.json","interface":{"brandColor":"#111111","capabilities":["Instructions","Lifecycle hooks"],"category":"Productivity","defaultPrompt":["Use the agent-playbook rules for this task.","Review this diff with ponytail-review.","Split this branch into clean commits and draft the PR."],"developerName":"Kruthik Gandrathi","displayName":"Agent Playbook","longDescription":"Standing AGENTS.md rules, nine skills for everyday engineering work (smallest-change coding, diff and repo reviews, debt tracking, clean commits and PRs, change tickets and releases), and guard hooks that block force-pushes and secret leaks.","shortDescription":"Portable AI coding workflow: rules, skills, guardrails","websiteURL":"https://github.com/kxg50820/agent-playbook"},"keywords":["skills","code-review","git-hooks","workflow","agents"],"name":"agent-playbook","repository":"https://github.com/kxg50820/agent-playbook","skills":"./skills/","version":"1.0.0"}
~~~~

### `hooks/plugin-hooks.json`

<!-- file: hooks/plugin-hooks.json -->
~~~~json
{"hooks":{"PreToolUse":[{"hooks":[{"command":"node \"${CLAUDE_PLUGIN_ROOT}/agent-hooks/guard.js\"","statusMessage":"Checking agent-playbook guardrails...","timeout":15,"type":"command"}],"matcher":"Bash|PowerShell"}]}}
~~~~

### `skills/agent-playbook/SKILL.md`

<!-- file: skills/agent-playbook/SKILL.md -->
~~~~markdown
---
name: agent-playbook
description: The standing rules and skill routing for Kruthik Gandrathi's agent-playbook. Use at the start of any coding task in a project that has adopted this playbook: it sets how the agent should work (understand first, smallest complete change, surgical edits, verify before claiming done, git safety, Jira ticket first) and which bundled skill to reach for (ponytail for coding, ponytail-review for diffs, ponytail-audit for whole repos, ponytail-debt for shortcuts, split-commit-pr for commits and PRs, change-ticket-release for releases). Also usable on its own, without the rest of the plugin: the rules and compact checklists below are self-contained.
---

# agent-playbook — the umbrella skill

This is the front door to the playbook. It carries the standing rules every task follows, and it routes bigger jobs to the specialised skills bundled with it. If those skills are not installed, the compact fallbacks in this file still apply — follow them inline instead of skipping the step.

## Standing rules

### How to work
1. **Understand before editing.** Read the code the change touches and trace the real flow. State your assumptions; when two readings of the request are possible, name them instead of silently picking one.
2. **Smallest complete change.** Prefer what already exists in the codebase, then the standard library / platform, then an installed dependency, then the minimum new code that fully solves the problem. No abstractions, options, or scaffolding nobody asked for.
3. **Surgical edits.** Touch only what the task requires. Match the file's existing style. Mention unrelated problems you notice; do not fix them unasked, and do not clean up your own mess in files you didn't need to touch.
4. **Verify, then say so.** Run the project's tests / lint / build after a change. If a check fails, report it plainly — never claim success over a red result, and never hide a step you skipped.

### Git safety
- Never force-push. Never rewrite history or amend a pushed commit.
- Never push directly to a protected branch (`main` / `master` unless the project says otherwise).
- Never commit `.env`, `.pem`, `.key` files, private keys, tokens or passwords — and stop if you see one staged.
- Destructive commands (`rm -rf`, `git reset --hard`, `git clean -fd`) need explicit approval first.
- **Jira ticket first.** Before committing, find the ticket: first in what the user gave you, then in the branch name (e.g. `ABC-123`). If neither has one, **ask before committing** — never invent a ticket. When there is one, it goes in the PR description next to the Summary.

### Stack defaults
Unless the project overrides them: Java services, TypeScript / React front ends, Python for scripting and data work, AWS for cloud. Prefer the project's existing libraries and patterns over new ones.

## Route the job

| The job in front of you | Reach for |
|---|---|
| Writing or fixing code | `ponytail` (smallest complete change; lite / full / ultra) |
| Reviewing a change before a PR | `ponytail-review` |
| Reviewing a whole repo or module | `ponytail-audit` |
| Collecting deferred shortcuts | `ponytail-debt` |
| Showing the Ponytail benchmark | `ponytail-gain` |
| You forgot a command or level | `ponytail-help` |
| Committing and opening the PR | `split-commit-pr` |
| Change ticket or release notes | `change-ticket-release` |

## If the routed skill is not installed

Apply these compact versions inline:

- **Review (diff):** read the diff and the code it touches. Group findings as must fix / should fix / nice to have, numbered, in plain English: what the code does, what goes wrong, the fix, and what happens if it's skipped. Check bugs and edge cases, security (injection, auth, secrets), real load, missing tests on risky paths, slow paths, and code that can simply be deleted. Report only — change nothing unless asked.
- **Commit + PR:** group the changes into small logical commits with clear messages. PR description: `## Summary` first, then `Jira: <ticket>` — and the Jira rule above applies before any commit happens. List the tests you ran in the description.
- **Release / change ticket:** summarise what changed, why, the risk, and the rollback. For JSON config, diff semantically (ignore key order and formatting) so the ticket shows real changes only.
- **Debt:** search for `shortcut:` comments and list each with its stated limit and upgrade trigger; flag any that have no trigger.

## Guardrails

When the playbook is installed as a plugin or via `install.js`, guard hooks back these rules up mechanically: force-pushes are blocked before they run, commits and pushes on protected branches ask first, and a pre-commit scan blocks secret files, token patterns and files over 5 MB. The hooks are a safety net, not a substitute for following the rules.
~~~~
