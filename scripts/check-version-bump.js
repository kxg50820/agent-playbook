#!/usr/bin/env node
/*
 * Fails when files that ship to users changed but the plugin version did not.
 * Installed plugins are cached per version, so a change without a bump never reaches anyone.
 *
 *   node scripts/check-version-bump.js <base-ref>      e.g. origin/main
 *
 * Docs, tests, CI and templates do not ship behaviour, so they never need a bump.
 */
"use strict";

const { spawnSync } = require("child_process");

const NO_BUMP_NEEDED = [
  /^README\.md$/,
  /^PLAYBOOK\.md$/,
  /^CLAUDE\.md$/,
  /^\.muserules$/,
  /^\.gitignore$/,
  /^package\.json$/,
  /^test\//,
  /^scripts\//,
  /^templates\//,
  /^\.github\//,
];

const needsBump = (files) => files.filter((f) => !NO_BUMP_NEEDED.some((re) => re.test(f)));

function git(args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  return r.status === 0 ? r.stdout : null;
}

function versionAt(ref) {
  const text = git(["show", ref + ":.claude-plugin/plugin.json"]);
  return text ? JSON.parse(text).version : null;
}

function main(base) {
  if (!base || /^0+$/.test(base)) {
    console.log("No base to compare with (first push); skipping.");
    return 0;
  }
  const changed = (git(["diff", "--name-only", base, "HEAD"]) || "").split("\n").filter(Boolean);
  const shipped = needsBump(changed);
  if (!shipped.length) {
    console.log("No shipped files changed; no version bump needed.");
    return 0;
  }
  const before = versionAt(base);
  const after = versionAt("HEAD");
  if (before && before === after) {
    console.error("Shipped files changed but the plugin version is still " + after + ":");
    for (const f of shipped) console.error("  " + f);
    console.error("Bump \"version\" in .claude-plugin/plugin.json, .claude-plugin/marketplace.json and .codex-plugin/plugin.json,");
    console.error("or users with the plugin installed will not receive this change.");
    return 1;
  }
  console.log("Version " + before + " -> " + after + ": shipped changes will reach users.");
  return 0;
}

module.exports = { needsBump };
if (require.main === module) process.exit(main(process.argv[2]));
