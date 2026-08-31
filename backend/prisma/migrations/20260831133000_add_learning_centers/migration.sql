CREATE TYPE "LearningCenterRole" AS ENUM ('OWNER', 'ADMIN', 'TEACHER', 'STUDENT');
CREATE TYPE "LearningCenterMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');
CREATE TYPE "LearningCenterExamTrack" AS ENUM ('IELTS', 'SAT', 'BOTH');
CREATE TYPE "LearningAssignmentKind" AS ENUM ('TEST', 'PRACTICE', 'WRITING', 'SPEAKING', 'VOCABULARY');
CREATE TYPE "LearningSubmissionStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "LearningCenter" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logoUrl" TEXT,
  "city" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Tashkent',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningCenter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningCenterMember" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "LearningCenterRole" NOT NULL,
  "status" "LearningCenterMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "title" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningCenterMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningCenterGroup" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "examTrack" "LearningCenterExamTrack" NOT NULL,
  "teacherId" TEXT,
  "targetScore" TEXT,
  "schedule" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningCenterGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningCenterGroupMember" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningCenterGroupMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningCenterInvitation" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "groupId" TEXT,
  "invitedById" TEXT NOT NULL,
  "email" TEXT,
  "code" TEXT NOT NULL,
  "role" "LearningCenterRole" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningCenterInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentResult" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examType" "TestCategory" NOT NULL,
  "skill" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "maxScore" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION,
  "durationSec" INTEGER NOT NULL DEFAULT 0,
  "breakdown" JSONB,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningCenterAssignment" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "groupId" TEXT,
  "studentId" TEXT,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "kind" "LearningAssignmentKind" NOT NULL,
  "examTrack" "LearningCenterExamTrack" NOT NULL,
  "routePath" TEXT NOT NULL,
  "targetScore" TEXT,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningCenterAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningCenterAssignmentSubmission" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "resultId" TEXT,
  "status" "LearningSubmissionStatus" NOT NULL DEFAULT 'ASSIGNED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningCenterAssignmentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningCenterTeacherNote" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningCenterTeacherNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearningCenter_slug_key" ON "LearningCenter"("slug");
CREATE INDEX "LearningCenter_createdById_idx" ON "LearningCenter"("createdById");
CREATE INDEX "LearningCenter_createdAt_idx" ON "LearningCenter"("createdAt");
CREATE UNIQUE INDEX "LearningCenterMember_centerId_userId_key" ON "LearningCenterMember"("centerId", "userId");
CREATE INDEX "LearningCenterMember_centerId_role_status_idx" ON "LearningCenterMember"("centerId", "role", "status");
CREATE INDEX "LearningCenterMember_userId_status_idx" ON "LearningCenterMember"("userId", "status");
CREATE UNIQUE INDEX "LearningCenterGroup_centerId_name_key" ON "LearningCenterGroup"("centerId", "name");
CREATE INDEX "LearningCenterGroup_centerId_examTrack_archivedAt_idx" ON "LearningCenterGroup"("centerId", "examTrack", "archivedAt");
CREATE INDEX "LearningCenterGroup_teacherId_idx" ON "LearningCenterGroup"("teacherId");
CREATE UNIQUE INDEX "LearningCenterGroupMember_groupId_memberId_key" ON "LearningCenterGroupMember"("groupId", "memberId");
CREATE INDEX "LearningCenterGroupMember_memberId_idx" ON "LearningCenterGroupMember"("memberId");
CREATE UNIQUE INDEX "LearningCenterInvitation_code_key" ON "LearningCenterInvitation"("code");
CREATE INDEX "LearningCenterInvitation_centerId_role_expiresAt_idx" ON "LearningCenterInvitation"("centerId", "role", "expiresAt");
CREATE INDEX "LearningCenterInvitation_email_expiresAt_idx" ON "LearningCenterInvitation"("email", "expiresAt");
CREATE UNIQUE INDEX "AssessmentResult_userId_sourceKey_key" ON "AssessmentResult"("userId", "sourceKey");
CREATE INDEX "AssessmentResult_userId_examType_completedAt_idx" ON "AssessmentResult"("userId", "examType", "completedAt");
CREATE INDEX "AssessmentResult_skill_completedAt_idx" ON "AssessmentResult"("skill", "completedAt");
CREATE INDEX "LearningCenterAssignment_centerId_dueAt_archivedAt_idx" ON "LearningCenterAssignment"("centerId", "dueAt", "archivedAt");
CREATE INDEX "LearningCenterAssignment_groupId_dueAt_idx" ON "LearningCenterAssignment"("groupId", "dueAt");
CREATE INDEX "LearningCenterAssignment_studentId_dueAt_idx" ON "LearningCenterAssignment"("studentId", "dueAt");
CREATE UNIQUE INDEX "LearningCenterAssignmentSubmission_assignmentId_studentId_key" ON "LearningCenterAssignmentSubmission"("assignmentId", "studentId");
CREATE INDEX "LearningCenterAssignmentSubmission_studentId_status_updatedAt_idx" ON "LearningCenterAssignmentSubmission"("studentId", "status", "updatedAt");
CREATE INDEX "LearningCenterAssignmentSubmission_resultId_idx" ON "LearningCenterAssignmentSubmission"("resultId");
CREATE INDEX "LearningCenterTeacherNote_centerId_studentId_createdAt_idx" ON "LearningCenterTeacherNote"("centerId", "studentId", "createdAt");
CREATE INDEX "LearningCenterTeacherNote_authorId_createdAt_idx" ON "LearningCenterTeacherNote"("authorId", "createdAt");

ALTER TABLE "LearningCenter" ADD CONSTRAINT "LearningCenter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningCenterMember" ADD CONSTRAINT "LearningCenterMember_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "LearningCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterMember" ADD CONSTRAINT "LearningCenterMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterGroup" ADD CONSTRAINT "LearningCenterGroup_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "LearningCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterGroup" ADD CONSTRAINT "LearningCenterGroup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningCenterGroupMember" ADD CONSTRAINT "LearningCenterGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LearningCenterGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterGroupMember" ADD CONSTRAINT "LearningCenterGroupMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LearningCenterMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterInvitation" ADD CONSTRAINT "LearningCenterInvitation_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "LearningCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterInvitation" ADD CONSTRAINT "LearningCenterInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LearningCenterGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningCenterInvitation" ADD CONSTRAINT "LearningCenterInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterAssignment" ADD CONSTRAINT "LearningCenterAssignment_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "LearningCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterAssignment" ADD CONSTRAINT "LearningCenterAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LearningCenterGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningCenterAssignment" ADD CONSTRAINT "LearningCenterAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningCenterAssignment" ADD CONSTRAINT "LearningCenterAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningCenterAssignmentSubmission" ADD CONSTRAINT "LearningCenterAssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "LearningCenterAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterAssignmentSubmission" ADD CONSTRAINT "LearningCenterAssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterAssignmentSubmission" ADD CONSTRAINT "LearningCenterAssignmentSubmission_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "AssessmentResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningCenterTeacherNote" ADD CONSTRAINT "LearningCenterTeacherNote_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "LearningCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterTeacherNote" ADD CONSTRAINT "LearningCenterTeacherNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningCenterTeacherNote" ADD CONSTRAINT "LearningCenterTeacherNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
