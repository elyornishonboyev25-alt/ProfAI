CREATE TABLE "WritingSubmission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "result" JSONB,
  "checkpoint" JSONB,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseUntil" TIMESTAMP(3),
  "lockToken" TEXT,
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "WritingSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WritingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WritingSubmission_userId_fingerprint_key" ON "WritingSubmission"("userId", "fingerprint");
CREATE INDEX "WritingSubmission_status_nextAttemptAt_idx" ON "WritingSubmission"("status", "nextAttemptAt");
CREATE INDEX "WritingSubmission_leaseUntil_idx" ON "WritingSubmission"("leaseUntil");
