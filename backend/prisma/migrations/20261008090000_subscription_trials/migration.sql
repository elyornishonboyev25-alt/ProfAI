BEGIN;
CREATE TABLE "FreeTrial" (
  "email" TEXT PRIMARY KEY,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
-- Record even paid accounts as having used their welcome trial. Their paid access is unchanged.
-- Every existing non-premium account receives seven fresh days at migration time.
INSERT INTO "FreeTrial" ("email", "startsAt", "expiresAt")
SELECT LOWER(TRIM(u."email")), CURRENT_TIMESTAMP,
  CASE WHEN (
    (u."role" = 'ADMIN' OR LOWER(TRIM(u."email")) IN ('elyornishonboyev000@gmail.com','nishonboyv7@gmail.com','erkiinov09@gmail.com','assasinhnur2000@gmail.com')
      OR LOWER(TRIM(u."nickname")) IN ('firdavs','erkinov7','erkinov','ali'))
      AND NOT EXISTS (SELECT 1 FROM "PremiumGrant" g WHERE g."userId" = u."id" AND g."source" = 'SELECTED_ACCESS' AND g."plan" LIKE 'TRIAL_%')
    OR EXISTS (SELECT 1 FROM "PremiumGrant" g WHERE g."userId" = u."id" AND g."plan" NOT LIKE 'TRIAL_%' AND g."startsAt" <= CURRENT_TIMESTAMP AND (g."expiresAt" IS NULL OR g."expiresAt" > CURRENT_TIMESTAMP))
    OR EXISTS (SELECT 1 FROM "BillingSubscription" s WHERE s."userId" = u."id" AND s."startsAt" <= CURRENT_TIMESTAMP AND s."expiresAt" > CURRENT_TIMESTAMP)
  ) THEN CURRENT_TIMESTAMP ELSE CURRENT_TIMESTAMP + INTERVAL '7 days' END
FROM "User" u
ON CONFLICT ("email") DO NOTHING;
-- A database trigger covers password, verified email, Google and future signup paths.
CREATE FUNCTION record_welcome_trial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "FreeTrial" ("email", "startsAt", "expiresAt")
  VALUES (LOWER(TRIM(NEW."email")), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days')
  ON CONFLICT ("email") DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER user_welcome_trial AFTER INSERT ON "User"
FOR EACH ROW EXECUTE FUNCTION record_welcome_trial();
COMMIT;
