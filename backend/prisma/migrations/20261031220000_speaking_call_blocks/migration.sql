CREATE TABLE "SpeakingCallBlock" (
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpeakingCallBlock_pkey" PRIMARY KEY ("blockerId", "blockedId")
);
CREATE INDEX "SpeakingCallBlock_blockedId_idx" ON "SpeakingCallBlock"("blockedId");
ALTER TABLE "SpeakingCallBlock" ADD CONSTRAINT "SpeakingCallBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpeakingCallBlock" ADD CONSTRAINT "SpeakingCallBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
