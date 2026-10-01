# Educational video libraries

The shared catalog is `backend/src/data/educationalMedia.json`. It contains exactly
100 shadowing lessons and 100 distinct podcast episodes, with 200 unique YouTube
IDs across the two sections. The frontend imports the same source as the API.

The shadowing selection includes BBC's dedicated pronunciation shadowing lessons
and VOA's teacher-led pronunciation, grammar and expression lessons. The podcast
selection includes 70 BBC listening programmes, 15 Think Fast, Talk Smart
communication episodes and 15 College Essay Guy admissions podcasts. SAT
foundations means language and comprehension practice supporting SAT study;
these materials are not official SAT practice tests. CEFR labels are learning
guidance, not a scored assessment or certification.

All 200 URLs and their embeddable oEmbed responses were checked against the
expected publishing channels on 2 October 2026. Titles, thumbnails, source links,
durations, topics and practice goals are explicit catalog data. This verifies the
public source and embed at that time; it does not guarantee future availability,
regional playback, advertising or external platform changes.

Both APIs serve only catalog IDs. Previous community submissions remain archived
in the database and are excluded from lists, detail routes and link submissions.
Keeping them archived preserves existing data without a destructive migration.
Adding content requires updating the reviewed catalog; arbitrary user links
cannot change it. No deployment-time seeding or YouTube API key is needed.

Shadowing opens immediately using teacher-led timed intervals with repeat,
speed and recording controls. A background request checks for real English
captions. When a synced transcript becomes available, the learner can choose to
switch to it. Timed intervals have time-range labels and are explicitly described
as practice intervals, never as sentence-aligned transcripts. Failed caption
downloads do not prevent practice. The backend uses the existing caption engine,
caches extracted cues, bounds caption/database waits and reuses concurrent work.

Podcast playback uses the source's embedded player independently of caption
extraction. Progress and bookmarks retain stable per-video IDs. The interface
offers search, actual level/topic filtering, 12-item pagination and localized
English, Uzbek and Russian navigation. The existing playback controls remain
available. Playback failures show a recovery message and the original source link.

Run `npm run test:educational-media` for catalog integrity, API allowlist and
frontend interaction checks. These tests isolate external caption extraction and
the database; they do not spend AI transcription credits or require production
credentials. Also run `npm run build` and `npm --prefix backend run build`.
