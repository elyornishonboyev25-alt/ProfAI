-- CreateTable
CREATE TABLE "TelegramChat" (
    "chatId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramChat_pkey" PRIMARY KEY ("chatId")
);
