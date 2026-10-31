# Learning levels

Levels use lifetime earned XP and are capped at 10. A weekly or monthly leaderboard still ranks period XP; its level badges use lifetime XP. Levels are calculated on the server from XP, including for accounts with an older cached level. Existing XP is preserved.

| Level | Lifetime XP required |
| --- | ---: |
| 1 | 0 |
| 2 | 100 |
| 3 | 300 |
| 4 | 750 |
| 5 | 1,500 |
| 6 | 3,000 |
| 7 | 5,000 |
| 8 | 8,000 |
| 9 | 13,000 |
| 10 | 20,200 |

The existing reward policies remain authoritative: completed test rewards depend on performance, vocabulary activities require their qualifying accuracy, and active study rewards are capped daily. Activity event keys prevent duplicate rewards. Opening a tab does not create unlimited XP. A level-up celebration requires a confirmed, nonduplicate reward crossing a milestone; loading a profile does not replay it. At level 10, XP continues accumulating and the progress meter stays complete.

Server milestones are in `backend/src/config/levelConfig.ts`; the display mirror is in `src/utils/learnerLevel.ts`. `scripts/tests/learning-experience-ui.tsx` verifies parity and boundary cases. This is an educational XP system inspired by numerical profile badges; Telegram's Stars rating is a separate, transaction-based system.

Speaking calls use live socket availability, not the approximate online indicator from learner search. Both parties must accept the invitation flow before entering a private voice room. Microphones start muted and are requested only when a learner chooses to speak. Permission, missing-device, busy-device and connection failures have separate recovery messages. Call cues respect browser audio restrictions and can be muted.
