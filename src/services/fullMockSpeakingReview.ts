import { accountStorageFor } from '@/utils/accountStorage'
import { readTestAudio } from '@/utils/testAudioStorage'
import { evaluateSpeaking, type SpeakingEvaluation } from './speakingAI'
import type { FullMockSectionResult } from '@/utils/ieltsMockCatalog'

export async function regradeFullMockSpeaking(owner: string, saved: FullMockSectionResult): Promise<SpeakingEvaluation> {
  if (!saved.speaking?.sessionKey) throw new Error('The saved recordings are unavailable on this device.')
  const checkpoint = JSON.parse(accountStorageFor(owner).getItem(saved.speaking.sessionKey) ?? 'null')
  if (!checkpoint?.audioKey) throw new Error('The saved recordings are unavailable on this device.')
  if (JSON.stringify(checkpoint.history) !== JSON.stringify(saved.speaking.transcript)) throw new Error('The recordings do not match this attempt. Your saved answers are preserved.')
  const expectedAudioAnswers = saved.speaking.transcript.filter(turn => turn.role === 'candidate').flatMap((turn, index) => turn.text.trim() ? [index] : [])
  const clips = await Promise.all(expectedAudioAnswers.map(async answerIndex => {
    const blob = await readTestAudio(owner, `${checkpoint.audioKey}:answer:${answerIndex}`)
    return blob ? { blob, answerIndex } : null
  }))
  if (clips.some(clip => !clip)) throw new Error('Some recordings are unavailable on this device. Your answers are preserved.')
  const evaluation = await evaluateSpeaking({ modeLabel: saved.testId, history: saved.speaking.transcript, stats: saved.speaking.evaluation.stats,
    audio: clips.filter((clip): clip is NonNullable<typeof clip> => !!clip), expectedAudioAnswers })
  if (evaluation.source !== 'ai' || evaluation.assessmentMode !== 'audio') throw new Error('Assessment is temporarily unavailable. Please try again; your answers are saved.')
  return evaluation
}
