-- Independent shared podcast library. Caption chunks power the synced
-- transcript in the listening player without mixing podcast submissions into
-- the shadowing practice catalog.
CREATE TABLE "PodcastVideo" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'Intermediate',
    "accent" TEXT,
    "topic" TEXT,
    "captionKind" TEXT NOT NULL DEFAULT 'auto',
    "language" TEXT NOT NULL DEFAULT 'en',
    "segmentCount" INTEGER NOT NULL DEFAULT 0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PodcastVideo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PodcastSegment" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "startSec" DOUBLE PRECISION NOT NULL,
    "endSec" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "PodcastSegment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PodcastVideo_youtubeId_key" ON "PodcastVideo"("youtubeId");
CREATE INDEX "PodcastVideo_createdAt_idx" ON "PodcastVideo"("createdAt");
CREATE INDEX "PodcastVideo_level_idx" ON "PodcastVideo"("level");
CREATE UNIQUE INDEX "PodcastSegment_videoId_orderIndex_key" ON "PodcastSegment"("videoId", "orderIndex");
CREATE INDEX "PodcastSegment_videoId_orderIndex_idx" ON "PodcastSegment"("videoId", "orderIndex");

ALTER TABLE "PodcastVideo" ADD CONSTRAINT "PodcastVideo_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PodcastSegment" ADD CONSTRAINT "PodcastSegment_videoId_fkey"
  FOREIGN KEY ("videoId") REFERENCES "PodcastVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
