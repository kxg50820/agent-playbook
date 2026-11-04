#!/usr/bin/env node
/*
 * Build a PR title + body from ALL commits on the current branch.
 * Self-contained (no dependencies), works on macOS, Linux and Windows.
 * Usage (from the repo root):
 *   node pr-draft.js --title "<title>" --summary "<1-3 lines>"
 *        [--refs "<tickets>"] [--extra-file notes.md] [--footer "<line>"] [--base main] [--remote origin]
 * Ticket: --refs takes precedence; otherwise the ticket is extracted
 * from the current branch name (e.g. ABC-123). If neither has one,
 * the body notes that a ticket is required and must be asked for;
 * a ticket is never invented.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
function git(args, optional) {
  const r = spawnSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (r.error || r.status !== 0) {
    if (optional) return "";
    console.error("git " + args.join(" ") + " failed: " + (r.stderr || r.error));
    process.exit(1);
  }
  return r.stdout.trim();
}
function defaultBranch(remote) {
  const head = git(["symbolic-ref", "--short", "refs/remotes/" + remote + "/HEAD"], true);
  return head ? head.replace(remote + "/", "") : "main";
}
function remoteInfo(remote) {
  const url = git(["remote", "get-url", remote], true);
  const m = url.match(/^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?([^/:]+)[:/](?:\d+\/)?(.+?)(?:\.git)?\/?$/i);
  if (!m) return null;
  let host = m[1];
  if (!host.includes(".")) {
    // An SSH alias (git@github-personal:owner/repo): ask ssh for the real host name.
    const r = spawnSync("ssh", ["-G", host], { encoding: "utf8", windowsHide: true });
    const real = r.status === 0 ? (r.stdout.match(/^hostname (\S+)/m) || [])[1] : "";
    if (!real || !real.includes(".")) return null;
    host = real;
  }
  return { host, slug: m[2], web: "https://" + host + "/" + m[2] };
}
const remote = arg("remote", "origin");
const base = arg("base", defaultBranch(remote));
const title = arg("title", "");
const summary = arg("summary", "");
const refs = arg("refs", "");
const extraFile = arg("extra-file", "");
const footer = arg("footer", "");
if (!title || !summary) {
  console.error('Required: --title "<title>" --summary "<summary of the WHOLE branch>"');
  process.exit(1);
}
const branch = git(["branch", "--show-current"]);
// A ticket starts with a letter (ABC-123). Digits-first matches like 2024-10 are not tickets.
// In a branch name it leads the name (ABC-123-slug, feature/ABC-123-slug), so SHA-256 or UTF-8 mid-name don't count.
const ticketFromRefs = (refs.match(/\b[A-Z][A-Z0-9]+-[0-9]+\b/) || [])[0] || "";
const ticketFromBranch = (branch.match(/(?:^|\/)([A-Z][A-Z0-9]+-[0-9]+)(?=$|[-_\/])/) || [])[1] || "";
const ticket = ticketFromRefs || ticketFromBranch;

const baseRef = remote + "/" + base;
const commits = git(["log", "--reverse", "--format=%h%x09%s", baseRef + "..HEAD"])
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [sha, subject] = line.split("\t");
    const files = git(["show", "--name-only", "--format=", sha]).split("\n").filter(Boolean);
    return { sha, subject, files };
  });
if (!commits.length) {
  console.error("No commits on " + branch + " ahead of " + baseRef + " (run git fetch?)");
  process.exit(1);
}
const stat = git(["diff", "--shortstat", baseRef + "...HEAD"]);
const fileCount = git(["diff", "--name-only", baseRef + "...HEAD"]).split("\n").filter(Boolean).length;
const short = (f) => (f.length > 70 ? "…" + f.slice(-69) : f);
const cell = (s) => s.replace(/\|/g, "\\|");
const summaryLine = ticket ? "Jira: " + ticket : "Jira ticket required — ask the user for the ticket before committing; none was given and none was found in the branch name.";
const lines = ["## Summary", summaryLine, summary, "", "## Commits", "| Commit | Change | Files |", "|---|---|---|"];
for (const c of commits) {
  lines.push(
    "| `" + c.sha + "` | " + cell(c.subject) + " | " + c.files.map((f) => "`" + cell(short(f)) + "`").join("<br>") + " |"
  );
}
lines.push("", "**Files changed (" + fileCount + "):** " + stat, "");
if (extraFile) lines.push(fs.readFileSync(extraFile, "utf8").trim(), "");
lines.push("## References", refs || ticket || "_None_", "");
if (footer) lines.push(footer);
const body = lines.join("\n").trim() + "\n";
const out = path.join(os.tmpdir(), "pr-" + branch.replace(/[^\w.-]+/g, "_") + ".md");
fs.writeFileSync(out, body);
const q = (s) => '"' + s.replace(/"/g, '\\"') + '"';
const info = remoteInfo(remote);
console.log("TITLE: " + title);
console.log("BODY FILE: " + out + "  (" + commits.length + " commits, " + fileCount + " files)");
if (!ticket) {
  console.log("\nWARNING: No Jira ticket found — ask the user for the ticket before committing; none was invented.");
}
if (info) {
  const ghBase = "gh pr %s --repo " + info.host + "/" + info.slug;
  console.log("\n# gh (authenticated):");
  console.log("  new PR:      " + ghBase.replace("%s", "create") + " --base " + base + " --head " + q(branch) + " --title " + q(title) + " --body-file " + q(out));
  console.log("  existing PR: " + ghBase.replace("%s", "edit") + " " + q(branch) + " --title " + q(title) + " --body-file " + q(out));
  const compare = info.web + "/compare/" + base + "..." + encodeURIComponent(branch) + "?expand=1&title=" + encodeURIComponent(title);
  const full = compare + "&body=" + encodeURIComponent(body);
  console.log("\n# Browser (title and body prefilled):");
  if (full.length > 7500) {
    console.log("  Body too long for a URL; title-only link below, paste the body from " + out);
    console.log("  " + compare);
  } else {
    console.log("  " + full);
  }
} else {
  console.log("\nNo parsable '" + remote + "' remote; paste the body from " + out);
}
