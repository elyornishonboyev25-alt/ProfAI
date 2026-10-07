const OWNER_EMAILS = new Set([
  'elyornishonboyev000@gmail.com',
  'firdavsalimqulov998@gmail.com',
])

export function hasOwnerAccess(email?: string | null): boolean {
  return Boolean(email && OWNER_EMAILS.has(email.trim().toLowerCase()))
}
