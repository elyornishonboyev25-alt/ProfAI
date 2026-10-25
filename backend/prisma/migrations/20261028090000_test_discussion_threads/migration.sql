-- Threaded replies and "helpful" checks on test discussion posts.
ALTER TABLE "TestDiscussionPost" ADD COLUMN "parentId" TEXT;

CREATE INDEX "TestDiscussionPost_parentId_createdAt_idx" ON "TestDiscussionPost"("parentId", "createdAt");

ALTER TABLE "TestDiscussionPost" ADD CONSTRAINT "TestDiscussionPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TestDiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TestDiscussionCheck" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestDiscussionCheck_pkey" PRIMARY KEY ("postId","userId")
);

CREATE INDEX "TestDiscussionCheck_userId_idx" ON "TestDiscussionCheck"("userId");

ALTER TABLE "TestDiscussionCheck" ADD CONSTRAINT "TestDiscussionCheck_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TestDiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestDiscussionCheck" ADD CONSTRAINT "TestDiscussionCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
