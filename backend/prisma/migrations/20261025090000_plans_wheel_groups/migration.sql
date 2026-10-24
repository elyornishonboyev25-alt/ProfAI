-- AlterTable
ALTER TABLE "PaymentRequest" ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PaymentRequest" ADD COLUMN "wheelSpinId" TEXT;

-- CreateTable
CREATE TABLE "FeatureUsage" (
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FeatureUsage_pkey" PRIMARY KEY ("userId","feature","period")
);
ALTER TABLE "FeatureUsage" ADD CONSTRAINT "FeatureUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ResourceUnlock" (
    "userId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceUnlock_pkey" PRIMARY KEY ("userId","resource","period")
);
ALTER TABLE "ResourceUnlock" ADD CONSTRAINT "ResourceUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "WheelBlock" (
    "id" TEXT NOT NULL,
    "slots" INTEGER[],
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WheelBlock_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WheelBlock_cursor_createdAt_idx" ON "WheelBlock"("cursor", "createdAt");

-- CreateTable
CREATE TABLE "WheelSpin" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "userId" TEXT,
    "percent" INTEGER NOT NULL,
    "blockId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "wonAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    CONSTRAINT "WheelSpin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WheelSpin_telegramId_key" ON "WheelSpin"("telegramId");
CREATE UNIQUE INDEX "WheelSpin_userId_key" ON "WheelSpin"("userId");
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PurchaseGroup" (
    "id" TEXT NOT NULL,
    "leaderTelegramId" TEXT NOT NULL,
    "leaderName" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COLLECTING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PurchaseGroup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PurchaseGroup_leaderTelegramId_status_idx" ON "PurchaseGroup"("leaderTelegramId", "status");

-- CreateTable
CREATE TABLE "PurchaseGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "telegramId" TEXT,
    "joinedAt" TIMESTAMP(3),
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PurchaseGroupMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PurchaseGroupMember_groupId_username_key" ON "PurchaseGroupMember"("groupId", "username");
CREATE INDEX "PurchaseGroupMember_username_idx" ON "PurchaseGroupMember"("username");
ALTER TABLE "PurchaseGroupMember" ADD CONSTRAINT "PurchaseGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PurchaseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
