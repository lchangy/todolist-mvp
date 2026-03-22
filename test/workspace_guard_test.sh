#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CHECK_SCRIPT="$ROOT_DIR/scripts/check_workspace.sh"
INIT_SCRIPT="$ROOT_DIR/.codex/worktree_init.sh"
EXPECTED_REMOTE="https://github.com/lchangy/todolist-mvp"

FAILURES=0

cleanup() {
  if [[ -n "${TEST_TMPDIR:-}" && -d "${TEST_TMPDIR:-}" ]]; then
    rm -rf "$TEST_TMPDIR"
  fi
}

trap cleanup EXIT

new_tmpdir() {
  cleanup
  TEST_TMPDIR=$(mktemp -d "$ROOT_DIR/.tmp-workspace-guard.XXXXXX")
}

assert_eq() {
  local actual=$1
  local expected=$2
  local message=$3

  if [[ "$actual" != "$expected" ]]; then
    echo "not ok - $message"
    echo "  expected: $expected"
    echo "  actual:   $actual"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
}

assert_contains() {
  local haystack=$1
  local needle=$2
  local message=$3

  if [[ "$haystack" != *"$needle"* ]]; then
    echo "not ok - $message"
    echo "  missing substring: $needle"
    echo "  output was:"
    echo "$haystack"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
}

assert_status() {
  local actual=$1
  local expected=$2
  local message=$3

  if [[ "$actual" -ne "$expected" ]]; then
    echo "not ok - $message"
    echo "  expected status: $expected"
    echo "  actual status:   $actual"
    FAILURES=$((FAILURES + 1))
    return 1
  fi
}

make_repo() {
  local repo_path=$1

  mkdir -p "$repo_path"
  (
    cd "$repo_path"
    git init -q
    git config user.name "Test User"
    git config user.email "test@example.com"
    echo "# test" > README.md
    git add README.md
    git commit -q -m "initial"
    git branch -M main
    git remote add origin "$EXPECTED_REMOTE"
  )
}

run_test() {
  local name=$1
  shift

  echo "test: $name"
  "$@"
}

test_check_workspace_accepts_matching_remote_and_branch() {
  new_tmpdir
  local repo_path="$TEST_TMPDIR/repo"
  make_repo "$repo_path"

  (
    cd "$repo_path"
    git checkout -q -b lchangy264858/cgx-12-investigate-todolist-workspacerepository-mismatch-for-ui
    set +e
    local output
    output=$("$CHECK_SCRIPT" \
      --expected-remote "$EXPECTED_REMOTE" \
      --expected-branch "lchangy264858/cgx-12-investigate-todolist-workspacerepository-mismatch-for-ui" 2>&1)
    local status=$?
    set -e

    assert_status "$status" 0 "matching workspace should validate"
    assert_contains "$output" "workspace matches expected remote and branch" \
      "success output should describe the match"
  )
}

test_check_workspace_rejects_remote_mismatch() {
  new_tmpdir
  local repo_path="$TEST_TMPDIR/repo"
  make_repo "$repo_path"

  (
    cd "$repo_path"
    git remote set-url origin https://github.com/openai/symphony
    set +e
    local output
    output=$("$CHECK_SCRIPT" \
      --expected-remote "$EXPECTED_REMOTE" \
      --expected-branch "main" 2>&1)
    local status=$?
    set -e

    assert_status "$status" 1 "mismatched remote should fail validation"
    assert_contains "$output" "expected remote" "failure output should explain the remote mismatch"
  )
}

test_worktree_init_creates_issue_branch_when_missing() {
  new_tmpdir
  local repo_path="$TEST_TMPDIR/repo"
  make_repo "$repo_path"

  (
    cd "$repo_path"
    set +e
    local output
    output=$(TODO_REPO_REMOTE_URL="$EXPECTED_REMOTE" \
      LINEAR_ISSUE_BRANCH="lchangy264858/cgx-12-investigate-todolist-workspacerepository-mismatch-for-ui" \
      "$INIT_SCRIPT" 2>&1)
    local status=$?
    set -e

    local current_branch
    current_branch=$(git branch --show-current)

    assert_status "$status" 0 "worktree init should succeed for the expected repo"
    assert_eq "$current_branch" "lchangy264858/cgx-12-investigate-todolist-workspacerepository-mismatch-for-ui" \
      "worktree init should switch to the Linear issue branch"
    if [[ "$output" != *"created local branch"* && "$output" != *"checked out existing remote branch"* ]]; then
      echo "not ok - worktree init should describe branch bootstrapping"
      echo "  output was:"
      echo "$output"
      FAILURES=$((FAILURES + 1))
      return 1
    fi
  )
}

run_test "check_workspace accepts matching remote and branch" \
  test_check_workspace_accepts_matching_remote_and_branch
run_test "check_workspace rejects remote mismatch" \
  test_check_workspace_rejects_remote_mismatch
run_test "worktree_init creates missing issue branch" \
  test_worktree_init_creates_issue_branch_when_missing

if [[ "$FAILURES" -ne 0 ]]; then
  echo
  echo "$FAILURES test(s) failed."
  exit 1
fi

echo
echo "All workspace guard tests passed."
