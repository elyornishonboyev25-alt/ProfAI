-- CreateTable
CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestChars" INTEGER NOT NULL,
    "responseChars" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageEvent_userId_createdAt_idx" ON "AiUsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_purpose_createdAt_idx" ON "AiUsageEvent"("purpose", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_provider_status_createdAt_idx" ON "AiUsageEvent"("provider", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
