-- Launch gift: one month of Pro for the first 1,000 accounts.
CREATE TABLE "LaunchGift" (
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "extended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaunchGift_pkey" PRIMARY KEY ("userId")
);

CREATE UNIQUE INDEX "LaunchGift_rank_key" ON "LaunchGift"("rank");

ALTER TABLE "LaunchGift" ADD CONSTRAINT "LaunchGift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everyone who already has an account is part of the campaign, numbered by sign-up order.
INSERT INTO "LaunchGift" ("userId", "rank")
SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") FROM "User";
