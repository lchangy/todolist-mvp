# TodoList Symphony Workflow

This repository is the source of truth for the `TodoList MVP Symphony` project.
If Symphony is launched against any other workflow file, CGX UI tickets can be
dispatched into the wrong repository or onto the wrong branch.

## Canonical routing

- Linear project slug: `11d24c703eb9`
- Repository to clone into each workspace: `https://github.com/lchangy/todolist-mvp`
- Workspace bootstrap: run [`.codex/worktree_init.sh`](/home/cgx/code/symphony-workspaces/CGX-12/.codex/worktree_init.sh)
- Branch source of truth: the Linear issue `branchName`

## Required Symphony configuration

Use these values in the Symphony launcher configuration instead of the sample
workflow from `openai/symphony`:

```yaml
tracker:
  project_slug: 11d24c703eb9

hooks:
  after_create: |
    git clone --depth 1 https://github.com/lchangy/todolist-mvp .
    ./.codex/worktree_init.sh
```

## Branch policy

- Every TodoList issue should have a Linear `branchName`.
- The bootstrap script creates that branch locally when it is missing on the
  remote, so a new ticket does not silently fall back to `main`.
- If the branch already exists on the remote, the bootstrap script checks it out.
- If the repo or branch does not match expectations, the bootstrap script fails
  fast via `scripts/check_workspace.sh`.

## Operator preflight

Run this before marking a TodoList ticket runnable:

```bash
bash scripts/check_workspace.sh \
  --expected-remote https://github.com/lchangy/todolist-mvp \
  --expected-branch "<linear issue branch>"
```

Detailed detection and recovery steps live in
[`docs/workspace-mismatch-runbook.md`](/home/cgx/code/symphony-workspaces/CGX-12/docs/workspace-mismatch-runbook.md).
