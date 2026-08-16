// Shared Speaking-session view of the canonical IELTS question bank.
// IELTS content must be added only through ieltsSpeakingBank(.Extra). This file
// adapts the richer question + sample-answer records for live examiner sessions.

import {
  CUE_CARDS as IELTS_CUE_CARDS,
  PART1_TOPICS as IELTS_PART1_TOPICS,
  PART3_THEMES as IELTS_PART3_THEMES,
  PART_LABELS,
  pickRandom,
} from '@/data/ieltsSpeakingQuestionBank'

export type SpeakingPart = 1 | 2 | 3

export type Part1Topic = {
  id: string
  topic: string
  questions: string[]
}

export type CueCard = {
  id: string
  title: string
  bullets: string[]
  followUp: string
  theme: string
}

export type Part3Theme = {
  id: string
  theme: string
  questions: string[]
}

/** What the user picks on the hub. `full_mock` runs Part 1 -> 2 -> 3. */
export type ExaminerMode = 'part1' | 'part2' | 'part3' | 'full_mock' | 'interview' | 'free_talk'

export type InterviewKind = 'university' | 'scholarship' | 'job'

export type InterviewPack = {
  id: InterviewKind
  title: string
  persona: string
  description: string
  openers: string[]
}

export const PART1_TOPICS: readonly Part1Topic[] = IELTS_PART1_TOPICS.map((topic) => ({
  id: topic.id,
  topic: topic.topic,
  questions: topic.questions.map((question) => question.q),
}))

export const CUE_CARDS: readonly CueCard[] = IELTS_CUE_CARDS.map((card) => ({
  id: card.id,
  title: card.title,
  bullets: [...card.bullets],
  followUp: card.followUp,
  theme: card.theme,
}))

export const PART3_THEMES: readonly Part3Theme[] = IELTS_PART3_THEMES.map((theme) => ({
  id: theme.id,
  theme: theme.theme,
  questions: theme.questions.map((question) => question.q),
}))

export const INTERVIEW_PACKS: readonly InterviewPack[] = [
  {
    id: 'university',
    title: 'University Admission',
    persona: 'a warm but probing university admissions officer',
    description: 'Motivation, fit, strengths and goals — like a real admissions interview.',
    openers: [
      'Thank you for joining us today. To start, could you tell me a little about yourself and why you applied to this programme?',
      'What is it about this field of study that excites you the most?',
    ],
  },
  {
    id: 'scholarship',
    title: 'Scholarship Interview',
    persona: 'a thoughtful scholarship committee member',
    description: 'Achievements, leadership, financial need and impact.',
    openers: [
      'Welcome. Let’s begin — why do you believe you are a strong candidate for this scholarship?',
      'Tell me about a time you overcame a significant obstacle in your studies.',
    ],
  },
  {
    id: 'job',
    title: 'Job Interview',
    persona: 'a friendly but rigorous hiring manager',
    description: 'Experience, problem-solving, strengths and weaknesses.',
    openers: [
      'Thanks for coming in. Could you walk me through your background and what brought you here?',
      'Tell me about a challenge you faced at work or in a project and how you handled it.',
    ],
  },
]

export { PART_LABELS, pickRandom }

export const PART_QUESTION_BUDGET: Record<SpeakingPart, number> = {
  1: 5,
  2: 1,
  3: 5,
}
