import manifestData from '@/data/sat/practiceTest4Manifest.json'
import explanationsData from '@/data/sat/practiceTest4Explanations.json'
import questionsData from '@/data/sat/practiceTest4Questions.json'
import {
  SAT_PRACTICE_TEST_4_CONTENT_OVERRIDES,
  type SATStructuredChoice,
} from './practiceTest4QuestionCorrections'

export type SATMode = 'practice' | 'exam'
export type SATModuleId = 'rw1' | 'rw2' | 'math1' | 'math2'
export type SATSection = 'reading-writing' | 'math'
export type SATAttemptStatus = 'active' | 'submitted' | 'terminated'

export type SATQuestion = {
  id: string
  moduleId: SATModuleId
  number: number
  section: SATSection
  kind: 'multiple-choice' | 'student-response'
  correctAnswer: string
  acceptedAnswers?: string[]
  tolerance?: number
  prompt: string
  choices: SATStructuredChoice[]
  visual?: { asset: string; alt: string }
  domain: string
  skill: string
  difficulty: 'Foundation' | 'Medium' | 'Advanced'
  asset: string
  assetWidth: number
  assetHeight: number
  explanation: string
}

export type SATModule = {
  id: SATModuleId
  title: string
  shortTitle: string
  section: SATSection
  durationSeconds: number
  questions: SATQuestion[]
}

export type HighlightPoint = { x: number; y: number }
export type HighlightStroke = {
  id: string
  color: string
  width: number
  points: HighlightPoint[]
}

export type SATAttempt = {
  version: 1
  testId: 'practice-test-4'
  mode: SATMode
  status: SATAttemptStatus
  currentModuleIndex: number
  currentQuestionIndex: number
  answers: Record<string, string>
  flagged: string[]
  notes: Record<string, string>
  highlights: Record<string, HighlightStroke[]>
  startedAt: number
  updatedAt: number
  submittedAt?: number
  terminatedAt?: number
  terminationReason?: string
  moduleStartedAt: Record<string, number>
  moduleDeadlines: Record<string, number>
  pausedModuleSeconds?: number
}

type ManifestEntry = {
  moduleId: SATModuleId
  number: number
  asset: string
  width: number
  height: number
}

const manifest = manifestData as ManifestEntry[]
const explanations = explanationsData as Record<SATModuleId, Record<string, string>>
const structuredQuestions = questionsData as Array<{
  id: string
  prompt: string
  choices: SATStructuredChoice[]
}>

const MULTIPLE_CHOICE_KEYS: Record<SATModuleId, string[]> = {
  rw1: 'B A A C A B D B B D C D A B C A A A A D D D B C B A C D A A D D C'.split(' '),
  rw2: 'D D B B B B A C C A A B D C C A B D C A B D D A B B A A C C A A B'.split(' '),
  math1: 'B A B D A _ _ A B D A C _ _ D B B A C _ _ B D C C D _'.split(' '),
  math2: 'B B C A A _ _ B D A A B _ _ A C B D A _ _ A C C D B _'.split(' '),
}

const STUDENT_RESPONSES: Partial<
  Record<SATModuleId, Record<number, { accepted: string[]; tolerance?: number }>>
> = {
  math1: {
    6: { accepted: ['9'] },
    7: { accepted: ['10'] },
    13: { accepted: ['1/5', '.2', '0.2'] },
    14: { accepted: ['80'] },
    20: { accepted: ['100'] },
    21: { accepted: ['361/8', '45.12', '45.13', '45.125'], tolerance: 0.0051 },
    27: { accepted: ['5'] },
  },
  math2: {
    6: { accepted: ['15', '-5'] },
    7: { accepted: ['50'] },
    13: { accepted: ['.3', '0.3', '3/10'] },
    14: { accepted: ['2'] },
    20: { accepted: ['15/17', '.8824', '.8823', '0.8824', '0.8823'], tolerance: 0.00006 },
    21: { accepted: ['51'] },
    27: { accepted: ['600'] },
  },
}

const MODULE_META: Array<Omit<SATModule, 'questions'>> = [
  {
    id: 'rw1',
    title: 'Reading and Writing · Module 1',
    shortTitle: 'R&W Module 1',
    section: 'reading-writing',
    durationSeconds: 32 * 60,
  },
  {
    id: 'rw2',
    title: 'Reading and Writing · Module 2',
    shortTitle: 'R&W Module 2',
    section: 'reading-writing',
    durationSeconds: 32 * 60,
  },
  {
    id: 'math1',
    title: 'Math · Module 1',
    shortTitle: 'Math Module 1',
    section: 'math',
    durationSeconds: 35 * 60,
  },
  {
    id: 'math2',
    title: 'Math · Module 2',
    shortTitle: 'Math Module 2',
    section: 'math',
    durationSeconds: 35 * 60,
  },
]

