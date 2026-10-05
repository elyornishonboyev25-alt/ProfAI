CREATE TABLE "ShadowingRecording" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recordingKey" TEXT NOT NULL,
  "youtubeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "durationSec" DOUBLE PRECISION NOT NULL,
  "audio" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShadowingRecording_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShadowingRecording_userId_recordingKey_key" ON "ShadowingRecording"("userId", "recordingKey");
ALTER TABLE "ShadowingRecording" ADD CONSTRAINT "ShadowingRecording_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
