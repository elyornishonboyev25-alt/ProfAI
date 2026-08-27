-- DESTRUCTIVE MIGRATION
-- A verified production snapshot and restore test are required before deploy.
-- This removes legacy School/Olympiad tests and their dependent attempt data.

-- AttemptAnswer has a RESTRICT relation to TestQuestion, so remove legacy
-- answers explicitly before the parent Test cascade runs.
DELETE FROM "AttemptAnswer"
WHERE "questionId" IN (
  SELECT "TestQuestion"."id"
  FROM "TestQuestion"
  INNER JOIN "Test" ON "Test"."id" = "TestQuestion"."testId"
  WHERE "Test"."category" IN ('SCHOOL', 'OLYMPIAD')
     OR "Test"."difficulty" = 'OLYMPIAD'
);

-- TestAttempt, TestQuestion and TestOption are removed by their cascade
-- relations. User XP is intentionally not recalculated retroactively.
DELETE FROM "Test"
WHERE "category" IN ('SCHOOL', 'OLYMPIAD')
   OR "difficulty" = 'OLYMPIAD';

DELETE FROM "Achievement" WHERE "slug" = 'olympiad_master';
DELETE FROM "LeaderboardState" WHERE "categoryKey" IN ('SCHOOL', 'OLYMPIAD');

-- PostgreSQL cannot drop individual enum values, so rebuild both enums after
-- every row containing a retired value has been removed.
CREATE TYPE "TestCategory_new" AS ENUM ('SAT', 'IELTS');
ALTER TABLE "Test"
  ALTER COLUMN "category" TYPE "TestCategory_new"
  USING ("category"::text::"TestCategory_new");
DROP TYPE "TestCategory";
ALTER TYPE "TestCategory_new" RENAME TO "TestCategory";

CREATE TYPE "Difficulty_new" AS ENUM ('EASY', 'MEDIUM', 'HARD');
ALTER TABLE "Test"
  ALTER COLUMN "difficulty" TYPE "Difficulty_new"
  USING ("difficulty"::text::"Difficulty_new");
DROP TYPE "Difficulty";
ALTER TYPE "Difficulty_new" RENAME TO "Difficulty";
