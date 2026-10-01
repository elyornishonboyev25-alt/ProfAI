CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "exam" TEXT NOT NULL DEFAULT 'IELTS',
  "rating" INTEGER,
  "bandBefore" TEXT,
  "bandAfter" TEXT,
  "text" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Review" ALTER COLUMN "rating" DROP DEFAULT;
ALTER TABLE "Review" ALTER COLUMN "rating" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Review_approved_createdAt_idx" ON "Review"("approved", "createdAt");
