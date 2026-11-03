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
| Git | Never force-push or rewrite pushed history; multiple commits, one PR; ask before committing; never commit to main/master |
| Hygiene | No secrets, don't hand-edit generated files, don't suppress scanner findings, keep file formatting/encoding |

### Skills (`skills/`)
| Skill | Use when | Helper script |
|---|---|---|
| `split-commit-pr` | Create a branch, split work into logical commits, push (never force), open ONE PR whose title/body cover the whole branch | `scripts/pr-draft.js` — builds the PR body from all commits, prints `gh` commands and a prefilled compare URL |
| `change-ticket-release` | Promote validated changes (e.g. stage → prod) under a change ticket: ask ticket first, branch named after it, parity table, copy only approved items | `scripts/json-diff.js` — semantic JSON diff (ignores key order/BOM, matches array items by id) |

### Hooks / guardrails
| Hook | Where it runs | What it does |
|---|---|---|
| `git-hooks/pre-push` → `guards/pre-push.js` | git itself (any tool or human), via global `core.hooksPath` | Blocks force-push, deleting protected branches, direct push to `main`/`master` (per-repo opt-in: `git config agentPlaybook.allowProtectedPush true`) |
| `git-hooks/<other hooks>` | git | No guard; just chain to the repo's own `.git/hooks/<name>` so husky etc. keep working |
| `agent-hooks/guard.js` | Agents with `PreToolUse` command hooks (see `adapters/`) | Denies force-push commands; asks before commit/push on a protected branch. Fails open |

## 2. Structure