function questionSkill(section: SATSection, prompt: string) {
  const text = prompt.toLowerCase()
  if (section === 'reading-writing') {
    if (text.includes('conventions of standard english')) return ['Standard English Conventions', 'Grammar & Usage']
    if (text.includes('transition')) return ['Expression of Ideas', 'Transitions']
    if (text.includes('student has taken') || text.includes('information from the notes')) return ['Expression of Ideas', 'Rhetorical Synthesis']
    if (text.includes('data from the') || text.includes('evidence') || text.includes('claim') || text.includes('main purpose')) return ['Information and Ideas', 'Evidence & Inference']
    if (text.includes('word or phrase')) return ['Craft and Structure', 'Words in Context']
    return ['Craft and Structure', 'Text Structure & Purpose']
  }
  if (/circle|triangle|angle|square|prism|perimeter|area/.test(text)) return ['Geometry and Trigonometry', 'Geometry']
  if (/percent|ratio|probability|sample|margin of error|data set|scatterplot|graph shows|table/.test(text)) return ['Problem-Solving and Data Analysis', 'Data & Ratios']
  if (/quadratic|parabola|exponent|radical|no real solution|minimum|vertex/.test(text)) return ['Advanced Math', 'Nonlinear Functions']
  return ['Algebra', 'Linear Equations & Functions']
}

function questionDifficulty(moduleId: SATModuleId, number: number): SATQuestion['difficulty'] {
  const moduleBoost = moduleId === 'rw2' || moduleId === 'math2' ? 3 : 0
  const level = number + moduleBoost
  if (level <= 9) return 'Foundation'
  if (level <= 21) return 'Medium'
  return 'Advanced'
}

function buildQuestion(moduleMeta: Omit<SATModule, 'questions'>, entry: ManifestEntry): SATQuestion {
  const response = STUDENT_RESPONSES[moduleMeta.id]?.[entry.number]
  const answer = response?.accepted[0] ?? MULTIPLE_CHOICE_KEYS[moduleMeta.id][entry.number - 1]
  const id = `${moduleMeta.id}-${entry.number}`
  const extracted = structuredQuestions.find((question) => question.id === id)
  const override = SAT_PRACTICE_TEST_4_CONTENT_OVERRIDES[id]
  const prompt = override?.prompt ?? extracted?.prompt ?? ''
  const [domain, skill] = questionSkill(moduleMeta.section, prompt)
  return {
    id,
    moduleId: moduleMeta.id,
    number: entry.number,
    section: moduleMeta.section,
    kind: response ? 'student-response' : 'multiple-choice',
    correctAnswer: answer,
    acceptedAnswers: response?.accepted,
    tolerance: response?.tolerance,
    prompt,
    choices: override?.choices ?? extracted?.choices ?? [],
    visual: override?.visual,
    domain,
    skill,
    difficulty: questionDifficulty(moduleMeta.id, entry.number),
    asset: entry.asset,
    assetWidth: entry.width,
    assetHeight: entry.height,
    explanation: explanations[moduleMeta.id]?.[String(entry.number)] ?? '',
  }
}

export const SAT_PRACTICE_TEST_4_MODULES: SATModule[] = MODULE_META.map((moduleMeta) => ({
  ...moduleMeta,
  questions: manifest
    .filter((entry) => entry.moduleId === moduleMeta.id)
    .sort((a, b) => a.number - b.number)
    .map((entry) => buildQuestion(moduleMeta, entry)),
}))

export const SAT_PRACTICE_TEST_4 = {
  id: 'practice-test-4' as const,
  title: 'Digital SAT Practice Test 4',
  subtitle: 'College Board paper-digital edition',
  questionCount: 120,
  totalDurationSeconds: SAT_PRACTICE_TEST_4_MODULES.reduce(
    (sum, module) => sum + module.durationSeconds,
    0,
  ),
  modules: SAT_PRACTICE_TEST_4_MODULES,
}

const RW_SCORE_RANGES: Array<[number, number]> = [
  [200, 200], [200, 200], [200, 200], [200, 200], [200, 200], [200, 200], [200, 200],
  [200, 210], [200, 220], [210, 230], [230, 250], [240, 260], [250, 270], [260, 280],
  [280, 300], [290, 310], [320, 340], [340, 360], [350, 370], [360, 380], [370, 390],
  [370, 390], [380, 400], [390, 410], [400, 420], [410, 430], [420, 440], [420, 440],
  [430, 450], [440, 460], [450, 470], [460, 480], [460, 480], [470, 490], [480, 500],
  [490, 510], [490, 510], [500, 520], [510, 530], [520, 540], [530, 550], [540, 560],
  [540, 560], [550, 570], [560, 580], [570, 590], [580, 600], [590, 610], [590, 610],
  [600, 620], [610, 630], [620, 640], [630, 650], [630, 650], [640, 660], [650, 670],
  [660, 680], [670, 690], [680, 700], [690, 710], [700, 720], [710, 730], [720, 740],
  [730, 750], [750, 770], [770, 790], [790, 800],
]

