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

module.exports = { git, currentBranch };
