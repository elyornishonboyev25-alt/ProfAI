const OWNER_EMAILS = new Set([
  'elyornishonboyev000@gmail.com',
  'firdavsalimqulov998@gmail.com',
])

// Keep aligned with the server's owner middleware, which authorizes requests
// using the signed-in account's saved identity.
const OWNER_NICKNAMES = new Set(['erkinov'])

export function hasOwnerAccess(email?: string | null, nickname?: string | null): boolean {
  return Boolean(
    (email && OWNER_EMAILS.has(email.trim().toLowerCase())) ||
    (nickname && OWNER_NICKNAMES.has(nickname.trim().toLowerCase())),
  )
}