```text
agent-playbook/
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
│   ├── pre-push
│   ├── pre-rebase
│   ├── prepare-commit-msg
│   └── run-hook.js   # dispatcher: guard, then the repo's own .git/hooks/<name>
├── lib/   # shared helpers for hooks/installer
│   ├── config.js
│   └── git.js
├── skills/   # SKILL.md skills (open format)
│   ├── change-ticket-release/
│   │   ├── scripts/
│   │   │   └── json-diff.js
│   │   └── SKILL.md
│   └── split-commit-pr/
│       ├── scripts/
│       │   └── pr-draft.js
│       └── SKILL.md
├── .gitignore
├── AGENTS.md   # personal rules for every agent
├── config.example.json   # defaults (override in config.local.json, gitignored)
├── install.js   # links skills into detected tools, optional git hooks
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

### `.gitignore`

<!-- file: .gitignore -->
~~~~
config.local.json
node_modules/
.DS_Store
~~~~

### `AGENTS.md`

<!-- file: AGENTS.md -->
~~~~markdown
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
~~~~

### `README.md`

<!-- file: README.md -->
~~~~markdown
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

<!-- file: git-hooks/applypatch-msg exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/applypatch-msg).
exec node "$(dirname "$0")/run-hook.js" applypatch-msg "$@"
~~~~

### `git-hooks/commit-msg`

<!-- file: git-hooks/commit-msg exec -->
~~~~sh
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

<!-- file: git-hooks/post-applypatch exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-applypatch).
exec node "$(dirname "$0")/run-hook.js" post-applypatch "$@"
~~~~

### `git-hooks/post-checkout`

<!-- file: git-hooks/post-checkout exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-checkout).
exec node "$(dirname "$0")/run-hook.js" post-checkout "$@"
~~~~

### `git-hooks/post-commit`

<!-- file: git-hooks/post-commit exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-commit).
exec node "$(dirname "$0")/run-hook.js" post-commit "$@"
~~~~

### `git-hooks/post-merge`

<!-- file: git-hooks/post-merge exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-merge).
exec node "$(dirname "$0")/run-hook.js" post-merge "$@"
~~~~

### `git-hooks/post-rewrite`

<!-- file: git-hooks/post-rewrite exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/post-rewrite).
exec node "$(dirname "$0")/run-hook.js" post-rewrite "$@"
~~~~

### `git-hooks/pre-applypatch`

<!-- file: git-hooks/pre-applypatch exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-applypatch).
exec node "$(dirname "$0")/run-hook.js" pre-applypatch "$@"
~~~~

### `git-hooks/pre-auto-gc`

<!-- file: git-hooks/pre-auto-gc exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-auto-gc).
exec node "$(dirname "$0")/run-hook.js" pre-auto-gc "$@"
~~~~

### `git-hooks/pre-commit`

<!-- file: git-hooks/pre-commit exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-commit).
exec node "$(dirname "$0")/run-hook.js" pre-commit "$@"
~~~~

### `git-hooks/pre-merge-commit`

<!-- file: git-hooks/pre-merge-commit exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-merge-commit).
exec node "$(dirname "$0")/run-hook.js" pre-merge-commit "$@"
~~~~

### `git-hooks/pre-push`

<!-- file: git-hooks/pre-push exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-push).
exec node "$(dirname "$0")/run-hook.js" pre-push "$@"
~~~~

### `git-hooks/pre-rebase`

<!-- file: git-hooks/pre-rebase exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/pre-rebase).
exec node "$(dirname "$0")/run-hook.js" pre-rebase "$@"
~~~~

### `git-hooks/prepare-commit-msg`

<!-- file: git-hooks/prepare-commit-msg exec -->
~~~~sh
#!/bin/sh
# Generated stub: dispatches to run-hook.js (playbook guard + the repo's own .git/hooks/prepare-commit-msg).
exec node "$(dirname "$0")/run-hook.js" prepare-commit-msg "$@"
~~~~

### `git-hooks/run-hook.js`

<!-- file: git-hooks/run-hook.js exec -->
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

const skills = fs.readdirSync(SKILLS).filter((n) => fs.existsSync(path.join(SKILLS, n, "SKILL.md")));
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
2. **Never rewrite pushed history.** No amend, rebase, reset + re-push or squash on a pushed branch. Fix with a new commit (`fix: …` / `revert: …`). Update from the default branch with `git merge origin/<default>`.
3. **Multiple commits, one PR.** Split the work into logical commits and open a single PR. One commit is fine only when the change truly can't be split; say so.
4. **Separate PRs only when the user explicitly asks.** Each still gets multiple commits.
5. **Ask before committing**, unless the user already said "commit".
6. The diff must follow the 4 "before coding" rules (assumptions stated, minimal, surgical, verified). Flag anything beyond the request before committing.

## 1. Sync and branch

```bash
git fetch origin
git checkout <default> && git pull --ff-only origin <default>
git checkout -b <branch>          # use the user's exact branch name
```
- Find `<default>` with `git symbolic-ref --short refs/remotes/origin/HEAD` (strip `origin/`).
- Uncommitted work: list it and ask whether to stash (`git stash push -u -m "<why>"`) or commit it first. Never discard it.
- "Pull latest into this branch": `git fetch origin && git merge origin/<default>`. Merge, don't rebase.

## 2. Split commits

- One commit per logical unit (feature area, module, config key, migration…). If the user asks for N commits, make exactly N.
- Conventional Commits: `feat(scope): …`, `fix(scope): …`, `refactor:`, `test:`, `docs:`, `chore:`.
- Split one file across commits with `git add -p`, or apply the edits in stages.
- Respect the project's commit hooks (lint, format, commit-msg). If a hook needs an interactive terminal and hangs, tell the user rather than silently skipping it.
- Add any footer the user's or project's rules require (e.g. a co-author line).
- Before the first push, show the plan: `git log --oneline origin/<default>..HEAD`. If it's one commit but the work spans several units, split it now. After pushing it can't be split without a force-push.

## 3. Push

```bash
git push -u origin <branch>       # plain push only
```
If rejected because the remote is ahead: `git pull --no-rebase origin <branch>`, then push again.

## 4. PR title and description: summarise the WHOLE branch

Hosting defaults (branch name or last commit as title, empty template as body) are wrong for multi-commit branches. Never rely on them.

1. Read the whole branch:
   ```bash
   git log --reverse --format='%h %s' origin/<default>..HEAD
   git diff --stat origin/<default>...HEAD
   ```
2. **Title** (≤ 72 chars): conventional prefix + scope covering every commit. Mixed types → most significant (`feat` > `fix` > `refactor` > `chore` > `docs`).
3. **Summary**: 1–3 lines — why, scope, and what is intentionally out of scope.
4. **Generate the body** (cross-platform, no dependencies, read-only apart from the draft file):
   ```bash
   node <this-skill-dir>/scripts/pr-draft.js --title "<title>" --summary "<summary>" \
        [--refs "<tickets / related PRs>"] [--extra-file <notes.md>] [--footer "<footer line>"] [--base <default>]
   ```
   It writes a Markdown body with a per-commit table, file stats, references and footer, and prints:
   - `gh pr create` / `gh pr edit` commands for the detected host;
   - a compare URL with title and body prefilled, for when `gh` isn't logged in.
   If the repo has a PR template (`.github/pull_request_template.md`), fit the body into it.
5. **Show the title and body** to the user in a copy-pasteable block before creating the PR.
6. **Create or update** with `gh` when authenticated (`gh auth status --hostname <host>`); otherwise give the prefilled URL. Login is interactive — the user runs it.
7. **New commits later:** push them to the same branch (same PR) and regenerate **both** title and body.

## 5. Separate PRs (only when asked)

Create each new branch from `origin/<default>` and `git cherry-pick` the relevant commits. On the original pushed branch, remove moved work with a `git revert` commit, never by rewriting history.
~~~~

### `skills/split-commit-pr/scripts/pr-draft.js`

<!-- file: skills/split-commit-pr/scripts/pr-draft.js -->
~~~~js
#!/usr/bin/env node
/*
 * Build a PR title + body from ALL commits on the current branch.
 * Self-contained (no dependencies), works on macOS, Linux and Windows.
 *
 * Usage (from the repo root):
 *   node pr-draft.js --title "<title>" --summary "<1-3 lines>"
 *        [--refs "<tickets>"] [--extra-file notes.md] [--footer "<line>"] [--base main] [--remote origin]
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

const lines = ["## Summary", summary, "", "## Commits", "| Commit | Change | Files |", "|---|---|---|"];
for (const c of commits) {
  lines.push(
    "| `" + c.sha + "` | " + cell(c.subject) + " | " + c.files.map((f) => "`" + cell(short(f)) + "`").join("<br>") + " |"
  );
}
lines.push("", "**Files changed (" + fileCount + "):** " + stat, "");
if (extraFile) lines.push(fs.readFileSync(extraFile, "utf8").trim(), "");
lines.push("## References", refs || "_None_", "");
if (footer) lines.push(footer);
const body = lines.join("\n").trim() + "\n";

const out = path.join(os.tmpdir(), "pr-" + branch.replace(/[^\w.-]+/g, "_") + ".md");
fs.writeFileSync(out, body);

const q = (s) => '"' + s.replace(/"/g, '\\"') + '"';
const info = remoteInfo(remote);
console.log("TITLE: " + title);
console.log("BODY FILE: " + out + "  (" + commits.length + " commits, " + fileCount + " files)");

if (info) {
  const ghBase = "gh pr %s --repo " + info.host + "/" + info.slug;
  console.log("\n# gh (authenticated):");
  console.log("  new PR:      " + ghBase.replace("%s", "create") + " --base " + base + " --head " + q(branch) +
    " --title " + q(title) + " --body-file " + q(out));
  console.log("  existing PR: " + ghBase.replace("%s", "edit") + " " + q(branch) +
    " --title " + q(title) + " --body-file " + q(out));

  const compare = info.web + "/compare/" + base + "..." + encodeURIComponent(branch) + "?expand=1&title=" +
    encodeURIComponent(title);
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
