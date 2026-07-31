# Repository workflow

- After completing a user-requested code change, commit only the files changed for that task and push the current branch to its configured upstream.
- Never include unrelated pre-existing changes, local secrets, environment files, local settings, or generated artifacts in the commit.
- If a push is blocked by authentication, network access, or a remote conflict, report the blocker clearly instead of force-pushing or broadening the commit scope.
