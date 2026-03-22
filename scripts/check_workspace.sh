#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: check_workspace.sh --expected-remote <url> [--expected-branch <branch>] [--required-files <comma-separated-list>]

Validates that the current git workspace matches the expected repository and branch.
EOF
}

EXPECTED_REMOTE=""
EXPECTED_BRANCH=""
REQUIRED_FILES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --expected-remote)
      EXPECTED_REMOTE=${2:-}
      shift 2
      ;;
    --expected-branch)
      EXPECTED_BRANCH=${2:-}
      shift 2
      ;;
    --required-files)
      REQUIRED_FILES=${2:-}
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$EXPECTED_REMOTE" ]]; then
  echo "--expected-remote is required" >&2
  usage >&2
  exit 2
fi

ACTUAL_REMOTE=$(git remote get-url origin)
ACTUAL_BRANCH=$(git branch --show-current)
declare -a FAILURES=()

if [[ "$ACTUAL_REMOTE" != "$EXPECTED_REMOTE" ]]; then
  FAILURES+=("expected remote '$EXPECTED_REMOTE' but found '$ACTUAL_REMOTE'")
fi

if [[ -n "$EXPECTED_BRANCH" && "$ACTUAL_BRANCH" != "$EXPECTED_BRANCH" ]]; then
  FAILURES+=("expected branch '$EXPECTED_BRANCH' but found '$ACTUAL_BRANCH'")
fi

if [[ -n "$REQUIRED_FILES" ]]; then
  IFS=',' read -r -a FILE_LIST <<<"$REQUIRED_FILES"
  for required_file in "${FILE_LIST[@]}"; do
    if [[ ! -f "$required_file" ]]; then
      FAILURES+=("required file '$required_file' is missing from the workspace")
    fi
  done
fi

if [[ "${#FAILURES[@]}" -eq 0 ]]; then
  echo "workspace matches expected remote and branch"
  exit 0
fi

echo "workspace mismatch detected:"
for failure in "${FAILURES[@]}"; do
  echo "- $failure"
done

echo "recovery:"
echo "- launch Symphony with this repository's WORKFLOW.md so it clones $EXPECTED_REMOTE"
echo "- ensure the Linear issue branch is available locally before implementation starts"

exit 1
