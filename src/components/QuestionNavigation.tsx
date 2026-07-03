import { memo, useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon } from '@heroicons/react/24/outline'

export interface SectionMeta {
    id: string
    title: string
    startIndex: number
    questionCount: number
    questionIds: string[]
    questionNumbers: number[]
}

interface QuestionNavigationProps {
    sections: SectionMeta[]
    currentSectionIndex: number
    currentQuestionIndex: number
    answers: Record<string, any>
    onNavigate: (index: number) => void
    onSectionChange: (index: number) => void
    onFlag?: (index: number) => void
    flagged?: number[]
}

function isAnsweredValue(value: any): boolean {
    if (value === undefined || value === null || value === '') return false
    if (Array.isArray(value)) return countFilledArrayItems(value) > 0
    return true
}

function countFilledArrayItems(values: any[]): number {
    return values.filter((entry) => String(entry ?? '').trim().length > 0).length
}

const QuestionNavigation = memo(function QuestionNavigation({
    sections,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    onNavigate,
    onSectionChange,
    onFlag,
    flagged = []
}: QuestionNavigationProps) {

    const totalQuestions = useMemo(() =>
        sections.reduce((acc, section) => acc + section.questionCount, 0),
        [sections])

    return (
        <div className="border-t border-red-100 bg-white p-3 backdrop-blur-xl transition-colors duration-300">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
                <div className="mask-linear-fade flex w-full flex-1 items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {sections.map((section, idx) => {
                        const isActive = idx === currentSectionIndex
                        const sectionStart = section.startIndex
                        const sectionEnd = section.startIndex + section.questionCount
                        const flaggedInSection = flagged.filter((entry) => entry >= sectionStart && entry < sectionEnd).length

                        const slotFrequency = new Map<string, number>()
                        section.questionIds.forEach((questionId) => {
                            slotFrequency.set(questionId, (slotFrequency.get(questionId) ?? 0) + 1)
                        })

                        let answeredInSection = 0
                        slotFrequency.forEach((slotCount, questionId) => {
                            const answer = answers[questionId]
                            if (Array.isArray(answer)) {
                                answeredInSection += Math.min(slotCount, countFilledArrayItems(answer))
                                return
                            }
                            if (isAnsweredValue(answer)) {
                                answeredInSection += slotCount
                            }
                        })

                        return (
                            <div
                                key={section.id}
                                className={`
                                    flex shrink-0 cursor-pointer items-center overflow-hidden rounded-xl border transition-all duration-300 ease-in-out
                                    ${isActive
                                        ? 'flex-grow border-red-400 bg-white shadow-[0_10px_22px_rgba(220,38,38,0.12)] ring-1 ring-red-500/20'
                                        : 'w-auto border-red-100 text-slate-500 hover:bg-red-50/60'}
                                `}
                                onClick={() => !isActive && onSectionChange(idx)}
                            >
                                <div className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 ${isActive ? 'border-r border-red-100 bg-red-50/50' : ''}`}>
                                    <span className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                                        Part {idx + 1}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400">
                                        {isActive ? ':' : `| ${answeredInSection} of ${section.questionCount} solved`}
                                    </span>
                                    {flaggedInSection > 0 ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                                            <FlagIcon className="h-3 w-3" />
                                            {flaggedInSection}
                                        </span>
                                    ) : null}
                                </div>

                                {isActive && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto p-2">
                                        {section.questionIds.map((questionId, localIndex) => {
                                            const globalIndex = section.startIndex + localIndex
                                            const slotCount = slotFrequency.get(questionId) ?? 1
                                            const answer = answers[questionId]
                                            const answeredSlots = Array.isArray(answer)
                                                ? Math.min(slotCount, countFilledArrayItems(answer))
                                                : isAnsweredValue(answer)
                                                    ? slotCount
                                                    : 0
                                            const slotPosition = section.questionIds
                                                .slice(0, localIndex + 1)
                                                .filter((entry) => entry === questionId).length
                                            const isAnswered = slotPosition <= answeredSlots
                                            const isCurrent = currentQuestionIndex === globalIndex
                                            const isFlagged = flagged.includes(globalIndex)
                                            const questionNumber = section.questionNumbers[localIndex] ?? (globalIndex + 1)

                                            return (
                                                <button type="button"
                                                    key={`${questionId}-${localIndex}`}
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        onNavigate(globalIndex)
                                                    }}
                                                    className={`
                                                        relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all
                                                        ${isCurrent
                                                            ? 'z-10 scale-110 border-red-600 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_8px_20px_rgba(220,38,38,0.26)]'
                                                            : isAnswered
                                                                ? 'border-red-200 bg-red-50 text-red-600'
                                                                : 'border-red-100 bg-white text-slate-500 hover:border-red-300'}
                                                    `}
                                                >
                                                    {isCurrent && (
                                                        <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-full bg-red-400/40 [animation-duration:1.6s]" />
                                                    )}
                                                    {questionNumber}
                                                    {isFlagged && (
                                                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-amber-500" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="flex shrink-0 items-center gap-2 border-l border-red-100 pl-4">
                    {onFlag && (
                        <button type="button"
                            onClick={() => onFlag(currentQuestionIndex)}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition-colors ${flagged.includes(currentQuestionIndex)
                                ? 'border-amber-200 bg-amber-50 text-amber-600'
                                : 'border-red-100 bg-white text-slate-400 hover:bg-red-50 hover:text-red-500'
                                }`}
                            title="Flag Question"
                        >
                            <FlagIcon className="h-4 w-4" />
                        </button>
                    )}

                    <button type="button"
                        onClick={() => onNavigate(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-slate-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </button>

                    <button type="button"
                        onClick={() => onNavigate(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex >= totalQuestions - 1}
                        className="flex h-9 items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(220,38,38,0.3)] transition-colors hover:from-red-500 hover:to-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span>Next</span>
                        <ChevronRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
})

export default QuestionNavigation


