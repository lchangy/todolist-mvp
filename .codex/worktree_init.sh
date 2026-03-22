#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
EXPECTED_REMOTE=${TODO_REPO_REMOTE_URL:-https://github.com/lchangy/todolist-mvp}
ISSUE_BRANCH=${LINEAR_ISSUE_BRANCH:-${LINEAR_BRANCH_NAME:-${ISSUE_BRANCH:-${BRANCH_NAME:-}}}}

if [[ -n "$ISSUE_BRANCH" ]]; then
  CURRENT_BRANCH=$(git branch --show-current)

  if [[ "$CURRENT_BRANCH" == "$ISSUE_BRANCH" ]]; then
    echo "worktree already on Linear issue branch: $ISSUE_BRANCH"
  elif git show-ref --verify --quiet "refs/heads/$ISSUE_BRANCH"; then
    git checkout -q "$ISSUE_BRANCH"
    echo "checked out existing local branch: $ISSUE_BRANCH"
  elif [[ "${TODO_SKIP_REMOTE_LOOKUP:-0}" != "1" ]] && git ls-remote --exit-code --heads origin "$ISSUE_BRANCH" >/dev/null 2>&1; then
    git fetch -q origin "refs/heads/$ISSUE_BRANCH:refs/remotes/origin/$ISSUE_BRANCH"
    git checkout -q -B "$ISSUE_BRANCH" "refs/remotes/origin/$ISSUE_BRANCH"
    echo "checked out existing remote branch: $ISSUE_BRANCH"
  else
    git checkout -q -B "$ISSUE_BRANCH"
    echo "created local branch for Linear issue: $ISSUE_BRANCH"
  fi
else
  echo "no Linear issue branch provided; leaving current branch unchanged"
fi

"$ROOT_DIR/scripts/check_workspace.sh" \
  --expected-remote "$EXPECTED_REMOTE" \
  --expected-branch "${ISSUE_BRANCH:-$(git branch --show-current)}"
