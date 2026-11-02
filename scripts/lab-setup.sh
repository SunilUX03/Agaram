#!/usr/bin/env bash
# One-time setup for the design lab clone: no pushing, and a "baseline" tag to return to.
set -euo pipefail
git rev-parse --git-dir >/dev/null
git fetch --tags origin
if ! git rev-parse -q --verify refs/tags/baseline >/dev/null; then
  git tag baseline origin/main
  echo "Created tag baseline at origin/main."
fi
git remote set-url --push origin DISABLED
echo "Pushing is now disabled in this clone. Run 'git remote -v' to check."
echo "Next: git checkout -b exp/<name> baseline && npm install && npm run dev"
