import { SAT_TEST_TIMER_KEY, type SATAttempt, type SATModule } from './practiceTest4'

/** Old attempts only have wall-clock boundaries; their module totals are estimates. */
export function moduleTimes(attempt: SATAttempt, modules: SATModule[], now = Date.now()): Record<string, number> {
  const end = attempt.submittedAt ?? attempt.terminatedAt ?? (attempt.status === 'active' ? now : attempt.updatedAt)
  return Object.fromEntries(modules.map((module, index) => {
    if (attempt.moduleElapsedSeconds) {
      const running = attempt.status === 'active' && index === attempt.currentModuleIndex && attempt.moduleTimerStartedAt !== undefined
        ? Math.max(0, (end - attempt.moduleTimerStartedAt) / 1000) : 0
      const seconds = (attempt.moduleElapsedSeconds[module.id] ?? 0) + running
      return [module.id, attempt.mode === 'exam' ? Math.min(module.durationSeconds, seconds) : seconds]
    }
    const start = attempt.moduleStartedAt[module.id]
    const nextStart = modules.slice(index + 1).map((next) => attempt.moduleStartedAt[next.id]).find((value) => value !== undefined)
    const seconds = start === undefined ? 0 : Math.max(0, ((nextStart ?? attempt.timerPausedAt ?? end) - start) / 1000)
    return [module.id, attempt.mode === 'exam' ? Math.min(module.durationSeconds, seconds) : seconds]
  }))
}

export function totalTime(attempt: SATAttempt, modules: SATModule[], now = Date.now()) {
  return Object.values(moduleTimes(attempt, modules, now)).reduce((sum, seconds) => sum + seconds, 0)
}

export function migrateModuleTiming(attempt: SATAttempt, modules: SATModule[], now = Date.now()): SATAttempt {
  if (attempt.moduleElapsedSeconds || attempt.status !== 'active') return attempt
  const module = modules[attempt.currentModuleIndex]
  const elapsed = moduleTimes(attempt, modules, attempt.timerPausedAt ?? now)
  const remaining = Math.max(0, module.durationSeconds - elapsed[module.id])
  const deadlines = { ...attempt.moduleDeadlines }
  delete deadlines[SAT_TEST_TIMER_KEY]
  deadlines[module.id] = now + remaining * 1000
  return {
    ...attempt, moduleElapsedSeconds: elapsed, moduleDeadlines: deadlines,
    moduleTimerStartedAt: attempt.pausedModuleSeconds === undefined ? now : undefined,
    pausedModuleSeconds: attempt.pausedModuleSeconds === undefined ? undefined : attempt.mode === 'exam' ? remaining : elapsed[module.id],
  }
}

export function moduleSeconds(attempt: SATAttempt, modules: SATModule[], now = Date.now()) {
  const module = modules[attempt.currentModuleIndex]
  if (attempt.pausedModuleSeconds !== undefined) return attempt.pausedModuleSeconds
  if (attempt.mode === 'exam') return Math.max(0, Math.ceil(((attempt.moduleDeadlines[module.id] ?? now) - now) / 1000))
  return Math.floor(moduleTimes(attempt, modules, now)[module.id])
}

export function pauseModule(attempt: SATAttempt, modules: SATModule[], now = Date.now()): SATAttempt {
  if (attempt.pausedModuleSeconds !== undefined) return attempt
  return {
    ...attempt, moduleElapsedSeconds: moduleTimes(attempt, modules, now), moduleTimerStartedAt: undefined,
    pausedModuleSeconds: moduleSeconds(attempt, modules, now), timerPausedAt: now, updatedAt: now,
  }
}

export function resumeModule(attempt: SATAttempt, modules: SATModule[], now = Date.now()): SATAttempt {
  const module = modules[attempt.currentModuleIndex]
  return {
    ...attempt, moduleTimerStartedAt: now, pausedModuleSeconds: undefined, timerPausedAt: undefined,
    moduleDeadlines: attempt.mode === 'exam'
      ? { ...attempt.moduleDeadlines, [module.id]: now + (attempt.pausedModuleSeconds ?? module.durationSeconds) * 1000 }
      : attempt.moduleDeadlines,
  }
}

export function finishModule(attempt: SATAttempt, modules: SATModule[], now = Date.now()): SATAttempt {
  return { ...attempt, moduleElapsedSeconds: moduleTimes(attempt, modules, now), moduleTimerStartedAt: undefined, pausedModuleSeconds: undefined, timerPausedAt: undefined }
}
