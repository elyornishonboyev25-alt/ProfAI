type VideoSubmissionIdentity = {
  email: string
  nickname?: string | null
}

// These aliases identify the same three accounts as the client-side allowlist.
// This server-side check is authoritative; hiding the form is only a UX layer.
const VIDEO_SUBMITTER_EMAILS = new Set([
  'elyornishonboyev000@gmail.com',
])

const VIDEO_SUBMITTER_NICKNAMES = new Set(['erkinov', 'firdavs'])

export function canSubmitCommunityVideo(identity: VideoSubmissionIdentity): boolean {
  const email = identity.email.trim().toLowerCase()
  const nickname = identity.nickname?.trim().toLowerCase()

  return VIDEO_SUBMITTER_EMAILS.has(email) || Boolean(nickname && VIDEO_SUBMITTER_NICKNAMES.has(nickname))
}
