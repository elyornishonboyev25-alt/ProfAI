CREATE TABLE "PremiumEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originKey" TEXT,
    "source" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "months" INTEGER,
    "days" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "promoCode" TEXT,
    "giftRank" INTEGER,
    "discountPercent" INTEGER,
    "promoDiscountMinor" INTEGER,
    "wheelSpinId" TEXT,
    "currency" TEXT,
    "amountMinor" INTEGER,
    "method" TEXT,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "PremiumEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PremiumEvent_originKey_key" ON "PremiumEvent"("originKey");
CREATE INDEX "PremiumEvent_userId_createdAt_idx" ON "PremiumEvent"("userId", "createdAt");
ALTER TABLE "PremiumEvent" ADD CONSTRAINT "PremiumEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRequest" ADD COLUMN "promoDiscountMinor" INTEGER;
