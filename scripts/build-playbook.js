#!/usr/bin/env node
/*
 * Regenerates section 4 of PLAYBOOK.md (the full source of every tracked file) and the file count.
 * The catalogue, folder tree and extract script above section 4 are hand-written and left as they are.
 *
 *   node scripts/build-playbook.js           rewrite PLAYBOOK.md
 *   node scripts/build-playbook.js --check   exit 1 if PLAYBOOK.md is out of date (used by npm test)
 *
 * Only tracked files are included: `git add` (or `git add -N`) a new file first.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TARGET = path.join(ROOT, "PLAYBOOK.md");
const MARKER = "## 4. Files\n\n";
// Plugin packaging files come last, after the ordinary files, in this order.
const TAIL = [".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json", ".claude-plugin/plugin.json",
  ".codex-plugin/plugin.json", "hooks/plugin-hooks.json", "skills/playbook/SKILL.md"];

const lf = (s) => s.replace(/\r\n/g, "\n");
const read = (f) => lf(fs.readFileSync(path.join(ROOT, f), "utf8"));
const lang = (f) =>
  f.endsWith(".md") ? "markdown" : f.endsWith(".json") ? "json" : f.endsWith(".yml") ? "yaml" : f.endsWith(".js") ? "js"
    : /^(git-hooks|hooks)\/[^.\/]+$/.test(f) ? "bash" : "";

function build() {
  const ls = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" });
  if (ls.status !== 0) throw new Error("git ls-files failed: " + ls.stderr);
  const all = ls.stdout.split("\n").filter(Boolean);
  const files = all.filter((f) => f !== "PLAYBOOK.md");

  const old = read("PLAYBOOK.md");
  const cut = old.indexOf(MARKER);
  if (cut < 0) throw new Error("PLAYBOOK.md has no '" + MARKER.trim() + "' heading");
  let head = old.slice(0, cut + MARKER.length).replace(/\d+ files total/, all.length + " files total");

  const ordinary = files.filter((f) => !TAIL.includes(f)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const order = [...ordinary, ...TAIL.filter((f) => files.includes(f))];
  const block = (f) => "### `" + f + "`\n\n<!-- file: " + f + " -->\n~~~~" + lang(f) + "\n" + read(f).replace(/\n$/, "") + "\n~~~~\n";

  // Every tracked file should be named somewhere in the hand-written tree.
  const missing = files.filter((f) => !head.includes(path.basename(f)));
  return { text: head + order.map(block).join("\n"), missing, old };
}

function main() {
  const check = process.argv.includes("--check");
  const { text, missing, old } = build();
  let ok = true;
  if (missing.length) {
    console.error("These files are not in the PLAYBOOK.md folder tree (add them by hand):\n  " + missing.join("\n  "));
    ok = false;
  }
  if (check) {
    if (text !== old) {
      console.error("PLAYBOOK.md is out of date. Run: node scripts/build-playbook.js");
      ok = false;
    }
    if (ok) console.log("PLAYBOOK.md is up to date.");
    return ok ? 0 : 1;
  }
  fs.writeFileSync(TARGET, text);
  console.log("Wrote PLAYBOOK.md");
  return ok ? 0 : 1;
}

process.exit(main());
