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
