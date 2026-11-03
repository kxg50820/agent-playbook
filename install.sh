#!/usr/bin/env bash
# Install the playbook into a target project.
# Usage: ./install.sh /path/to/project   (default: current directory)
set -euo pipefail

TARGET="${1:-.}"
SRC="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$TARGET/.git" ]; then
  echo "Warning: $TARGET is not a git repo — copying rules, skipping hooks."
fi

cp "$SRC/AGENTS.md" "$TARGET/AGENTS.md"
cp "$SRC/CLAUDE.md" "$TARGET/CLAUDE.md"
echo "Copied AGENTS.md + CLAUDE.md -> $TARGET"

if [ -d "$TARGET/.git" ]; then
  cp "$SRC/hooks/pre-commit" "$TARGET/.git/hooks/pre-commit"
  cp "$SRC/hooks/pre-push" "$TARGET/.git/hooks/pre-push"
  chmod +x "$TARGET/.git/hooks/pre-commit" "$TARGET/.git/hooks/pre-push"
  echo "Installed git hooks -> $TARGET/.git/hooks/"
fi

echo "Done. Review AGENTS.md in the target and trim anything project-irrelevant."
