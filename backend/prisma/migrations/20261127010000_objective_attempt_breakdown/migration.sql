-- Keep IELTS part marks on the original attempt; old rows remain readable.
ALTER TABLE "TestAttempt" ADD COLUMN "breakdown" JSONB;
