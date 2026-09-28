import { randomUUID } from 'node:crypto'
import { z } from 'zod'

export const examSkills = ['IELTS_READING', 'IELTS_LISTENING', 'IELTS_WRITING', 'IELTS_SPEAKING', 'SAT_MATH', 'SAT_READING_WRITING', 'SAT_OVERALL'] as const
export type ExamSkill = typeof examSkills[number]
export type ExamTrack = 'IELTS' | 'SAT' | 'BOTH'
export type ExamTask = {
  id: string
  contentKey: string
  title: string
  outcome: string
  route: string
  minutes: number
  category: 'IELTS' | 'SAT'
  skill: ExamSkill | null
  kind: 'PRACTICE' | 'REVIEW' | 'ENRICHMENT'
  completionMode: 'ASSESSMENT' | 'MANUAL'
  status: 'TODO' | 'DONE'
  completedAt: string | null
  resultPercent?: number
  reviewOf?: string
}
export type ExamDay = { date: string; tasks: ExamTask[] }
export type ExamEvidence = {
  id: string
  contentKey: string | null
  skill: ExamSkill
  percent: number
  completedAt: Date
  skills?: Array<{ skill: string; correct: number; total: number }>
}
export type ExamWeekReview = { asOf: string; headline: string; reasons: string[]; focusSkill: ExamSkill | null; previousCompleted: number; previousTotal: number }

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
export const examAnswersSchema = z.object({
  examTrack: z.enum(['IELTS', 'SAT', 'BOTH']),
  ieltsExamDate: date.default(null),
  satExamDate: date.default(null),
  currentIeltsScore: z.number().min(0).max(9).nullable().default(null),
  currentSatScore: z.number().min(400).max(1600).nullable().default(null),
  targetIeltsScore: z.number().min(4).max(9).nullable().default(null),
  targetSatScore: z.number().min(400).max(1600).nullable().default(null),
  weeklyAvailability: z.array(z.number().int().min(0).max(360)).length(7).refine(days => days.some(minutes => minutes >= 30), 'Choose at least one study day of 30 minutes.'),
}).superRefine((value, context) => {
  if (value.examTrack !== 'SAT' && value.targetIeltsScore === null) context.addIssue({ code: 'custom', path: ['targetIeltsScore'], message: 'Choose an IELTS target band.' })
  if (value.examTrack !== 'IELTS' && value.targetSatScore === null) context.addIssue({ code: 'custom', path: ['targetSatScore'], message: 'Choose a SAT target score.' })
  if (value.examTrack !== 'SAT' && value.currentIeltsScore !== null && value.targetIeltsScore !== null && value.currentIeltsScore > value.targetIeltsScore) context.addIssue({ code: 'custom', path: ['targetIeltsScore'], message: 'Target must be at least your current band.' })
  if (value.examTrack !== 'IELTS' && value.currentSatScore !== null && value.targetSatScore !== null && value.currentSatScore > value.targetSatScore) context.addIssue({ code: 'custom', path: ['targetSatScore'], message: 'Target must be at least your current score.' })
})
export type ExamAnswers = z.infer<typeof examAnswersSchema>

export function localDate(value: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value)
    const part = (name: string) => parts.find(item => item.type === name)?.value ?? ''
    return `${part('year')}-${part('month')}-${part('day')}`
  } catch { return value.toISOString().slice(0, 10) }
}

