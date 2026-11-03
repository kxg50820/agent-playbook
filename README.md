# agent-playbook

My portable AI coding workflow: skills, AGENTS.md rules, and git safety hooks that follow me across tools, teams, and companies.

One source of truth for how I want AI coding agents to work — usable in
Claude Code, Cursor, Copilot, and other tools, on any machine.

## What's inside

| Folder / file | What it does |
|---|---|
| `AGENTS.md` | The core rules every agent should follow. Tool-agnostic. |
| `CLAUDE.md` | Claude Code entry point — imports `AGENTS.md`, no duplication. |
| `.github/muse-instructions.md` | Copilot entry point — same core rules. |
| `.muserules` | Cursor entry point — same core rules. |
| `skills/` | Reusable skills. Start from `skills/_template/SKILL.md`. |
| `hooks/` | Git safety hooks: block secrets, large files, and force-pushes to main. |
| `install.sh` | Copies the rules + installs the hooks into any repo. |

## Use it in a new project

```bash
git clone https://github.com/kxg50820/agent-playbook.git
cd <your-project>
../agent-playbook/install.sh .
```

Or manually: copy `AGENTS.md` to your project root and run
`cp hooks/pre-commit hooks/pre-push .git/hooks/ && chmod +x .git/hooks/pre-*`

## Principles

1. **One source, many tools** — edit `AGENTS.md`, the tool files just point to it.
2. **No secrets, ever** — hooks block `.env`, keys, and token-shaped strings.
3. **No company code/data** — this playbook is personal workflow only, safe to
   carry between employers. Never paste employer code into it.
4. **Read before you install** — read any third-party skill's SKILL.md first.

## Stack notes

Built for my day-to-day: Java, TypeScript/React, Python, and AWS.
Language-specific guidance lives in `AGENTS.md` and can be trimmed per project.
