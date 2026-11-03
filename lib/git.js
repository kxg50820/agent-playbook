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