export function weekStartOf(iso: string): string {
  const day = new Date(`${iso}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7)
  return day.toISOString().slice(0, 10)
}

function addDays(iso: string, count: number): string {
  const day = new Date(`${iso}T12:00:00Z`)
  day.setUTCDate(day.getUTCDate() + count)
  return day.toISOString().slice(0, 10)
}

type Resource = Omit<ExamTask, 'id' | 'status' | 'completedAt' | 'kind' | 'completionMode' | 'reviewOf'> & { reviewMinutes: number; kind?: ExamTask['kind']; completionMode?: ExamTask['completionMode'] }
const resource = (contentKey: string, title: string, route: string, minutes: number, reviewMinutes: number, category: 'IELTS' | 'SAT', skill: ExamSkill | null, outcome: string, kind?: ExamTask['kind'], completionMode?: ExamTask['completionMode']): Resource => ({ contentKey, title, route, minutes, reviewMinutes, category, skill, outcome, kind, completionMode })

const reading = Array.from({ length: 22 }, (_, index) => {
  const number = index + 1
  const id = number <= 12 ? `reading-roadmap-full-${number}` : `ielts-reading-full-vol${number - 12}`
  return resource(`ielts:reading:${id}`, `IELTS Reading Full Test ${number}`, `/test/reading/${id}`, 60, 30, 'IELTS', 'IELTS_READING', 'Finish all three passages, then review every incorrect answer.')
})
const listening = Array.from({ length: 21 }, (_, index) => {
  const number = index + 1
  const id = `ielts-listening-${number}`
  return resource(`ielts:listening:${id}`, `IELTS Listening Full Test ${number}`, `/test/listening/${id}`, number === 19 ? 41 : number === 15 ? 32 : 30, 25, 'IELTS', 'IELTS_LISTENING', 'Listen to all four parts and review errors with the transcript.')
})
const writing = Array.from({ length: 4 }, (_, index) => [1, 2].map(task => {
  const number = index + 1
  const id = `writing-full-${number}-task-${task}`
  return resource(`ielts:writing:${id}`, `IELTS Writing Test ${number} · Task ${task}`, `/ielts/writing/test/${id}`, task === 1 ? 20 : 40, 20, 'IELTS', 'IELTS_WRITING', 'Submit your response and review the feedback.')
})).flat()
const speaking = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1
  const id = `speaking-day-${number}`
  return resource(`ielts:speaking:${id}`, `IELTS Speaking Day ${number}`, `/ielts/speaking/test/${id}`, 15, 15, 'IELTS', 'IELTS_SPEAKING', 'Complete the speaking practice and review your feedback.')
})
const satSection = (section: 'math' | 'reading-writing') => Array.from({ length: 40 }, (_, index) => {
  const number = index + 1
  return resource(`sat:${section}:${number}`, `SAT ${section === 'math' ? 'Math' : 'Reading & Writing'} Practice Test ${number}`, `/mock/sat/${number}?section=${section}`, section === 'math' ? 70 : 64, 25, 'SAT', section === 'math' ? 'SAT_MATH' : 'SAT_READING_WRITING', 'Submit both modules, then inspect incorrect and skipped questions.')
})
const satFull = Array.from({ length: 40 }, (_, index) => {
  const number = index + 1
  return resource(`sat:full:${number}`, `Digital SAT Practice Test ${number} · full mock`, `/mock/sat/${number}`, 134, 45, 'SAT', 'SAT_OVERALL', 'Complete all four modules, then review Math and Reading & Writing errors.')
})

const articleItems = [
  { slug: 'five-books-smarter-than-99-percent', title: '5 Books That Made Me Smarter Than 99% of People' },
  { slug: 'the-birth-of-the-universe', title: 'The Birth of the Universe' },
  { slug: 'the-lost', title: 'The Lost' },
]
const enrichment: Record<string, Resource[]> = {
  vocabulary: Array.from({ length: 10 }, (_, index) => resource(`ielts:vocabulary:${index + 1}`, `IELTS Reading vocabulary · Test ${index + 1}`, `/vocabulary/ielts/reading_full_track/reading_full_test_${index + 1}/reading_full_test_${index + 1}_passage_1`, 15, 0, 'IELTS', null, 'Learn the words, use five in your own sentences.', 'ENRICHMENT', 'MANUAL')),
  article: articleItems.map(item => resource(`ielts:article:${item.slug}`, `Read · ${item.title}`, `/articles/${item.slug}`, 20, 0, 'IELTS', null, 'Read the article and note three useful expressions.', 'ENRICHMENT', 'MANUAL')),
  shadowing: [],
  podcast: [resource('ielts:podcast:episode-1', 'Podcast · English Listening Practice Episode 1', '/podcast', 20, 0, 'IELTS', null, 'Listen actively and summarize three ideas.', 'ENRICHMENT', 'MANUAL')],
}
export type StudyMedia = { shadowing: Array<{ youtubeId: string; title: string; durationSec: number }>; podcasts: Array<{ youtubeId: string; title: string; durationSec: number }> }

function createTask(item: Resource, kind: ExamTask['kind'] = item.kind ?? 'PRACTICE', reviewOf?: string): ExamTask {
  let route = item.route
  if (kind === 'REVIEW') {
    if (item.contentKey.startsWith('ielts:reading:') || item.contentKey.startsWith('ielts:listening:')) route = `/results/${encodeURIComponent(item.contentKey.split(':').slice(2).join(':'))}/review`
    else if (item.contentKey.startsWith('ielts:writing:')) route = `/analyze-mistakes?writingTest=${encodeURIComponent(item.contentKey.slice('ielts:writing:'.length))}`
    else if (item.contentKey.startsWith('sat:bank:')) route = `${item.route}&review=1`
    else if (item.contentKey.startsWith('sat:')) route = item.route.replace('/mock/sat/', '/sat/mock/').replace(/(\?section=[^&]+)/, '/run$1').replace(/^(\/sat\/mock\/\d+)$/, '$1/run')
  }
  const reviewOutcome = item.skill === 'IELTS_WRITING' ? 'Read your saved feedback, identify three corrections, and rewrite the weakest part.' : item.skill === 'IELTS_SPEAKING' ? 'Reflect on fluency, vocabulary and pronunciation; note three improvements for your next attempt.' : 'Review every mistake, identify its cause, and note the correction.'
  return { id: randomUUID(), contentKey: kind === 'REVIEW' ? `${item.contentKey}:review` : item.contentKey, title: kind === 'REVIEW' ? `Analyze · ${item.title}` : item.title, outcome: kind === 'REVIEW' ? reviewOutcome : item.outcome, route, minutes: kind === 'REVIEW' ? item.reviewMinutes : item.minutes, category: item.category, skill: item.skill, kind, completionMode: kind === 'REVIEW' ? 'MANUAL' : item.completionMode ?? 'ASSESSMENT', status: 'TODO', completedAt: null, ...(reviewOf ? { reviewOf } : {}) }
}

export function applyEvidence(days: ExamDay[], evidence: ExamEvidence[], timeZone: string): { days: ExamDay[]; changed: boolean } {
  const matched = new Map<string, ExamEvidence>()
  for (const row of evidence) if (row.contentKey) {
    const key = `${row.contentKey}|${localDate(row.completedAt, timeZone)}`
    if (!matched.has(key)) matched.set(key, row)
  }
  let changed = false
  const next = days.map(day => ({ ...day, tasks: day.tasks.map(task => {
    if (task.status === 'DONE' || task.completionMode !== 'ASSESSMENT') return task
    const row = matched.get(`${task.contentKey}|${day.date}`)
    if (!row) return task
    changed = true
    return { ...task, status: 'DONE' as const, completedAt: row.completedAt.toISOString(), resultPercent: Math.round(row.percent) }
  }) }))
  return { days: next, changed }
}

export function summarize(days: ExamDay[]) {
  const tasks = days.flatMap(day => day.tasks)
  return { completed: tasks.filter(task => task.status === 'DONE').length, total: tasks.length, missed: tasks.filter(task => task.status !== 'DONE') }
}

function examOrder(answers: ExamAnswers, date: string): Array<'IELTS' | 'SAT'> {
  if (answers.examTrack === 'IELTS') return ['IELTS']
  if (answers.examTrack === 'SAT') return ['SAT']
  const distance = (value: string | null) => value && value >= date ? Date.parse(value) - Date.parse(date) : Number.POSITIVE_INFINITY
  return distance(answers.satExamDate) < distance(answers.ieltsExamDate) ? ['SAT', 'IELTS'] : ['IELTS', 'SAT']
}

function skillRanking(evidence: ExamEvidence[]): ExamSkill[] {
  return examSkills.filter(skill => skill !== 'SAT_OVERALL').sort((a, b) => {
    const average = (key: ExamSkill) => {
      const rows = evidence.filter(row => row.skill === key).slice(0, 4)
      return rows.length ? rows.reduce((sum, row) => sum + row.percent, 0) / rows.length : 65
    }
    return average(a) - average(b)
  })
}

function weakSatSkill(evidence: ExamEvidence[], section: 'math' | 'reading-writing'): string | null {
  const matches = evidence.filter(row => row.skill === (section === 'math' ? 'SAT_MATH' : 'SAT_READING_WRITING')).slice(0, 12).flatMap(row => row.skills ?? [])
  const totals = new Map<string, { correct: number; total: number }>()
  for (const row of matches) {
    const current = totals.get(row.skill) ?? { correct: 0, total: 0 }
    current.correct += row.correct; current.total += row.total
    totals.set(row.skill, current)
  }
  const eligible = [...totals].filter(([, value]) => value.total >= 4)
  eligible.sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
  return eligible[0]?.[0] ?? null
}

function bankResource(section: 'math' | 'reading-writing', evidence: ExamEvidence[], date: string, short: boolean): Resource {
  const skill = weakSatSkill(evidence, section)
  const contentKey = `sat:bank:${section}:${skill ?? 'mixed'}:${date}`
  const params = new URLSearchParams({ section, count: short ? '4' : '6', planKey: contentKey, ...(skill ? { skill } : {}) })
  return resource(contentKey, `SAT ${section === 'math' ? 'Math' : 'Reading & Writing'} · ${skill ?? 'mixed'} questions`, `/sat/question-bank?${params}`, short ? 8 : 18, short ? 7 : 10, 'SAT', section === 'math' ? 'SAT_MATH' : 'SAT_READING_WRITING', `Answer ${short ? 'four' : 'six'} questions, then analyze every mistake.`)
}

export function buildExamWeek(answers: ExamAnswers, evidence: ExamEvidence[], weekStart: string, today: string, previousDays: ExamDay[] | null, existingDays: ExamDay[] = [], media: StudyMedia = { shadowing: [], podcasts: [] }): { days: ExamDay[]; review: ExamWeekReview } {
  const prior = [...(previousDays ?? []), ...existingDays.filter(day => day.date < today)]
  const evidenceKeys = new Set(evidence.map(row => row.contentKey).filter((key): key is string => Boolean(key)))
  const doneKeys = new Set([...evidenceKeys, ...prior.flatMap(day => day.tasks.filter(task => task.status === 'DONE').map(task => task.contentKey))])
  const reserved = new Set<string>()
  const queues: Record<string, Resource[]> = { reading, listening, writing, speaking, satMath: satSection('math'), satRw: satSection('reading-writing'), satFull, ...enrichment,
    shadowing: media.shadowing.map(video => resource(`ielts:shadowing:${video.youtubeId}`, `Shadowing · ${video.title}`, `/shadowing-lab?video=${encodeURIComponent(video.youtubeId)}`, Math.max(10, Math.min(25, Math.ceil(video.durationSec / 60) * 2)), 0, 'IELTS', null, 'Repeat this clip and note the difficult words.', 'ENRICHMENT', 'MANUAL')),
    podcast: [...media.podcasts.map(video => resource(`ielts:podcast:${video.youtubeId}`, `Podcast · ${video.title}`, `/podcast?video=${encodeURIComponent(video.youtubeId)}`, Math.max(15, Math.min(30, Math.ceil(video.durationSec / 60))), 0, 'IELTS', null, 'Listen and summarize three ideas.', 'ENRICHMENT', 'MANUAL')), ...enrichment.podcast],
  }
  const pendingReviews = prior.flatMap(day => day.tasks).filter(task => task.kind === 'REVIEW' && task.status !== 'DONE' && task.reviewOf && doneKeys.has(task.reviewOf) && !doneKeys.has(task.contentKey))
  const pendingPractice = prior.flatMap(day => day.tasks).filter(task => task.kind === 'PRACTICE' && task.status !== 'DONE' && !doneKeys.has(task.contentKey))
  const pendingEnrichment = prior.flatMap(day => day.tasks).filter(task => task.kind === 'ENRICHMENT' && task.status !== 'DONE' && !doneKeys.has(task.contentKey))
  const findResource = (key: string): Resource | null => {
    const catalogued = Object.values(queues).flat().find(item => item.contentKey === key)
    if (catalogued) return catalogued
    const old = prior.flatMap(day => day.tasks).find(item => item.contentKey === key && item.kind !== 'REVIEW')
    if (!old) return null
    const review = prior.flatMap(day => day.tasks).find(item => item.reviewOf === key)
    return { contentKey: old.contentKey, title: old.title, route: old.route, minutes: old.minutes, reviewMinutes: review?.minutes ?? 0, category: old.category, skill: old.skill, outcome: old.outcome, kind: old.kind, completionMode: old.completionMode }
  }
  const next = (lane: string) => queues[lane].find(item => !doneKeys.has(item.contentKey) && !reserved.has(item.contentKey)) ?? null
  const nextEnrichment = (preferred: string, maxMinutes: number, date: string) => {
    const overdue = pendingEnrichment.find(task => !reserved.has(task.contentKey) && task.minutes <= maxMinutes)
    if (overdue) return findResource(overdue.contentKey)
    const fresh = [preferred, ...['vocabulary', 'article', 'shadowing', 'podcast'].filter(lane => lane !== preferred)].map(next).find((item): item is Resource => Boolean(item && item.minutes <= maxMinutes))
    if (fresh) return fresh
    if (maxMinutes < 15) return null
    const number = Number(date.slice(-2)) % 10 + 1
    const original = enrichment.vocabulary[number - 1]
    return resource(`ielts:vocabulary:review:${date}`, `Review IELTS Reading vocabulary · Test ${number}`, original.route, 15, 0, 'IELTS', null, 'Recall the words without prompts and write five new example sentences.', 'ENRICHMENT', 'MANUAL')
  }
  const ranking = skillRanking(evidence)
  const measured = ranking.filter(skill => evidence.some(row => row.skill === skill))
  const priorityExam = examOrder(answers, today)[0]
  const focusSkill = measured.find(skill => skill.startsWith(priorityExam)) ?? measured.find(skill => answers.examTrack === 'BOTH' || skill.startsWith(answers.examTrack)) ?? null
  const weakIelts = measured.find(skill => skill.startsWith('IELTS_'))
  const weakSat = measured.find(skill => skill.startsWith('SAT_'))
  const weakIeltsLane: string | null = weakIelts ? weakIelts.slice('IELTS_'.length).toLowerCase() : null
  const weakSatSection: 'math' | 'reading-writing' | null = weakSat === 'SAT_MATH' ? 'math' : weakSat === 'SAT_READING_WRITING' ? 'reading-writing' : null
  const focusExtra = weakIeltsLane === 'listening' ? 'podcast' : weakIeltsLane === 'speaking' ? 'shadowing' : weakIeltsLane ? 'article' : null
  const ieltsCounts = new Map(['reading', 'listening', 'writing', 'speaking'].map(lane => [lane, 0]))
  let satStudyDay = 0
  const lastWeekDays = previousDays?.filter(day => day.date >= addDays(weekStart, -7) && day.date < weekStart) ?? []
  const lastWeek = lastWeekDays.length ? summarize(lastWeekDays) : null
  const days = Array.from({ length: 7 }, (_, index): ExamDay => {
    const date = addDays(weekStart, index)
    const saved = existingDays.find(day => day.date === date)
    if (date < today) return saved ?? { date, tasks: [] }
    const budget = answers.weeklyAvailability[index]
    if (budget < 30) return { date, tasks: [] }
    const tasks: ExamTask[] = []
    const order = examOrder(answers, date)
    let remaining = budget
    const add = (item: Resource | null) => {
      if (!item || item.minutes + item.reviewMinutes > remaining) return false
      const practice = createTask(item)
      tasks.push(practice)
      if (item.reviewMinutes) tasks.push(createTask(item, 'REVIEW', practice.contentKey))
      remaining -= item.minutes + item.reviewMinutes
      reserved.add(item.contentKey)
      return true
    }
    for (const exam of order) {
      const share = answers.examTrack === 'BOTH' ? Math.max(15, Math.floor(budget * (exam === order[0] ? .62 : .38))) : budget
      const overdueReview = pendingReviews.find(task => task.category === exam && !reserved.has(task.contentKey))
      if (overdueReview && overdueReview.minutes <= remaining) {
        tasks.push({ ...overdueReview, id: randomUUID(), status: 'TODO', completedAt: null })
        remaining -= overdueReview.minutes
        reserved.add(overdueReview.contentKey)
        continue
      }
      if (exam === 'IELTS') {
        const reserveOther = answers.examTrack === 'BOTH' && exam === order[0] ? 15 : 0
        const allowedMinutes = Math.min(remaining - reserveOther, share + 20)
        const core = ['reading', 'listening', 'writing', 'speaking']
          .map((lane, position) => ({ lane, position, item: next(lane) }))
          .filter((entry): entry is { lane: string; position: number; item: Resource } => Boolean(entry.item && entry.item.minutes + entry.item.reviewMinutes <= allowedMinutes))
          .sort((a, b) => (ieltsCounts.get(a.lane) ?? 0) - (ieltsCounts.get(b.lane) ?? 0) || Number(b.lane === weakIeltsLane) - Number(a.lane === weakIeltsLane) || a.position - b.position)
        const lane = core[0]?.lane ?? 'reading'
        const overdue = pendingPractice.find(task => task.category === 'IELTS' && !reserved.has(task.contentKey))
        const candidate = overdue ? findResource(overdue.contentKey) : core[0]?.item ?? null
        if (!candidate || candidate.minutes + candidate.reviewMinutes > allowedMinutes || !add(candidate)) {
          const extraLane = focusExtra && index % 2 === 0 ? focusExtra : ['vocabulary', 'podcast', 'vocabulary', 'article', 'vocabulary', 'shadowing', 'article'][index]
          add(nextEnrichment(extraLane, remaining - reserveOther, date))
        } else ieltsCounts.set(lane, (ieltsCounts.get(lane) ?? 0) + 1)
        if (remaining - reserveOther >= 15) {
          const extraLane = focusExtra && index % 2 === 0 ? focusExtra : ['vocabulary', 'podcast', 'vocabulary', 'article', 'vocabulary', 'shadowing', 'article'][index]
          add(nextEnrichment(extraLane, remaining - reserveOther, date))
        }
      } else {
        const section = weakSatSection && satStudyDay % 3 === 2 ? weakSatSection : satStudyDay % 2 === 0 ? 'math' : 'reading-writing'
        satStudyDay += 1
        const lane = section === 'math' ? 'satMath' : 'satRw'
        const overdue = pendingPractice.find(task => task.category === 'SAT' && !reserved.has(task.contentKey))
        const fullMockFits = remaining >= 179 + (answers.examTrack === 'BOTH' && exam === order[0] ? 15 : 0)
        const candidate = overdue ? findResource(overdue.contentKey) : index === 5 && fullMockFits ? next('satFull') : next(lane)
        if (!candidate || candidate.minutes + candidate.reviewMinutes > Math.min(remaining, share + 25) || !add(candidate)) add(bankResource(section, evidence, date, remaining < 28))
      }
    }
    if (order.includes('IELTS') && remaining >= 20) add(nextEnrichment(['article', 'shadowing', 'podcast'][index % 3], remaining, date))
    if (!tasks.length && answers.examTrack !== 'SAT') add(next('vocabulary'))
    return { date, tasks }
  })
  const reasons = [
    focusSkill ? `${focusSkill.replaceAll('_', ' ')} receives extra attention from recent results.` : 'Complete a test to measure your starting level.',
    lastWeek ? `${lastWeek.completed} of ${lastWeek.total} tasks were finished last week.` : 'Your first exam week is ready.',
    'Unfinished material keeps its place in the sequence; the original day remains incomplete.',
  ]
  return { days, review: { asOf: today, headline: lastWeek ? 'This week responds to your results' : 'Your first exam week', reasons, focusSkill, previousCompleted: lastWeek?.completed ?? 0, previousTotal: lastWeek?.total ?? 0 } }
}
