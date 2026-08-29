CREATE TABLE "GuestDiagnostic" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "answers" JSONB NOT NULL,
  "result" JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "claimedAt" TIMESTAMP(3),
  "claimedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuestDiagnostic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestDiagnostic_tokenHash_key" ON "GuestDiagnostic"("tokenHash");
CREATE INDEX "GuestDiagnostic_expiresAt_idx" ON "GuestDiagnostic"("expiresAt");
CREATE INDEX "GuestDiagnostic_claimedById_claimedAt_idx" ON "GuestDiagnostic"("claimedById", "claimedAt");

ALTER TABLE "GuestDiagnostic"
  ADD CONSTRAINT "GuestDiagnostic_claimedById_fkey"
  FOREIGN KEY ("claimedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
