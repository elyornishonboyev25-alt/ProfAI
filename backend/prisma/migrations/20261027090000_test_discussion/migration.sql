-- Per-test discussion threads on the result pages.
CREATE TABLE "TestDiscussionPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exam" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionRef" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDiscussionPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TestDiscussionPost_exam_testId_createdAt_idx" ON "TestDiscussionPost"("exam", "testId", "createdAt");
CREATE INDEX "TestDiscussionPost_userId_idx" ON "TestDiscussionPost"("userId");

ALTER TABLE "TestDiscussionPost" ADD CONSTRAINT "TestDiscussionPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
