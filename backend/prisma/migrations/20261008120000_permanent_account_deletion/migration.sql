-- Remove personal diagnostics left behind by the previous SetNull behavior.
DELETE FROM "GuestDiagnostic" WHERE "claimedById" IS NULL AND "claimedAt" IS NOT NULL;

ALTER TABLE "GuestDiagnostic" DROP CONSTRAINT "GuestDiagnostic_claimedById_fkey";
ALTER TABLE "GuestDiagnostic" ADD CONSTRAINT "GuestDiagnostic_claimedById_fkey"
  FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Email-keyed records were not covered by user cascades. Keep unconsumed
-- registration challenges for people who have not created an account yet.
DELETE FROM "AuthVerificationCode" AS code
WHERE (code."consumedAt" IS NOT NULL OR code."purpose" <> 'REGISTER')
  AND NOT EXISTS (SELECT 1 FROM "User" AS account WHERE lower(account."email") = lower(code."email"));
DELETE FROM "FreeTrial" AS trial
WHERE NOT EXISTS (SELECT 1 FROM "User" AS account WHERE lower(account."email") = lower(trial."email"));
