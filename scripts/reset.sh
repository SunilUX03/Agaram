#!/usr/bin/env bash
# Complete reset: back to the baseline tag, all experiment work on this branch removed.
# Usage: npm run reset            (keeps experiment branches)
#        npm run reset -- --all   (also deletes every exp/* branch)
set -euo pipefail
git rev-parse -q --verify refs/tags/baseline >/dev/null || { echo "No 'baseline' tag. Run scripts/lab-setup.sh first."; exit 1; }
git checkout -f main 2>/dev/null || git checkout -f -b main baseline
git reset --hard baseline
git clean -fdx -e node_modules
if [ "${1:-}" = "--all" ]; then
  for b in $(git for-each-ref --format='%(refname:short)' 'refs/heads/exp/*'); do git branch -D "$b"; done
fi
echo "Reset to baseline ($(git rev-parse --short baseline))."
