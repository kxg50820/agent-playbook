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
