import { useSpeakingStore } from '@/store/speakingStore'
import type { SpeakingEvaluation, ExaminerTurn } from '@/services/speakingAI'
import { accountStorageFor } from './accountStorage'
import { getCompletedSpeakingTestIds, getIeltsSpeakingDayCatalog, getSpeakingCompletionDates, type SpeakingDayEntry } from './ieltsSpeakingCatalog'

export function saveSpeakingDayHistory(owner: string, day: SpeakingDayEntry, result: SpeakingEvaluation, transcript: ExaminerTurn[], attemptKey: string, date?: string) {
  if (result.source !== 'ai' || !result.stats || useSpeakingStore.getState().sessions.some(item => item.userId === (owner === 'guest' ? null : owner) && item.attemptKey === attemptKey)) return
  useSpeakingStore.getState().addSession({
    userId: owner === 'guest' ? null : owner, modeLabel: day.title, kind: 'examiner', attemptKey, date,
    overallBand: result.overallBand, fluencyBand: result.fluencyBand, lexicalBand: result.lexicalBand,
    grammarBand: result.grammarBand, pronunciationBand: result.pronunciationBand,
    durationSec: result.stats.durationSec, wordCount: result.stats.wordCount, fillerCount: result.stats.fillerCount,
    summary: result.summary, evaluation: result, transcript,
  })
}

/** Make completed daily sessions from earlier builds visible before a retake. */
export function recoverSpeakingDayHistory(owner: string) {
  const completed = getCompletedSpeakingTestIds(owner)
  const dates = getSpeakingCompletionDates(owner)
  for (const day of getIeltsSpeakingDayCatalog()) {
    if (!completed.has(day.id)) continue
    const key = `profai:speaking:day:${day.id}`
    try {
      const saved = JSON.parse(accountStorageFor(owner).getItem(key) ?? 'null')
      if (!saved?.finished || !saved.evaluation || !Array.isArray(saved.answers)) continue
      const transcript: ExaminerTurn[] = saved.answers.flatMap((answer: { question?: { prompt?: string }; spoken?: string }) => [
        { role: 'examiner', text: answer.question?.prompt ?? '' }, { role: 'candidate', text: answer.spoken ?? '' },
      ])
      saveSpeakingDayHistory(owner, saved.day ?? day, saved.evaluation, transcript, saved.audioKey ?? key, dates[day.id])
    } catch { /* One damaged session must not hide the remaining history. */ }
  }
}
