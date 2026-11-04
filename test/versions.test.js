"use strict";
// Installed plugins are cached per version. If a change ships without a version bump, users never see it,
// and if the three manifests disagree, Claude Code and Codex install different releases.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const read = (p) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", p), "utf8"));

test("all plugin manifests carry the same version", () => {
  const versions = {
    ".claude-plugin/plugin.json": read(".claude-plugin/plugin.json").version,
    ".claude-plugin/marketplace.json": read(".claude-plugin/marketplace.json").plugins[0].version,
    ".codex-plugin/plugin.json": read(".codex-plugin/plugin.json").version,
  };
  assert.strictEqual(new Set(Object.values(versions)).size, 1, JSON.stringify(versions));
});
