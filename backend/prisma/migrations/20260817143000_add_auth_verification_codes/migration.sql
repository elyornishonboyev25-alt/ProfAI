CREATE TABLE "AuthVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthVerificationCode_email_purpose_createdAt_idx"
ON "AuthVerificationCode"("email", "purpose", "createdAt");

CREATE INDEX "AuthVerificationCode_expiresAt_idx"
ON "AuthVerificationCode"("expiresAt");
