BEGIN;

CREATE TABLE "CampaignRedemption" (
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignRedemption_pkey" PRIMARY KEY ("userId", "code"),
    CONSTRAINT "CampaignRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Existing invitations and redeemed personal codes must receive the same extra
-- three months as future redemptions. Expired access starts afresh today.
DO $$
DECLARE
    recipient RECORD;
    gift RECORD;
    reward_start TIMESTAMP(3);
    reward_end TIMESTAMP(3);
    now_utc TIMESTAMP(3) := CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
    permanent BOOLEAN;
BEGIN
    FOR recipient IN
        SELECT DISTINCT u."id", u."email", u."nickname", u."role"
        FROM "User" u
        WHERE EXISTS (
            SELECT 1 FROM "Referral" r JOIN "User" inviter ON inviter."id" = r."inviterId"
            WHERE r."inviteeId" = u."id"
              AND REGEXP_REPLACE(UPPER(inviter."referralCode"), '[^A-Z0-9]', '', 'g') = 'FIRDAVSS7'
        ) OR EXISTS (
            SELECT 1 FROM "PromoCode" p WHERE p."userId" = u."id" AND p."redeemedAt" IS NOT NULL
              AND REGEXP_REPLACE(UPPER(p."code"), '[^A-Z0-9]', '', 'g') = 'FIRDAVSS7'
        )
    LOOP
        PERFORM pg_advisory_xact_lock(hashtextextended('billing:' || recipient."id", 0));
        IF EXISTS (SELECT 1 FROM "CampaignRedemption" WHERE "userId" = recipient."id" AND "code" = 'FIRDAVSS7') THEN
            CONTINUE;
        END IF;

        SELECT GREATEST(now_utc,
            (SELECT MAX("expiresAt") FROM "BillingSubscription" WHERE "userId" = recipient."id"),
            (SELECT "expiresAt" FROM "PremiumGrant" WHERE "userId" = recipient."id" AND "plan" NOT LIKE 'TRIAL\_%' ESCAPE '\')
        ) INTO reward_start;

        -- Match launch-gift claiming: unlimited accounts keep their access, and
        -- a reserved but unclaimed gift goes before the campaign reward.
        permanent := (
            (recipient."role" = 'ADMIN'
                OR LOWER(TRIM(recipient."email")) IN ('elyornishonboyev000@gmail.com', 'nishonboyv7@gmail.com', 'erkiinov09@gmail.com', 'assasinhnur2000@gmail.com')
                OR COALESCE(LOWER(TRIM(recipient."nickname")) IN ('firdavs', 'erkinov7', 'erkinov', 'ali'), FALSE))
            AND NOT EXISTS (SELECT 1 FROM "PremiumGrant" WHERE "userId" = recipient."id" AND "source" = 'SELECTED_ACCESS' AND "plan" LIKE 'TRIAL\_%' ESCAPE '\')
        ) OR EXISTS (
            SELECT 1 FROM "PremiumGrant" WHERE "userId" = recipient."id" AND "plan" NOT LIKE 'TRIAL\_%' ESCAPE '\'
              AND "startsAt" <= now_utc AND "expiresAt" IS NULL
        );

        SELECT * INTO gift FROM "LaunchGift" WHERE "userId" = recipient."id";
        IF FOUND AND gift."claimedAt" IS NULL THEN
            IF permanent THEN
                UPDATE "LaunchGift" SET "claimedAt" = now_utc, "extended" = TRUE WHERE "userId" = recipient."id";
            ELSE
                reward_end := reward_start + INTERVAL '1 month';
                INSERT INTO "BillingSubscription" ("id", "userId", "audience", "plan", "startsAt", "expiresAt", "updatedAt")
                VALUES ('launch-firdavss7-' || recipient."id", recipient."id", 'PRO', 'PRO_1', reward_start, reward_end, now_utc)
                ON CONFLICT ("userId", "audience") DO UPDATE SET
                    "startsAt" = CASE WHEN "BillingSubscription"."expiresAt" > now_utc THEN "BillingSubscription"."startsAt" ELSE EXCLUDED."startsAt" END,
                    "plan" = CASE WHEN "BillingSubscription"."expiresAt" > now_utc THEN "BillingSubscription"."plan" ELSE EXCLUDED."plan" END,
                    "expiresAt" = EXCLUDED."expiresAt", "updatedAt" = now_utc;
                UPDATE "LaunchGift" SET "claimedAt" = now_utc, "expiresAt" = reward_end, "extended" = reward_start > now_utc
                WHERE "userId" = recipient."id";
                reward_start := reward_end;
            END IF;
        END IF;

        reward_end := reward_start + INTERVAL '3 months';
        INSERT INTO "BillingSubscription" ("id", "userId", "audience", "plan", "startsAt", "expiresAt", "updatedAt")
        VALUES ('campaign-firdavss7-' || recipient."id", recipient."id", 'PRO', 'PRO_3', reward_start, reward_end, now_utc)
        ON CONFLICT ("userId", "audience") DO UPDATE SET
            "startsAt" = CASE WHEN "BillingSubscription"."expiresAt" > now_utc THEN "BillingSubscription"."startsAt" ELSE EXCLUDED."startsAt" END,
            "plan" = CASE WHEN "BillingSubscription"."expiresAt" > now_utc THEN "BillingSubscription"."plan" ELSE EXCLUDED."plan" END,
            "expiresAt" = EXCLUDED."expiresAt", "updatedAt" = now_utc;
        INSERT INTO "CampaignRedemption" ("userId", "code", "months", "startsAt", "expiresAt", "createdAt")
        VALUES (recipient."id", 'FIRDAVSS7', 3, reward_start, reward_end, now_utc);
    END LOOP;
END $$;

COMMIT;
