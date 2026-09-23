/** Weekly API timestamps represent calendar days, not viewer-local instants. */
export function formatDashboardDay(value: string, language: string): string {
  const day = typeof value === 'string' ? value.match(/^\d{4}-\d{2}-\d{2}(?=T|$)/)?.[0] : undefined
  if (!day) return '—'
  const date = new Date(`${day}T12:00:00.000Z`)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'short', timeZone: 'UTC',
  }).format(date)
}

export function formatDashboardActivityDate(value: string, language: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short', day: 'numeric',
  }).format(date)
}
