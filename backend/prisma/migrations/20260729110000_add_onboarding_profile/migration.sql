ALTER TABLE "UserProfile"
ADD COLUMN "gender" TEXT,
ADD COLUMN "gradeLevel" TEXT,
ADD COLUMN "targetCountries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "currentIeltsScore" DOUBLE PRECISION,
ADD COLUMN "targetIeltsScore" DOUBLE PRECISION,
ADD COLUMN "currentSatScore" INTEGER,
ADD COLUMN "targetSatScore" INTEGER,
ADD COLUMN "dailyStudyHours" INTEGER,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
