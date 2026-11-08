ALTER TABLE "IssueReport"
  ADD COLUMN "needsReply" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "IssueReportMessage" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "authorId" TEXT,
  "authorName" TEXT,
  "authorEmail" TEXT,
  "title" TEXT,
  "message" TEXT NOT NULL,
  "notificationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IssueReportMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IssueReportMessage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "IssueReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve every existing reply. Older notifications did not record an author;
-- leave those snapshots empty instead of attributing them to the wrong admin.
INSERT INTO "IssueReportMessage" ("id", "reportId", "kind", "title", "message", "notificationId", "createdAt")
SELECT 'legacy_' || n."id" || '_' || r."id", r."id", 'ADMIN_REPLY', n."title", n."message", n."id", n."createdAt"
FROM "Notification" n
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(n."metadata"->'reportIds') = 'array' THEN n."metadata"->'reportIds' ELSE '[]'::jsonb END
) AS linked("reportId")
JOIN "IssueReport" r ON r."id" = linked."reportId" AND r."userId" = n."userId"
WHERE n."metadata"->>'kind' = 'ISSUE_REPORT_REPLY'
ON CONFLICT DO NOTHING;

UPDATE "IssueReport" r SET
  "needsReply" = NOT EXISTS (SELECT 1 FROM "IssueReportMessage" m WHERE m."reportId" = r."id"),
  "lastActivityAt" = COALESCE((SELECT MAX(m."createdAt") FROM "IssueReportMessage" m WHERE m."reportId" = r."id"), r."createdAt");

CREATE INDEX "IssueReport_needsReply_lastActivityAt_idx" ON "IssueReport"("needsReply", "lastActivityAt");
CREATE INDEX "IssueReportMessage_reportId_createdAt_id_idx" ON "IssueReportMessage"("reportId", "createdAt", "id");
