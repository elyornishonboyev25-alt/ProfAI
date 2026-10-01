ALTER TYPE "SkillTrack" ADD VALUE IF NOT EXISTS 'IELTS_OVERALL';

-- The first SAT full-mock honor now starts at Tier 7. Preserve the stronger
-- existing Tier 7 record where a learner already earned both old tiers.
DELETE FROM "SkillBadge" AS old
WHERE old."track" = 'SAT_OVERALL' AND old."tier" = 6
  AND EXISTS (
    SELECT 1 FROM "SkillBadge" AS stronger
    WHERE stronger."userId" = old."userId"
      AND stronger."track" = 'SAT_OVERALL' AND stronger."tier" = 7
  );
UPDATE "SkillBadge" SET "tier" = 7
WHERE "track" = 'SAT_OVERALL' AND "tier" = 6;
