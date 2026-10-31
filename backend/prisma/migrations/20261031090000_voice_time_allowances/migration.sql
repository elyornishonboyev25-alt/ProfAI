CREATE TABLE "VoiceAllowanceSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerCallId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "month" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "reservedSeconds" INTEGER NOT NULL,
  "metered" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "VoiceAllowanceSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VoiceAllowanceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VoiceAllowanceSession_userId_endedAt_expiresAt_idx" ON "VoiceAllowanceSession"("userId", "endedAt", "expiresAt");
-- Previous voice counters counted sessions, not seconds. Keep them as history.
UPDATE "FeatureUsage" SET "feature" = 'voice_legacy_sessions' WHERE "feature" = 'voice';
