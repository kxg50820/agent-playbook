#!/usr/bin/env node
/*
 * Semantic JSON diff between two files: ignores key order and BOM, matches array items by
 * identity keys so one added item shows as one line. Read-only, no dependencies.
 *
 * Usage:
 *   node json-diff.js <source.json> <target.json> [--keys id,key,name,field] [--path a.b] [--limit 300]
 * Output: "+" only in source, "-" only in target, "~" changed (target -> source).
 * Exit code: 0 identical, 1 different, 2 usage/parse error.
 */
"use strict";

const fs = require("fs");

const argv = process.argv.slice(2);
function opt(name, def) {
  const i = argv.indexOf("--" + name);
  if (i === -1) return def;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
}
const KEYS = opt("keys", "id,key,name,field,headerName,label").split(",").filter(Boolean);
const SUBPATH = opt("path", "");
const LIMIT = Number(opt("limit", "300"));
const [srcFile, tgtFile] = argv;

if (!srcFile || !tgtFile) {
  console.error("Usage: json-diff.js <source.json> <target.json> [--keys id,key,name] [--path a.b] [--limit N]");
  process.exit(2);
}

function load(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    return SUBPATH ? SUBPATH.split(".").reduce((o, k) => (o == null ? o : o[k]), data) : data;
  } catch (e) {
    console.error("Cannot read " + file + ": " + e.message);
    process.exit(2);
  }
}

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

function idOf(x, i) {
  if (isObj(x)) for (const k of KEYS) if (x[k] !== undefined) return k + "=" + x[k];
  return "#" + i;
}

function keyed(arr) {
  const m = new Map();
  const seen = new Map();
  arr.forEach((x, i) => {
    let k = idOf(x, i);
    const n = (seen.get(k) || 0) + 1;
    seen.set(k, n);
    if (n > 1) k += "~" + n;
    m.set(k, x);
  });
  return m;
}

const brief = (x) => {
  const s = JSON.stringify(x);
  return s === undefined ? "undefined" : s.length > 160 ? s.slice(0, 157) + "..." : s;
};

function diff(src, tgt, p, out) {
  if (Array.isArray(src) && Array.isArray(tgt)) {
    const ms = keyed(src);
    const mt = keyed(tgt);
    for (const [k, v] of ms) if (!mt.has(k)) out.add.push(p + "[" + k + "]  " + brief(v));
    for (const [k, v] of mt) if (!ms.has(k)) out.del.push(p + "[" + k + "]  " + brief(v));
    for (const [k, v] of ms) if (mt.has(k)) diff(v, mt.get(k), p + "[" + k + "]", out);
    return;
  }
  if (isObj(src) && isObj(tgt)) {
    for (const k of Object.keys(src)) {
      if (!(k in tgt)) out.add.push(p + "." + k + "  " + brief(src[k]));
      else diff(src[k], tgt[k], p + "." + k, out);
    }
    for (const k of Object.keys(tgt)) if (!(k in src)) out.del.push(p + "." + k + "  " + brief(tgt[k]));
    return;
  }
  if (JSON.stringify(src) !== JSON.stringify(tgt)) out.chg.push(p + "  " + brief(tgt) + " -> " + brief(src));
}

const out = { add: [], del: [], chg: [] };
diff(load(srcFile), load(tgtFile), "$", out);

const print = (label, sign, list) => {
  console.log(label + " (" + list.length + ")");
  list.slice(0, LIMIT).forEach((l) => console.log("  " + sign + " " + l));
  if (list.length > LIMIT) console.log("  ... " + (list.length - LIMIT) + " more (use --limit)");
};
print("Only in source", "+", out.add);
print("Only in target", "-", out.del);
print("Changed", "~", out.chg);

process.exit(out.add.length + out.del.length + out.chg.length ? 1 : 0);
