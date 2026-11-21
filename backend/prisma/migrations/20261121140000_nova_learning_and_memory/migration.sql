ALTER TABLE "AiMemory"
 ADD COLUMN "category" TEXT NOT NULL DEFAULT 'fact',
 ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'legacy',
 ADD COLUMN "sourceThreadId" TEXT,
 ADD COLUMN "sourceQuote" TEXT,
 ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1,
 ADD COLUMN "expiresAt" TIMESTAMP(3),
 ADD COLUMN "supersededAt" TIMESTAMP(3),
 ADD COLUMN "previousValues" JSONB;
CREATE TABLE "NovaSkillEvidence" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "sourceTurnId" TEXT NOT NULL, "sourceThreadId" TEXT,
 "topicKey" TEXT NOT NULL, "topic" TEXT NOT NULL, "quote" TEXT NOT NULL, "outcome" TEXT NOT NULL,
 "assistance" TEXT NOT NULL, "misconception" TEXT, "nextExercise" TEXT, "confidence" DOUBLE PRECISION NOT NULL,
 "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "NovaSkillEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NovaSkillEvidence_userId_sourceTurnId_topicKey_key" ON "NovaSkillEvidence"("userId", "sourceTurnId", "topicKey");
CREATE INDEX "NovaSkillEvidence_userId_observedAt_idx" ON "NovaSkillEvidence"("userId", "observedAt");
CREATE TABLE "NovaSessionDiagnostics" (
 "id" TEXT NOT NULL PRIMARY KEY, "sessionId" TEXT NOT NULL, "userId" TEXT NOT NULL, "side" TEXT NOT NULL,
 "provider" TEXT NOT NULL, "model" TEXT NOT NULL, "snapshot" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "NovaSessionDiagnostics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NovaSessionDiagnostics_sessionId_side_key" ON "NovaSessionDiagnostics"("sessionId", "side");
CREATE INDEX "NovaSessionDiagnostics_userId_updatedAt_idx" ON "NovaSessionDiagnostics"("userId", "updatedAt");
