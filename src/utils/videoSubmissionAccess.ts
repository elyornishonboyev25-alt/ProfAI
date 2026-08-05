type VideoSubmissionIdentity = {
  email?: string | null
  nickname?: string | null
} | null | undefined

// These aliases identify the three accounts authorised to grow the shared
// Podcast and Shadowing libraries. Keep this list aligned with the server-side
// allowlist, which is the security boundary for submissions.
const VIDEO_SUBMITTER_EMAILS = new Set([
  'elyornishonboyev000@gmail.com',
])

const VIDEO_SUBMITTER_NICKNAMES = new Set(['erkinov', 'firdavs'])

export function canSubmitCommunityVideo(identity: VideoSubmissionIdentity): boolean {
  if (!identity) return false

  const email = identity.email?.trim().toLowerCase()
  const nickname = identity.nickname?.trim().toLowerCase()

  return (
    Boolean(email && VIDEO_SUBMITTER_EMAILS.has(email)) ||
    Boolean(nickname && VIDEO_SUBMITTER_NICKNAMES.has(nickname))
  )
}
