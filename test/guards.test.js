"use strict";
// Run: npm test   (built-in node:test, no dependencies)
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

// --- agent guard: what does it decide for a shell command? ---
function guard(command, cwd) {
  const r = spawnSync("node", [path.join(ROOT, "agent-hooks", "guard.js")], {
    input: JSON.stringify({ tool_input: { command }, cwd: cwd || os.tmpdir() }),
    encoding: "utf8",
  });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : "allow";
}

test("guard denies real force-pushes", () => {
  for (const c of ["git push --force", "git push -f origin main", "git push origin main --force-with-lease", "git push origin +main", "git -C . push -f"]) {
    assert.strictEqual(guard(c), "deny", c);
  }
});

test("guard allows plain pushes and text that only mentions force-push", () => {
  for (const c of ["git push origin feature", 'git commit -m "docs: why git push --force is blocked"', "git status"]) {
    assert.strictEqual(guard(c), "allow", c);
  }
});

test("guard asks before committing on a protected branch, also with git -C", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "guard-"));
  spawnSync("git", ["init", "-q", "-b", "main"], { cwd: repo });
  assert.strictEqual(guard("git commit -m x", repo), "ask");
  assert.strictEqual(guard("git -C . commit -m x", repo), "ask");
});

// --- pre-commit secret scan (needs bash; skipped where it is missing) ---
const bash = ["bash", "C:\\Program Files\\Git\\bin\\bash.exe"].find((b) => spawnSync(b, ["-c", "true"]).status === 0);

function precommit(files, base) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pc-"));
  const run = (...a) => spawnSync("git", a, { cwd: dir, encoding: "utf8" });
  run("init", "-q");
  run("config", "user.email", "t@t.t");
  run("config", "user.name", "t");
  if (base) {
    for (const [f, c] of Object.entries(base)) fs.writeFileSync(path.join(dir, f), c);
    run("add", "-A");
    run("-c", "core.hooksPath=" + os.devNull, "commit", "-qm", "base");
  }
  for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), c);
  run("add", "-A");
  return spawnSync(bash, [path.join(ROOT, "hooks", "pre-commit").replace(/\\/g, "/")], { cwd: dir, encoding: "utf8" });
}

const TOKEN = "ghp_" + "a".repeat(36);

test("pre-commit blocks a new token and never prints it", { skip: !bash }, () => {
  const r = precommit({ "app.cfg": "TOKEN=" + TOKEN + "\n" });
  assert.strictEqual(r.status, 1);
  assert.ok(!(r.stdout + r.stderr).includes(TOKEN));
});

test("pre-commit lets you commit the removal of a token", { skip: !bash }, () => {
  const r = precommit({ "app.cfg": "TOKEN=removed\n" }, { "app.cfg": "TOKEN=" + TOKEN + "\n" });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
});

test("pre-commit allows .env.example but blocks .env", { skip: !bash }, () => {
  assert.strictEqual(precommit({ ".env.example": "A=1\n" }).status, 0);
  assert.strictEqual(precommit({ ".env": "A=1\n" }).status, 1);
});

// --- PR draft: ticket detection ---
test("pr-draft does not mistake dates or standards for Jira tickets", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "pr-"));
  const run = (...a) => spawnSync("git", a, { cwd: repo, encoding: "utf8" });
  run("init", "-q", "-b", "main");
  run("config", "user.email", "t@t.t");
  run("config", "user.name", "t");
  fs.writeFileSync(path.join(repo, "a"), "1");
  run("add", "-A");
  run("commit", "-qm", "base");
  run("update-ref", "refs/remotes/origin/main", "HEAD");
  const script = path.join(ROOT, "skills", "split-commit-pr", "scripts", "pr-draft.js");
  for (const [branch, expected] of [["release-2024-10", false], ["docs-SHA-256-note", false], ["ABC-123-fix", true]]) {
    run("checkout", "-q", "-B", branch, "main");
    fs.writeFileSync(path.join(repo, "b"), branch);
    run("add", "-A");
    run("commit", "-qm", "change");
    const r = spawnSync("node", [script, "--title", "t", "--summary", "s"], { cwd: repo, encoding: "utf8" });
    assert.strictEqual(!/WARNING: No Jira ticket/.test(r.stdout + r.stderr), expected, branch + "\n" + r.stdout + r.stderr);
  }
});
