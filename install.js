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
