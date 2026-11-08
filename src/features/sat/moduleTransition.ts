import type { SATAttempt, SATModule } from './practiceTest4'
import { advanceSATModule } from './sectionBreak'
import { finishModule } from './timing'

export const SAT_MODULE_TRANSITION_MS = 1500

/** Orientation between the two modules of a section, with neither timer running. */
export function needsSATModuleTransition(attempt: SATAttempt, modules: SATModule[]) {
  const current = modules[attempt.currentModuleIndex]
  const next = modules[attempt.currentModuleIndex + 1]
  return attempt.status === 'active' && !attempt.sectionBreak && Boolean(current && next && current.section === next.section)
}

export function beginSATModuleTransition(attempt: SATAttempt, modules: SATModule[], now = Date.now()): SATAttempt {
  if (attempt.moduleTransition || !needsSATModuleTransition(attempt, modules)) return attempt
  return { ...finishModule(attempt, modules, now), moduleTransition: { endsAt: now + SAT_MODULE_TRANSITION_MS } }
}

export function completeSATModuleTransition(attempt: SATAttempt, modules: SATModule[], now = Date.now()): SATAttempt {
  if (!attempt.moduleTransition || now < attempt.moduleTransition.endsAt || !needsSATModuleTransition(attempt, modules)) return attempt
  // Starting from now also preserves the full next-module time after a reload.
  return advanceSATModule({ ...attempt, moduleTransition: undefined }, modules, now)
}
