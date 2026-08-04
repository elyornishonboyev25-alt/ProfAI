# Repository workflow

- After completing a user-requested code change, commit only the files changed for that task and push the current branch to its configured upstream.
- Never include unrelated pre-existing changes, local secrets, environment files, local settings, or generated artifacts in the commit.
- If a push is blocked by authentication, network access, or a remote conflict, report the blocker clearly instead of force-pushing or broadening the commit scope.

## IELTS content integrity

- Before adding a Listening, Reading, Writing, or Speaking test, check the live repository catalog and source content for duplicates. Add it only when it is not already present; otherwise, tell the user that it already exists and request a different test.
