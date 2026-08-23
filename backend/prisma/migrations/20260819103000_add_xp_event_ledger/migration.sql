CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "metadata" JSONB,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "XpEvent_userId_eventKey_key" ON "XpEvent"("userId", "eventKey");
CREATE INDEX "XpEvent_userId_earnedAt_idx" ON "XpEvent"("userId", "earnedAt");
CREATE INDEX "XpEvent_source_earnedAt_idx" ON "XpEvent"("source", "earnedAt");

ALTER TABLE "XpEvent"
ADD CONSTRAINT "XpEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
