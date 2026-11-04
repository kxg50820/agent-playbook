---
name: split-commit-pr
description: Sync with the default branch, create a feature branch, split the work into multiple logical commits, push without ever force-pushing, and open ONE pull request whose title and description summarise the whole branch. Use for "create a branch", "commit and open a PR", "split this into multiple commits", "write the PR description", "update the PR description".
---

# Split commits → one PR

## Standing rules

1. **Never force-push.** No `--force`, `-f`, `--force-with-lease` or `+refspec`, on any branch.
2. **Never rewrite pushed history.** No amend, rebase, reset + re-push or squash on a pushed branch. Fix forward with a new commit.
3. **Multiple commits, one PR.** Split the work into logical commits and open a single PR. One commit per logical step — never one giant commit, never one PR per commit unless the user explicitly asks for separate PRs.
4. **PR body is the whole branch.** Title + description cover the whole branch, not just the latest commit.
5. **Ask before committing.** Do not commit without asking the user first — even if the branch is ready.
6. The diff must follow AGENTS.md. Keep it small, typed, tested and understandable.

## 0. Jira ticket first

Jira ticket first. If you didn't give one and the branch name doesn't have one, the agent asks before committing. The ticket goes in the PR description next to the change Summary.

- Before any commit, look for a Jira ticket (a key like ABC-123) in this order: first, what the user gave in the task/conversation; then the current branch name.
- If neither has one, ask the user for the ticket before committing — do not commit without one and do not invent one.
- When the PR is created, put the ticket in the PR description next to the Summary of changes (see §4).

## 1. Sync and branch

1. `git switch main` (or the default branch for this repo) and run `git pull --ff-only`.
2. Create the branch from the synced main with a ticket-led, lowercase slug, for example `feature/JIRA-123-add-login` (use the actual ticket key).
3. If the user gave a different name, use that name exactly.
4. Run `git status` to confirm the tree is clean.

## 2. Work and check

1. Implement the change with small, reviewable diffs.
2. Run the relevant tests/builds. If any fail, fix before continuing.
3. Show what changed, what was verified, and what is still open — be honest about failures.

## 3. Split commits

1. Ask the user: "I want to split this work into these commits. Is that right?"
2. Show the proposed commit list before committing.
3. If the user agrees, commit in order, one logical step per commit, with a conventional message:
   - `feat: add login validation`
   - `fix: correct error message`
   - `docs: update login docs`
4. Each commit message should be short but complete.

## 4. PR body

Generate the PR body from the *whole branch* using `scripts/pr-draft.js`. The script uses only files inside the skill folder.

1. Make sure the branch is pushed: `git push -u origin <branch>` — never force-push.
2. Run `node scripts/pr-draft.js` from the repo root.
3. The body uses this structure:
   - Summary: 1–3 lines — why, scope, and what is intentionally out of scope, with the Jira ticket next to it (e.g. `Jira: ABC-123`).
   - Changes: a list of the commits in this branch and what each one does.
   - Testing: which tests/builds were run and the result.
   - Follow-up: anything left to do, and the next step for the reviewer.
4. Generate the body with `node scripts/pr-draft.js`, inspect it, then paste it into the PR description — do not paste anything the script did not generate. The script puts the Jira ticket next to the Summary; if it cannot find a ticket, it says a ticket is required instead of inventing one.
5. If the user gives you a PR title, use it. Otherwise, use the ticket key plus a short summary of the whole branch, e.g. `ABC-123 Add login validation`.

## 5. Open the PR

1. If `gh` is available, run the `gh` command exactly as `scripts/pr-draft.js` prints it, then check that the PR was created.
2. If `gh` is not available, print the exact PR creation URL the script prints and the full PR title and body, so the user can paste them.
3. Do not edit the PR body by hand unless the user asks for a change. If they do, make the change, then regenerate the body with the script.
4. Never open a PR per commit unless the user explicitly asks for separate PRs.
