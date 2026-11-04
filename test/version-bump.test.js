"use strict";
const test = require("node:test");
const assert = require("node:assert");
const { needsBump } = require("../scripts/check-version-bump");

test("docs, tests, CI and templates never need a version bump", () => {
  const files = ["README.md", "PLAYBOOK.md", "test/guards.test.js", ".github/workflows/plugin-version.yml", "templates/skill-template/SKILL.md", "scripts/check-version-bump.js", "package.json"];
  assert.deepStrictEqual(needsBump(files), []);
});

test("skills, hooks, libs and the installer need a version bump", () => {
  const files = ["skills/ponytail/SKILL.md", "agent-hooks/guard.js", "hooks/pre-commit", "lib/config.js", "install.js", "AGENTS.md", "config.example.json"];
  assert.deepStrictEqual(needsBump(files), files);
});
