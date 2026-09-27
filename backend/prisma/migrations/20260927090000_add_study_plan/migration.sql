CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "roadmap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyPlanWeek" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "days" JSONB NOT NULL,
    "review" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudyPlanWeek_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudyPlan_userId_key" ON "StudyPlan"("userId");
CREATE UNIQUE INDEX "StudyPlanWeek_planId_weekStart_key" ON "StudyPlanWeek"("planId", "weekStart");
CREATE INDEX "StudyPlanWeek_planId_weekStart_idx" ON "StudyPlanWeek"("planId", "weekStart");
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyPlanWeek" ADD CONSTRAINT "StudyPlanWeek_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
