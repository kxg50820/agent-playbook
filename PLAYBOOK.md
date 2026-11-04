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

### Skills (`skills/`)
| Skill | Use when | Helper script |
|---|---|---|
| `split-commit-pr` | Create a branch, split work into logical commits, push (never force), open ONE PR whose title/body cover the whole branch; ask for the Jira ticket before committing if missing | `scripts/pr-draft.js` — builds the PR body from all commits, prints `gh` commands and a prefilled compare URL |
| `_template` | Starting point for a new skill (not installed) | — |
| `change-ticket-release` | Promote validated changes (e.g. stage → prod) under a change ticket: ask ticket first, branch named after it, parity table, copy only approved items | `scripts/json-diff.js` — semantic JSON diff (ignores key order/BOM, matches array items by id) |
| `ponytail` | Coding tasks where the smallest complete change is preferred | — |

### Hooks / guardrails
| Hook | Where it runs | What it does |
|---|---|---|
| `git-hooks/pre-push` → `guards/pre-push.js` | git itself (any tool or human), via global `core.hooksPath` | Blocks force-push, deleting protected branches, direct push to `main`/`master` (per-repo opt-in: `git config agentPlaybook.allowProtectedPush true`) |
| `git-hooks/<other hooks>` | git | No guard; just chain to the repo's own `.git/hooks/<name>` so husky etc. keep working |
| `hooks/pre-commit` (bash) | One repo, copied to `.git/hooks/pre-commit` | Blocks secret-looking files (.env, .pem, .key, id_rsa, credentials), token-shaped strings, and files > 5 MB |
| `agent-hooks/guard.js` | Agents with `PreToolUse` command hooks (see `adapters/`) | Denies force-push commands; asks before commit/push on a protected branch. Fails open |

## 2. Structure

37 files total, including `PLAYBOOK.md`.

```text
agent-playbook/
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
├── hooks/   # per-project bash git hooks
│   └── pre-commit
├── lib/   # shared helpers for hooks/installer
│   ├── config.js
│   └── git.js
├── skills/   # SKILL.md skills (open format)
│   ├── _template/   # starting point for new skills
│   │   └── SKILL.md
│   ├── change-ticket-release/
│   │   ├── scripts/
│   │   │   └── json-diff.js
│   │   └── SKILL.md
│   ├── ponytail/
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
