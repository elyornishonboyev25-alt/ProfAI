CREATE TABLE "SharedResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptKey" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "testTitle" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL,
    "bandScore" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "incorrectAnswers" INTEGER NOT NULL,
    "skippedAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "timeSpentSec" INTEGER NOT NULL,
    "sectionSummaries" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SharedResult_userId_attemptKey_key" ON "SharedResult"("userId", "attemptKey");
CREATE INDEX "SharedResult_createdAt_idx" ON "SharedResult"("createdAt");

ALTER TABLE "SharedResult"
ADD CONSTRAINT "SharedResult_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
