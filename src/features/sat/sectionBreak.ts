import type { SATAttempt, SATModule } from './practiceTest4'
import { finishModule } from './timing'

export const SAT_SECTION_BREAK_SECONDS = 10 * 60

export function needsSATSectionBreak(attempt: SATAttempt, modules: SATModule[]) {
  return attempt.mode === 'exam'
    && modules[attempt.currentModuleIndex]?.section === 'reading-writing'
    && modules[attempt.currentModuleIndex + 1]?.section === 'math'
}

/** Finish a module, taking the section break before starting the Math timer. */
export function advanceSATModule(attempt: SATAttempt, modules: SATModule[], now = Date.now()): SATAttempt {
  if (attempt.status !== 'active') return attempt
  const nextModuleIndex = attempt.currentModuleIndex + 1
  const nextModule = modules[nextModuleIndex]
  if (!nextModule) return attempt

  if (attempt.sectionBreak && now < attempt.sectionBreak.endsAt) return attempt
  const finished = attempt.sectionBreak ? attempt : finishModule(attempt, modules, now)
  if (!attempt.sectionBreak && needsSATSectionBreak(attempt, modules)) {
    return { ...finished, sectionBreak: { endsAt: now + SAT_SECTION_BREAK_SECONDS * 1000 } }
  }

  // Anchor Math to the saved deadline even if the tab was sleeping or reloaded.
  const startedAt = attempt.sectionBreak?.endsAt ?? now
  return {
    ...finished,
    sectionBreak: undefined,
    currentModuleIndex: nextModuleIndex,
    currentQuestionIndex: 0,
    moduleTimerStartedAt: startedAt,
    moduleStartedAt: { ...attempt.moduleStartedAt, [nextModule.id]: startedAt },
    moduleDeadlines: { ...attempt.moduleDeadlines, [nextModule.id]: startedAt + nextModule.durationSeconds * 1000 },
    pausedModuleSeconds: undefined,
    timerPausedAt: undefined,
  }
}
