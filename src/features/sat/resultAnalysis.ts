import { bankDomain } from './bankTopics'
import { isSATTestComplete, type SATTestDefinition } from './catalog'
import {
  isSATAnswerCorrect,
  scoreSATModules,
  type SATAttempt,
  type SATQuestion,
  type SATSection,
} from './practiceTest4'
import { moduleTimes } from './timing'

export const SAT_DOMAIN_GUIDANCE: Record<string, string> = {
  'Information and Ideas': 'Find the main claim, then match each answer to evidence in the passage.',
  'Craft and Structure': 'Use context to check word meaning, author purpose, and connections between texts.',
  'Expression of Ideas': 'Check the relationship between ideas before choosing a transition or revising a sentence.',
  'Standard English Conventions':
    'Review sentence boundaries, agreement, and punctuation. Explain the rule behind each correction.',
  Algebra: 'Translate the problem into an equation, isolate the variable, and check your solution.',
  'Advanced Math': 'Practise equivalent expressions, nonlinear equations, and the structure of functions.',
  'Problem-Solving and Data Analysis':
    'Track units, distinguish percentages from counts, and read tables and graphs carefully.',
  'Geometry and Trigonometry':
    'Label the diagram, choose the relevant relationship, and check units before calculating.',
}
const DOMAIN_ORDER = Object.keys(SAT_DOMAIN_GUIDANCE)

export function formatSATDuration(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(whole / 3600)
  return `${hours ? `${hours}h ` : ''}${Math.floor((whole % 3600) / 60)}m ${whole % 60}s`
}

export function formatSATDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(timestamp)
}

export function satAnswerStatus(question: SATQuestion, attempt: SATAttempt) {
  return !attempt.answers[question.id]?.trim()
    ? 'unanswered'
    : isSATAnswerCorrect(question, attempt.answers[question.id])
      ? 'correct'
      : 'incorrect'
}

function counts(questions: SATQuestion[], attempt: SATAttempt) {
  const correct = questions.filter((q) => satAnswerStatus(q, attempt) === 'correct').length
  const unanswered = questions.filter((q) => satAnswerStatus(q, attempt) === 'unanswered').length
  return {
    total: questions.length,
    correct,
    unanswered,
    incorrect: questions.length - correct - unanswered,
    percent: questions.length ? Math.round((correct / questions.length) * 100) : 0,
  }
}

export function analyzeSATResult(test: SATTestDefinition, attempt: SATAttempt) {
  const questions = test.modules.flatMap((module) => module.questions)
  const report = scoreSATModules(test.modules, attempt.answers)
  const times = moduleTimes(attempt, test.modules, attempt.updatedAt)
  const submitted = attempt.status === 'submitted'
  const sections = (['reading-writing', 'math'] as SATSection[]).flatMap((id) => {
    const modules = test.modules.filter((module) => module.section === id)
    if (!modules.length) return []
    const range = id === 'math' ? report.mathRange : report.readingWritingRange
    const complete =
      modules.length === 2 &&
      !test.missingModuleIds?.some((moduleId) =>
        id === 'math' ? moduleId.startsWith('math') : moduleId.startsWith('rw'),
      )
    return [
      {
        id,
        label: id === 'math' ? 'Math' : 'Reading & Writing',
        ...counts(
          modules.flatMap((m) => m.questions),
          attempt,
        ),
        range,
        score: submitted && complete ? Math.round((range[0] + range[1]) / 20) * 10 : null,
        seconds: modules.reduce((sum, m) => sum + times[m.id], 0),
      },
    ]
  })
  const domainMap = new Map<string, { section: SATSection; domain: string; questions: SATQuestion[] }>()
  questions.forEach((question) => {
    const domain = bankDomain(question.domain)
    const key = `${question.section}:${domain}`
    const row = domainMap.get(key) ?? { section: question.section, domain, questions: [] }
    row.questions.push(question)
    domainMap.set(key, row)
  })
  const domains = [...domainMap.entries()]
    .map(([key, row]) => ({
      key,
      section: row.section,
      domain: row.domain,
      ...counts(row.questions, attempt),
      guidance:
        SAT_DOMAIN_GUIDANCE[row.domain] ??
        'Review the missed questions, explain each solution, and retry without notes.',
    }))
    .sort((a, b) => {
      const position = (domain: string) =>
        DOMAIN_ORDER.includes(domain) ? DOMAIN_ORDER.indexOf(domain) : DOMAIN_ORDER.length
      return position(a.domain) - position(b.domain)
    })
  const priorities = [...domains]
    .filter((d) => d.correct < d.total)
    .sort((a, b) => a.percent - b.percent || b.total - b.correct - (a.total - a.correct))
  const strongest = [...domains].sort((a, b) => b.percent - a.percent || b.total - a.total)[0]
  const modules = test.modules.map((module) => ({
    ...module,
    ...counts(module.questions, attempt),
    seconds: times[module.id],
    started: attempt.moduleStartedAt[module.id] !== undefined || times[module.id] > 0,
  }))
  const difficulty = (['Foundation', 'Medium', 'Advanced'] as const)
    .map((label) => ({
      label,
      ...counts(
        questions.filter((q) => q.difficulty === label),
        attempt,
      ),
    }))
    .filter((row) => row.total > 0)
  const complete = isSATTestComplete(test)
  const score = !submitted || !complete ? null : sections.length === 1 ? sections[0].score : report.midpoint
  const range = sections.length === 1 ? sections[0].range : report.totalRange
  return {
    report,
    questions,
    sections,
    domains,
    priorities,
    strongest,
    modules,
    difficulty,
    submitted,
    complete,
    score,
    range,
    maximum: sections.length === 1 ? 800 : 1600,
    seconds: modules.reduce((sum, m) => sum + m.seconds, 0),
  }
}

export type SATResultAnalysis = ReturnType<typeof analyzeSATResult>
