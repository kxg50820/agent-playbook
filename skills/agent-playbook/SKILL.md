---
name: agent-playbook
description: The standing rules and skill routing for Kruthik Gandrathi's agent-playbook. Use at the start of any coding task in a project that has adopted this playbook: it sets how the agent should work (understand first, smallest complete change, surgical edits, verify before claiming done, git safety, Jira ticket first) and which bundled skill to reach for (ponytail for coding, ponytail-review for diffs, ponytail-audit for whole repos, ponytail-debt for shortcuts, split-commit-pr for commits and PRs, change-ticket-release for releases). Also usable on its own, without the rest of the plugin: the rules and compact checklists below are self-contained.
---

# agent-playbook — the umbrella skill

This is the front door to the playbook. It carries the standing rules every task follows, and it routes bigger jobs to the specialised skills bundled with it. If those skills are not installed, the compact fallbacks in this file still apply — follow them inline instead of skipping the step.

## Standing rules

### How to work
1. **Understand before editing.** Read the code the change touches and trace the real flow. State your assumptions; when two readings of the request are possible, name them instead of silently picking one.
2. **Smallest complete change.** Prefer what already exists in the codebase, then the standard library / platform, then an installed dependency, then the minimum new code that fully solves the problem. No abstractions, options, or scaffolding nobody asked for.
3. **Surgical edits.** Touch only what the task requires. Match the file's existing style. Mention unrelated problems you notice; do not fix them unasked, and do not clean up your own mess in files you didn't need to touch.
4. **Verify, then say so.** Run the project's tests / lint / build after a change. If a check fails, report it plainly — never claim success over a red result, and never hide a step you skipped.

### Git safety
- Never force-push. Never rewrite history or amend a pushed commit.
- Never push directly to a protected branch (`main` / `master` unless the project says otherwise).
- Never commit `.env`, `.pem`, `.key` files, private keys, tokens or passwords — and stop if you see one staged.
- Destructive commands (`rm -rf`, `git reset --hard`, `git clean -fd`) need explicit approval first.
- **Jira ticket first.** Before committing, find the ticket: first in what the user gave you, then in the branch name (e.g. `ABC-123`). If neither has one, **ask before committing** — never invent a ticket. When there is one, it goes in the PR description next to the Summary.

### Stack defaults
Unless the project overrides them: Java services, TypeScript / React front ends, Python for scripting and data work, AWS for cloud. Prefer the project's existing libraries and patterns over new ones.

## Route the job

| The job in front of you | Reach for |
|---|---|
| Writing or fixing code | `ponytail` (smallest complete change; lite / full / ultra) |
| Reviewing a change before a PR | `ponytail-review` |
| Reviewing a whole repo or module | `ponytail-audit` |
| Collecting deferred shortcuts | `ponytail-debt` |
| Showing the Ponytail benchmark | `ponytail-gain` |
| You forgot a command or level | `ponytail-help` |
| Committing and opening the PR | `split-commit-pr` |
| Change ticket or release notes | `change-ticket-release` |

## If the routed skill is not installed

Apply these compact versions inline:

- **Review (diff):** read the diff and the code it touches. Group findings as must fix / should fix / nice to have, numbered, in plain English: what the code does, what goes wrong, the fix, and what happens if it's skipped. Check bugs and edge cases, security (injection, auth, secrets), real load, missing tests on risky paths, slow paths, and code that can simply be deleted. Report only — change nothing unless asked.
- **Commit + PR:** group the changes into small logical commits with clear messages. PR description: `## Summary` first, then `Jira: <ticket>` — and the Jira rule above applies before any commit happens. List the tests you ran in the description.
- **Release / change ticket:** summarise what changed, why, the risk, and the rollback. For JSON config, diff semantically (ignore key order and formatting) so the ticket shows real changes only.
- **Debt:** search for `shortcut:` comments and list each with its stated limit and upgrade trigger; flag any that have no trigger.

## Guardrails

When the playbook is installed as a plugin or via `install.js`, guard hooks back these rules up mechanically: force-pushes are blocked before they run, commits and pushes on protected branches ask first, and a pre-commit scan blocks secret files, token patterns and files over 5 MB. The hooks are a safety net, not a substitute for following the rules.
