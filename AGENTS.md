# Repository workflow

- After completing a user-requested code change, commit only the files changed for that task and push the current branch to its configured upstream.
- Never include unrelated pre-existing changes, local secrets, environment files, local settings, or generated artifacts in the commit.
- If a push is blocked by authentication, network access, or a remote conflict, report the blocker clearly instead of force-pushing or broadening the commit scope.

## IELTS content integrity

- Before adding a Listening, Reading, Writing, or Speaking test, check the live repository catalog and source content for duplicates. Add it only when it is not already present; otherwise, tell the user that it already exists and request a different test.

## IELTS diagrams and Listening completion

- When the user supplies a map or small diagram, reproduce its original geometry, labels and details as an inline SVG/code drawing. Do not rely on a raster image, external image request, or image decoder for the displayed drawing. Keep it working in the test and Analyze/review, including saved attempts.
- Listening tests, including full mocks and practice, must not display or end on a separate countdown timer. Automatically submit 20 seconds after the final audio track ends. Earlier playlist tracks, loading failures and review playback must not submit the test. Reading, Writing and Speaking timing remains unchanged.
