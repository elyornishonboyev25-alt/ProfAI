-- Preserve existing published reviews; all future submissions need owner approval.
ALTER TABLE "Review" ALTER COLUMN "approved" SET DEFAULT false;
