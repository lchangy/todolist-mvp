# Workspace/Repository Mismatch Runbook

## What went wrong

`CGX-10` showed two different mismatch modes:

1. A Symphony instance was launched with `openai/symphony`'s sample workflow,
   which cloned the Symphony repo for a `CGX` TodoList ticket.
2. A TodoList workspace can still start on `main` if the ticket branch has not
   been created locally yet, which hides in-flight app files from dependent UI
   tickets.

The fix in this repository is to treat [WORKFLOW.md](/home/cgx/code/symphony-workspaces/CGX-12/WORKFLOW.md)
as the only valid routing contract for the TodoList project and to bootstrap the
issue branch in [`.codex/worktree_init.sh`](/home/cgx/code/symphony-workspaces/CGX-12/.codex/worktree_init.sh).

## Detect a mismatch

Run:

```bash
bash scripts/check_workspace.sh \
  --expected-remote https://github.com/lchangy/todolist-mvp \
  --expected-branch "<linear issue branch>"
```

Investigate further if any of these are true:

- `git remote get-url origin` is not `https://github.com/lchangy/todolist-mvp`
- `git branch --show-current` is not the issue `branchName`
- Required app files are missing for a ticket that depends on earlier UI work

## Recover safely

1. Stop implementation immediately and keep the mismatch evidence in the Linear workpad.
2. Relaunch Symphony using this repo's [WORKFLOW.md](/home/cgx/code/symphony-workspaces/CGX-12/WORKFLOW.md) instead of the `openai/symphony` sample workflow.
3. Recreate the workspace so `hooks.after_create` clones `lchangy/todolist-mvp`.
4. Let [`.codex/worktree_init.sh`](/home/cgx/code/symphony-workspaces/CGX-12/.codex/worktree_init.sh) check out or create the Linear issue branch locally.
5. Re-run `bash scripts/check_workspace.sh ...` and only continue once the repo and branch match.

## Practical note for dependent UI tickets

If a ticket depends on files from another still-open branch, the workspace can be
on the correct repo and still lack the expected files on `main`. Treat that as a
branch/dependency problem, not a repository mismatch:

- confirm which upstream branch or PR actually contains the needed files
- keep the dependent issue blocked until that branch is merged or intentionally
  chosen as the execution base
