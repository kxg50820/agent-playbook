"use strict";
// Loads config.example.json, overlaid by config.local.json (gitignored, per machine).

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    // A missing file is normal; a broken one must not silently drop protections.
    if (e.code !== "ENOENT") process.stderr.write("[agent-playbook] ignoring " + file + ": " + e.message + "\n");
    return {};
  }
}

function loadConfig() {
  return Object.assign(
    readJson(path.join(ROOT, "config.example.json")),
    readJson(path.join(ROOT, "config.local.json"))
  );
}

module.exports = { ROOT, loadConfig };