const MATH_SCORE_RANGES: Array<[number, number]> = [
  [200, 200], [200, 200], [200, 200], [200, 200], [200, 200], [200, 200], [200, 200],
  [200, 220], [200, 230], [220, 250], [250, 280], [280, 310], [290, 320], [300, 330],
  [310, 340], [320, 350], [330, 360], [330, 360], [340, 370], [350, 380], [360, 390],
  [370, 400], [370, 400], [380, 410], [390, 420], [400, 430], [420, 450], [430, 460],
  [440, 470], [460, 490], [470, 500], [480, 510], [500, 530], [510, 540], [520, 550],
  [530, 560], [550, 580], [560, 590], [570, 600], [580, 610], [590, 620], [600, 630],
  [620, 650], [630, 660], [650, 680], [670, 700], [690, 720], [710, 740], [730, 760],
  [740, 770], [750, 780], [760, 790], [770, 800], [780, 800], [790, 800],
]

function parseStudentResponse(value: string): number | null {
  const normalized = value.trim().replace(/[−–—]/g, '-').replace(/\s+/g, '')
  if (!normalized) return null
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  const fraction = normalized.match(/^(-?(?:\d+\.?\d*|\.\d+))\/(-?(?:\d+\.?\d*|\.\d+))$/)
  if (!fraction) return null
  const denominator = Number(fraction[2])
  if (!denominator) return null
  return Number(fraction[1]) / denominator
}

export function isSATAnswerCorrect(question: SATQuestion, response?: string): boolean {
  if (!response?.trim()) return false
  if (question.kind === 'multiple-choice') {
    return response.trim().toUpperCase() === question.correctAnswer
  }

  const normalized = response.trim().replace(/[−–—]/g, '-').replace(/\s+/g, '')
  if (question.acceptedAnswers?.some((answer) => answer.replace(/\s+/g, '') === normalized)) {
    return true
  }

  const candidate = parseStudentResponse(normalized)
  if (candidate === null) return false
  const tolerance = question.tolerance ?? 0.0000001
  return Boolean(
    question.acceptedAnswers?.some((answer) => {
      const accepted = parseStudentResponse(answer)
      return accepted !== null && Math.abs(candidate - accepted) <= tolerance
    }),
  )
}

export type SATScoreReport = {
  readingWritingRaw: number
  mathRaw: number
  totalRaw: number
  correct: number
  incorrect: number
  unanswered: number
  readingWritingRange: [number, number]
  mathRange: [number, number]
  totalRange: [number, number]
  midpoint: number
  percent: number
}

export function scoreSATPracticeTest4(answers: Record<string, string>): SATScoreReport {
  const questions = SAT_PRACTICE_TEST_4_MODULES.flatMap((module) => module.questions)
  let readingWritingRaw = 0
  let mathRaw = 0
  let unanswered = 0

  questions.forEach((question) => {
    const response = answers[question.id]
    if (!response?.trim()) {
      unanswered += 1
    } else if (isSATAnswerCorrect(question, response)) {
      if (question.section === 'reading-writing') readingWritingRaw += 1
      else mathRaw += 1
    }
  })

  const correct = readingWritingRaw + mathRaw
  const readingWritingRange = RW_SCORE_RANGES[readingWritingRaw] ?? [200, 200]
  const mathRange = MATH_SCORE_RANGES[mathRaw] ?? [200, 200]
  const totalRange: [number, number] = [
    readingWritingRange[0] + mathRange[0],
    readingWritingRange[1] + mathRange[1],
  ]

  return {
    readingWritingRaw,
    mathRaw,
    totalRaw: correct,
    correct,
    incorrect: questions.length - correct - unanswered,
    unanswered,
    readingWritingRange,
    mathRange,
    totalRange,
    midpoint: Math.round((totalRange[0] + totalRange[1]) / 20) * 10,
    percent: Math.round((correct / questions.length) * 100),
  }
}

export function createSATPracticeTest4Attempt(mode: SATMode): SATAttempt {
  const now = Date.now()
  const firstModule = SAT_PRACTICE_TEST_4_MODULES[0]
  return {
    version: 1,
    testId: 'practice-test-4',
    mode,
    status: 'active',
    currentModuleIndex: 0,
    currentQuestionIndex: 0,
    answers: {},
    flagged: [],
    notes: {},
    highlights: {},
    startedAt: now,
    updatedAt: now,
    moduleStartedAt: { [firstModule.id]: now },
    moduleDeadlines:
      mode === 'exam' ? { [firstModule.id]: now + firstModule.durationSeconds * 1000 } : {},
  }
}
