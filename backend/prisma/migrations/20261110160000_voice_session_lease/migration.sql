ALTER TABLE "VoiceAllowanceSession"
  ADD COLUMN "clientId" TEXT,
  ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
