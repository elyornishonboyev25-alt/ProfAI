ALTER TABLE "PaymentRequest" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'UZS', ADD COLUMN "amountMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "coins" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "months" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "audience" TEXT,
ADD COLUMN "providerId" TEXT, ADD COLUMN "providerTime" BIGINT, ADD COLUMN "preparedAt" TIMESTAMP(3), ADD COLUMN "performedAt" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3), ADD COLUMN "cancelReason" INTEGER, ADD COLUMN "checkoutUrl" TEXT;
UPDATE "PaymentRequest" SET "amountMinor" = "amountUzs" * 100;
CREATE UNIQUE INDEX "PaymentRequest_providerId_key" ON "PaymentRequest"("providerId");
ALTER TABLE "PaymentRequest" ADD COLUMN "providerSequence" SERIAL NOT NULL;
CREATE UNIQUE INDEX "PaymentRequest_providerSequence_key" ON "PaymentRequest"("providerSequence");
DROP INDEX "PaymentRequest_one_open_per_user_idx";
CREATE UNIQUE INDEX "PaymentRequest_one_open_per_user_idx" ON "PaymentRequest"("userId") WHERE "status" IN ('PENDING', 'SUBMITTED', 'PROCESSING');
CREATE TABLE "CoinWallet" ("userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
"balance" INTEGER NOT NULL DEFAULT 0 CHECK ("balance" >= 0), "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "CoinEntry" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
"key" TEXT NOT NULL UNIQUE, "amount" INTEGER NOT NULL, "reason" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "CoinEntry_userId_createdAt_idx" ON "CoinEntry"("userId", "createdAt");
CREATE TABLE "CoinAccess" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
"resource" TEXT NOT NULL, "feature" TEXT NOT NULL, "expiresAt" TIMESTAMP(3), "writingLeft" INTEGER NOT NULL DEFAULT 0,
"speakingLeft" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "CoinAccess_userId_resource_key" ON "CoinAccess"("userId", "resource");
CREATE INDEX "CoinAccess_userId_expiresAt_idx" ON "CoinAccess"("userId", "expiresAt");
CREATE TABLE "BillingSubscription" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
"audience" TEXT NOT NULL, "plan" TEXT NOT NULL, "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"expiresAt" TIMESTAMP(3) NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "BillingSubscription_userId_audience_key" ON "BillingSubscription"("userId", "audience");
