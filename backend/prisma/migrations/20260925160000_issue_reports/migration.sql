CREATE TABLE "IssueReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "pagePath" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IssueReport_userId_createdAt_idx" ON "IssueReport"("userId", "createdAt");
CREATE INDEX "IssueReport_status_createdAt_idx" ON "IssueReport"("status", "createdAt");
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
