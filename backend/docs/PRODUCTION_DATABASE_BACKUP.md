# Production PostgreSQL backup and restore runbook

Use this runbook before any destructive schema or data migration, including the
planned removal of School and Olympiad records. A migration must not proceed
until a backup has been created and its contents have been verified.

## Responsibilities

- The account owner authorizes access to the production database and creates or
  supplies a short-lived connection credential through the hosting provider.
- The operator performing the release creates and verifies the backup without
  printing the connection string or storing it in the repository.
- Backup archives live in the provider's encrypted backup storage or another
  approved encrypted location. They never enter Git, `artifacts/` or application
  logs.

## Pre-migration checklist

1. Confirm the target host, database name and deployment environment.
2. Enable a maintenance window or pause writes when the migration changes or
   deletes existing records.
3. Record the application commit SHA and run `npx prisma migrate status` from
   `backend/`.
4. Create a provider snapshot when the database service supports it.
5. Create a portable PostgreSQL archive with `pg_dump` using custom format,
   `--no-owner` and `--no-privileges`.
6. Run `pg_restore --list` against the archive and confirm that the schema and
   expected tables are present.
7. Restore the archive into an isolated temporary database and run the backend
   health/build smoke checks against that database.
8. Record the backup timestamp, archive checksum and restore-test result in the
   private release record. Do not record secrets.

Example command shapes are shown below. Supply `DATABASE_URL` through the shell
environment or a secure provider command; never paste it into a committed file.

```text
pg_dump --format=custom --no-owner --no-privileges --file=<secure-backup-path> <DATABASE_URL>
pg_restore --list <secure-backup-path>
pg_restore --clean --if-exists --no-owner --no-privileges --dbname=<temporary-database-url> <secure-backup-path>
```

## Release and verification

1. Deploy the migration while the corresponding public feature flags remain
   disabled.
2. Run Prisma migration status and API health checks.
3. Verify record counts and the exact invariants documented by that phase.
4. Re-enable writes only after the checks pass.
5. Keep the backup for at least the release rollback window defined by the
   database provider or business policy.

## Rollback

1. Disable the affected feature flags and stop application writes.
2. Roll back the application to the recorded pre-migration commit.
3. Restore the verified archive or provider snapshot into a new database when
   possible; avoid overwriting the only production copy before validation.
4. Point the application at the restored database, run health checks and compare
   critical record counts.
5. Reopen traffic only after authentication, tests, attempts and profiles pass
   smoke verification.

If any backup, checksum or restore verification step fails, the destructive
migration is blocked until a fresh verified backup exists.
