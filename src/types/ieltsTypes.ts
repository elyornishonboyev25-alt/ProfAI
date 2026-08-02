export type IELTSTestType = 'Academic' | 'General Training'

export interface Question {
    id: string
    number: number
    text: string
    type:
    | 'multiple-choice'
    | 'true-false-not-given'
    | 'yes-no-not-given'
    | 'matching-headings'
    | 'matching-information'
    | 'summary-completion'
    | 'note-completion'
    | 'short-answer'
    | 'five-true-statements'
    | 'drag-drop-summary'
    options?: string[]
    correctAnswer: string | string[] // string[] for multi-slot questions
    explanation?: string
    location?: string // For Reading/Listening (paragraph or timestamp)
    userAnswer?: string | string[]
    groupTitle?: string // e.g., "Questions 1-4"
    instruction?: string // e.g., "Which paragraph contains..."
}

// ---- Listening rich layout (OneIELTS / Cambridge CD-style rendering) ----
// A segment is either plain text or a numbered blank bound to a question number.
export type ListeningSegment =
    | string
    | { blank: number; before?: string; after?: string; width?: 'sm' | 'md' | 'lg' | 'xl' }

export interface ListeningOption {
    letter: string // 'A', 'B', ...
    text: string
}

// One renderable block inside a question group.
export type ListeningBlock =
    | { kind: 'title'; text: string } // centred section heading e.g. "Car Rental Inquiry"
    | { kind: 'subhead'; text: string } // bold sub-heading e.g. "Special requirements for the room:"
    | { kind: 'text'; text: string } // plain paragraph / caption line
    | { kind: 'example'; segments: ListeningSegment[] } // italic "Example" line
    | { kind: 'note'; segments: ListeningSegment[]; bullet?: boolean; indent?: boolean }
    | { kind: 'flow'; boxes: { segments: ListeningSegment[] }[] } // vertical flow chart with arrows
    | { kind: 'grid'; columns: string[]; rows: { blank: number; label: string }[]; options?: ListeningOption[] }
    | { kind: 'mcq'; blank: number; prompt: string; options: string[] }
    | { kind: 'table'; columns: string[]; rows: { segments: ListeningSegment[] }[][] }
    | { kind: 'space' }

export interface ListeningGroup {
    range: string // "Questions 1 - 10"
    instruction: string // "Complete the notes. Write ONE WORD ONLY/OR A NUMBER for each answer."
    blocks: ListeningBlock[]
}

export interface Section {
    id: string
    title: string
    content?: string // For Reading (full text)
    paragraphs?: { label: string; content: string }[] // For structured Reading passages
    showParagraphLabels?: boolean // Preserve source lettering only when the original passage uses it
    audioUrl?: string // For Listening
    visualAidUrl?: string // Optional prompt/diagram image for Listening
    audioTranscript?: string // Optional transcript for practice mode review
    duration?: number // Audio duration in seconds
    // Listening exam chrome + rich layout (optional; falls back to simple rendering when absent)
    partLabel?: string // "Part 1"
    partInstruction?: string // "Listen and answer questions 1 - 10."
    groups?: ListeningGroup[] // OneIELTS-style rendered question groups
    questions: Question[]
}

export interface IELTSTest {
    id: string
    title: string
    type: IELTSTestType
    module: 'Listening' | 'Reading' | 'Writing' | 'Speaking'
    duration: number // Total minutes
    sections: Section[]
    totalQuestions: number
}

// Writing Specific Types
export interface WritingTask {
    id: string
    taskType: 'Task 1' | 'Task 2'
    question: string
    image?: string // For Task 1 graphs/charts
    minWords: number
    suggestedTime: number
    modelAnswer?: string
    markingCriteria?: {
        coherence: string
        lexical: string
        grammatical: string
        taskAchievement: string
    }
}

export interface WritingTest extends Omit<IELTSTest, 'sections' | 'totalQuestions' | 'module'> {
    module: 'Writing'
    tasks: WritingTask[]
}

// Speaking Specific Types
export interface SpeakingPart {
    id: string
    partNumber: 1 | 2 | 3
    title: string
    questions: string[]
    cueCard?: {
        topic: string
        bulletPoints: string[]
    }
    preparationTime?: number // For Part 2
}

export interface SpeakingTest extends Omit<IELTSTest, 'sections' | 'totalQuestions' | 'module'> {
    module: 'Speaking'
    parts: SpeakingPart[]
}

// Results
export interface TestResult {
    testId: string
    date: string
    score: number // Band score
    correctAnswers: number
    totalQuestions: number
    timeSpent: number
    answers: Record<string, any>
    detailedBreakdown?: TestResultBreakdown
    isPartial?: boolean
    leaderboardEligible?: boolean
}

export type QuestionReviewStatus = 'correct' | 'incorrect' | 'skipped'

export interface ReadingQuestionResult {
    questionId: string
    questionType: Question['type']
    sectionId: string
    sectionTitle: string
    partNumber: number
    questionNumbers: number[]
    displayNumber: string
    prompt: string
    location?: string
    paragraphLabel?: string
    userAnswer: string | number | string[] | undefined
    correctAnswer: string | string[]
    score: number
    maxScore: number
    status: QuestionReviewStatus
}

export interface ReadingSectionSummary {
    sectionId: string
    sectionTitle: string
    partNumber: number
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedAnswers: number
    accuracy: number
    questions: ReadingQuestionResult[]
}

export interface ReadingLocationInsight {
    sectionId: string
    sectionTitle: string
    partNumber: number
    paragraphLabel: string
    questionNumbers: number[]
    correctQuestionNumbers: number[]
    incorrectQuestionNumbers: number[]
    skippedQuestionNumbers: number[]
}

export interface ReadingTypeInsight {
    type: Question['type']
    label: string
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedAnswers: number
    accuracy: number
}

export interface ReadingAnalysisSummary {
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedAnswers: number
    accuracy: number
}

export interface ReadingAnalysisReport {
    generatedAt: string
    summary: ReadingAnalysisSummary
    sectionSummaries: ReadingSectionSummary[]
    questionResults: ReadingQuestionResult[]
    locationInsights: ReadingLocationInsight[]
    typeInsights: ReadingTypeInsight[]
}

export interface TestResultBreakdown {
    activeSectionIds: string[]
    readingAnalysis?: ReadingAnalysisReport
}

