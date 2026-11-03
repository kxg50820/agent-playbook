---
name: split-commit-pr
description: Sync with the default branch, create a feature branch, split the work into multiple logical commits, push without ever force-pushing, and open ONE pull request whose title and description summarise the whole branch. Use for "create a branch", "commit and open a PR", "split this into multiple commits", "write the PR description", "update the PR description".
---

# Split commits → one PR

## Standing rules

1. **Never force-push.** No `--force`, `-f`, `--force-with-lease` or `+refspec`, on any branch.
2. **Never rewrite pushed history.** No amend, rebase, reset + re-push or squash on a pushed branch. Fix with a new commit (`fix: …` / `revert: …`). Update from the default branch with `git merge origin/<default>`.
3. **Multiple commits, one PR.** Split the work into logical commits and open a single PR. One commit is fine only when the change truly can't be split; say so.
4. **Separate PRs only when the user explicitly asks.** Each still gets multiple commits.
5. **Ask before committing**, unless the user already said "commit".
6. The diff must follow the 4 "before coding" rules (assumptions stated, minimal, surgical, verified). Flag anything beyond the request before committing.

## 1. Sync and branch

```bash
git fetch origin
git checkout <default> && git pull --ff-only origin <default>
git checkout -b <branch>          # use the user's exact branch name
```
- Find `<default>` with `git symbolic-ref --short refs/remotes/origin/HEAD` (strip `origin/`).
- Uncommitted work: list it and ask whether to stash (`git stash push -u -m "<why>"`) or commit it first. Never discard it.
- "Pull latest into this branch": `git fetch origin && git merge origin/<default>`. Merge, don't rebase.

## 2. Split commits

- One commit per logical unit (feature area, module, config key, migration…). If the user asks for N commits, make exactly N.
- Conventional Commits: `feat(scope): …`, `fix(scope): …`, `refactor:`, `test:`, `docs:`, `chore:`.
- Split one file across commits with `git add -p`, or apply the edits in stages.
- Respect the project's commit hooks (lint, format, commit-msg). If a hook needs an interactive terminal and hangs, tell the user rather than silently skipping it.
- Add any footer the user's or project's rules require (e.g. a co-author line).
- Before the first push, show the plan: `git log --oneline origin/<default>..HEAD`. If it's one commit but the work spans several units, split it now. After pushing it can't be split without a force-push.

## 3. Push

```bash
git push -u origin <branch>       # plain push only
```
If rejected because the remote is ahead: `git pull --no-rebase origin <branch>`, then push again.

## 4. PR title and description: summarise the WHOLE branch

Hosting defaults (branch name or last commit as title, empty template as body) are wrong for multi-commit branches. Never rely on them.

1. Read the whole branch:
   ```bash
   git log --reverse --format='%h %s' origin/<default>..HEAD
   git diff --stat origin/<default>...HEAD
   ```
2. **Title** (≤ 72 chars): conventional prefix + scope covering every commit. Mixed types → most significant (`feat` > `fix` > `refactor` > `chore` > `docs`).
3. **Summary**: 1–3 lines — why, scope, and what is intentionally out of scope.
4. **Generate the body** (cross-platform, no dependencies, read-only apart from the draft file):
   ```bash
   node <this-skill-dir>/scripts/pr-draft.js --title "<title>" --summary "<summary>" \
        [--refs "<tickets / related PRs>"] [--extra-file <notes.md>] [--footer "<footer line>"] [--base <default>]
   ```
   It writes a Markdown body with a per-commit table, file stats, references and footer, and prints:
   - `gh pr create` / `gh pr edit` commands for the detected host;
   - a compare URL with title and body prefilled, for when `gh` isn't logged in.
   If the repo has a PR template (`.github/pull_request_template.md`), fit the body into it.
5. **Show the title and body** to the user in a copy-pasteable block before creating the PR.
6. **Create or update** with `gh` when authenticated (`gh auth status --hostname <host>`); otherwise give the prefilled URL. Login is interactive — the user runs it.
7. **New commits later:** push them to the same branch (same PR) and regenerate **both** title and body.

## 5. Separate PRs (only when asked)

Create each new branch from `origin/<default>` and `git cherry-pick` the relevant commits. On the original pushed branch, remove moved work with a `git revert` commit, never by rewriting history.
