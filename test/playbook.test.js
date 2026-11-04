"use strict";
// PLAYBOOK.md embeds the source of every file. If it drifts, people who rebuild from it get stale code.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { spawnSync } = require("child_process");

test("PLAYBOOK.md is up to date with the repo", () => {
  const r = spawnSync("node", [path.join(__dirname, "..", "scripts", "build-playbook.js"), "--check"], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
});
