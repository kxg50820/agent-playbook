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

  // Judge the command, not the words inside quotes (a commit message may mention "git push --force").
  const bare = cmd.replace(/(["'])(?:\\.|(?!\1).)*\1/g, '""');
  // `git`, optional global options (git -C dir, git -c k=v), then the subcommand.
  const GIT_SUB = /\bgit\b(?:\s+-\S+(?:\s+[^\s-]\S*)?)*\s+(commit|push)\b/;

  for (const seg of bare.split(/&&|\|\||;|\||\n/)) {
    if (!/\bgit\b.*\bpush\b/.test(seg)) continue;
    const forceFlag = /(^|\s)(--force(-with-lease|-if-includes)?(=\S*)?|-[a-zA-Z]*f[a-zA-Z]*)(?=\s|$)/.test(seg);
    const plusRefspec = /\s\+\S+/.test(seg);
    if (forceFlag || plusRefspec) {
      decide("deny", "Force-push is not allowed. Add a new commit and use a plain git push.");
    }
  }

  if (GIT_SUB.test(bare)) {
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
