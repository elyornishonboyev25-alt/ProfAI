-- Exact account grants requested by the owner. No other accounts are modified.
BEGIN;
INSERT INTO "PremiumGrant" ("userId", "plan", "source", "startsAt", "expiresAt", "createdAt", "updatedAt")
SELECT "id", 'UNLIMITED', 'SELECTED_ACCESS', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" WHERE LOWER("email") IN (
  'aysunabbaszad0@gmail.com', 'oguzmemmedli123@gmail.com',
  'wiynsara@gmail.com', 'bahadyrazat@gmail.com'
)
ON CONFLICT ("userId") DO UPDATE SET "plan" = 'UNLIMITED', "source" = 'SELECTED_ACCESS',
  "startsAt" = CURRENT_TIMESTAMP, "expiresAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "PremiumGrant" ("userId", "plan", "source", "startsAt", "expiresAt", "createdAt", "updatedAt")
SELECT "id", 'TRIAL_14', 'SELECTED_ACCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" WHERE LOWER("email") = 'usarovajasmin@gmail.com'
ON CONFLICT ("userId") DO UPDATE SET "plan" = 'TRIAL_14', "source" = 'SELECTED_ACCESS',
  "startsAt" = CURRENT_TIMESTAMP, "expiresAt" = CURRENT_TIMESTAMP + INTERVAL '14 days', "updatedAt" = CURRENT_TIMESTAMP
WHERE "PremiumGrant"."plan" <> 'TRIAL_14' OR "PremiumGrant"."source" <> 'SELECTED_ACCESS';
COMMIT;
