import type { ReadingQuestionResult, Section } from '@/types/ieltsTypes'

import { optionDisplayText } from './readingPresentation'

export type ParsedParagraph = {
  label: string
  content: string
}

export function parseSectionParagraphs(section: Section): ParsedParagraph[] {
  if (section.paragraphs?.length) {
    return section.paragraphs.map((paragraph) => ({
      label: paragraph.label.toUpperCase(),
      content: paragraph.content.trim(),
    }))
  }

  const content = section.content?.trim() ?? ''
  if (!content) return []

  const bracketedParagraphs = Array.from(
    content.matchAll(
      /\[Paragraph\s+([A-Za-z0-9]+)\]\s*([\s\S]*?)(?=(?:\n\s*\[Paragraph\s+[A-Za-z0-9]+\]\s*)|$)/gi,
    ),
  )
  if (bracketedParagraphs.length) {
    return bracketedParagraphs.map((match) => ({
      label: match[1].toUpperCase(),
      content: match[2].trim(),
    }))
  }

  const letteredParagraphs = Array.from(
    content.matchAll(/(?:^|\n)\s*([A-Z])\.\s+([\s\S]*?)(?=(?:\n\s*[A-Z]\.\s+)|$)/g),
  )
  if (letteredParagraphs.length >= 2) {
    return letteredParagraphs.map((match) => ({
      label: match[1].toUpperCase(),
      content: match[2].trim(),
    }))
  }

  return [{ label: 'TEXT', content }]
}

export function firstQuestionNumber(displayNumber: string): number {
  const match = displayNumber.match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

export function formatUserAnswer(answer: unknown, options?: string[]): string {
  if (answer === undefined || answer === null || answer === '') return 'N/A'
  if (Array.isArray(answer)) return answer.join(', ')
  if (typeof answer === 'number' && options?.[answer]) {
    const label = String.fromCharCode(65 + answer)
    return `${label}. ${optionDisplayText(options[answer], options)}`
  }
  return String(answer)
}

export function formatCorrectAnswer(answer: string | string[]): string {
  return Array.isArray(answer) ? answer.join(', ') : String(answer)
}

export function questionStatusBadge(status: ReadingQuestionResult['status']) {
  if (status === 'correct') {
    return {
      label: 'Correct',
      tone: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    }
  }

  if (status === 'skipped') {
    return {
      label: 'Skipped',
      tone: 'border-slate-300 bg-slate-50 text-slate-600',
    }
  }

  return {
    label: 'Incorrect',
    tone: 'border-red-300 bg-red-50 text-red-700',
  }
}

export function questionCardTone(status: ReadingQuestionResult['status']) {
  if (status === 'incorrect') return 'border-red-300 bg-red-50/80'
  if (status === 'skipped') return 'border-slate-200 bg-white'
  return 'border-emerald-200 bg-emerald-50/75'
}

