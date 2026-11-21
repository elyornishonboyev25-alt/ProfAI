import type { NovaPerformance } from './novaPersona.js'
export const roastOpenings = { ahmoq: 'E, sen ahmoq…', tvar: 'E, sen tvar…', chumo: 'E, sen Chumo…', dalbayop: 'E, sen dalbayop, nima deyapsan?', ahmoqcha: 'Ha, ahmoqcha…', sasiqcha: 'Voy, sasiqcha…', dabba: 'E, dabba…' } as const
type Preferences = { banter?: 'off' | 'light' | 'sharp'; adultConfirmed?: boolean; roastPhrase?: keyof typeof roastOpenings }
export function banterOpening(preferences: Preferences, performance: NovaPerformance, learnerMessage: string, examiner = false) {
  if (examiner || !preferences.banter || preferences.banter === 'off' || performance.expression !== 'playful_angry') return null
  if (/to['‘’ʻ]?xta|jiddiy\s+(?:gapir|bo'l)|bunday\s+(?:de|gapir)|hazillashma|tushunmadim|uddalay\s+olmay|qiynal|stop|be serious|don't call|do not call|не называй|хватит|серь[её]зно|не понимаю/iu.test(learnerMessage)) return null
  const phrase = preferences.banter === 'sharp' && preferences.adultConfirmed ? preferences.roastPhrase ?? 'ahmoq' : 'ahmoq'
  return roastOpenings[phrase]
}

export function isBanterBoundary(text: string) { return /to['‘’ʻ]?xta|\bjiddiy\b|bunday.{0,24}(?:dema|gapir|murojaat)|hazillashma|stop|be serious|don.t call|do not call|не называй|хватит/iu.test(text) }
