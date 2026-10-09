# Community speaking

`/community` includes a real-time speaking lobby and the existing student directory. Signed-in learners with a nickname can create Conversation, Debate or IELTS rooms with 2–8 seats, a topic, level and public/private visibility. All members initially join muted. Members can talk, raise a hand, choose a debate side and use the room chat. The host can remove participants; the next member becomes host if the host leaves.

An available public learner has a **Speak together** action on their student card. A private two-person room opens only after the recipient accepts the invitation. Invitations expire after one minute. Private rooms are omitted from the lobby and can be joined using their unguessable invitation URL. A room and its chat end when the last person leaves. Leaving, removal, socket disconnection and page unmount stop local microphone tracks.

The community socket uses `/ws/speaking`. Its `communityHello` authenticates the access token and loads the nickname/avatar/privacy from the account; browser-supplied names and IDs cannot override these. Voice signals stay within the joined room. Chat and signaling are bounded, sockets use ping/pong heartbeats, and capacity/moderation/invitation ownership are enforced by the server.

Live room state resides in the API process, matching the existing debate infrastructure. Run a single API instance for this version; an API restart ends live rooms. Multiple replicas require shared presence and signaling state before increasing replica count. Serve the frontend over HTTPS, proxy WebSocket upgrades to the API and configure the existing `VITE_WEBRTC_TURN_URL`, `VITE_WEBRTC_TURN_USERNAME` and `VITE_WEBRTC_TURN_CREDENTIAL` settings for networks that need a relay. The browser uses the existing STUN/TURN voice helper. No database migration or additional service is required for the lobby.

**Top learner today** is the global learner with the highest canonical `User.xp`, a nickname, positive XP and a public profile with leaderboard visibility. Missing profiles use the platform's existing public defaults. XP ties use streak, then earlier registration, then account ID. The winner includes the current viewer and is independent of searches/filters. It is recomputed on each profile search; the page refreshes every 30 seconds while visible and on focus, so an XP overtake can change the crown within the same day. It uses total earned XP, not XP earned only today, and creates no premium reward.

Verification:

- `npm --prefix backend run test:community`: authenticated room lifecycle, capacity, verified identities, signal isolation, room controls, private invitations, moderation, privacy and XP crown API checks.
- `npm --prefix backend run test:realtime`: existing debate, discussion, partner and room stats regression checks.
- `npm run test:community-browser`: two Chromium tabs connect actual WebRTC audio using fake microphone devices; checks creation/joining, mute, raised hands, debate sides, chat, accepted private invitations, microphone cleanup, student cards, champion refresh and layouts at 320–1440px. Requires the backend build and a Chromium browser (`COMMUNITY_TEST_BROWSER` can override the default Edge path). Setting `COMMUNITY_SCREENSHOTS=1` also exports screenshots to ignored `tmp/community-browser`.
