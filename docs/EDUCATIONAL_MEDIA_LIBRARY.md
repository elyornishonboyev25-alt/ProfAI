# Educational video libraries

`backend/src/data/educationalMedia.json` is the catalog used by both the frontend
and API. It contains 22 shadowing clips and 300 podcast episodes with distinct
YouTube IDs. The shadowing sources themselves are 25–115 seconds long; their
lengths are not labels applied to longer lessons.

The shadowing catalog was checked against live YouTube player metadata on
4 October 2026: public playback, embeddability, actual duration, publishing
channel and an English caption track. Morgan Freeman's “What Makes a Good
Director” opens the list. Other speakers include Jim Carrey, Robert Downey Jr.,
Robert De Niro, Matthew McConaughey, Dwayne Johnson and Simon Sinek. Most clips
come from the American Film Institute, broadcasters or the speaker's own channel;
the Carrey and McConaughey entries are short video excerpts of their original
speeches, not generated voices. CEFR levels are practice guidance.

Only catalog IDs are accepted by the library APIs. Removed tutorial-style
shadowing entries are no longer listed or accepted through legacy deep links.
Saved database submissions stay archived. The separate podcast catalog is
unchanged. No deployment-time video seeding or YouTube API key is required.

Shadowing video runs continuously at 1x by default. Timed English captions build
12–18 second audio sections on existing speech boundaries, with a shorter final
section when necessary. Sections play once and do not auto-advance. If no safe
caption boundaries can be obtained, preview still works and the interface offers
caption retry rather than invented transcripts. Full-video practice and voice
recording remain available independently of caption download. Final practice starts
only when the learner chooses it. Center playback controls disappear after
1.5 seconds or a background tap; another tap or pointer movement reveals them
without pausing playback.

Voice recordings stay local until the learner clicks **Share recording**. That
button creates a durable recording and a `/shared/shadowing/:id` link. Recipients
need no login and see only the audio player and an optional original video,
without the workspace sidebar, mobile navigation or onboarding. Sharing again
reuses the same link; a new take has a new upload key. Native sharing falls back
to copying the link, with a selectable link field if clipboard access fails.

`ShadowingRecording` stores bounded audio bytes in PostgreSQL. Authenticated
uploads are throttled before their larger JSON body is parsed; the API validates
length, approved lesson, MIME/container and base64. Public metadata excludes
owner and account fields; public audio supports byte ranges for seeking. The
migration is `20261004160000_shadowing_recordings`. Production backend startup
already runs `prisma migrate deploy` before serving routes.

Run `npm run test:educational-media`, `npm run build` and
`npm --prefix backend run build`. The media suite isolates database and external
caption extraction while checking catalog integrity, library filters, playback,
record/share/retry behavior, public-page simplicity and audio range responses.
Live source verification does not guarantee future regional availability or
continued caption access from YouTube.
