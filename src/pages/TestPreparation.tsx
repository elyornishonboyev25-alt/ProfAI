import { BarChart3, BookOpenCheck, Calculator, Headphones, MessageSquareText, TimerReset } from 'lucide-react'
import PillarHub, { type PillarHubCard } from '@/components/journey/PillarHub'

const CARDS: PillarHubCard[] = [
  {
    title: 'IELTS preparation',
    description: 'Prepare for Academic or General Training across Reading, Listening, Writing and Speaking.',
    eyebrow: 'English proficiency',
    action: 'Open IELTS',
    path: '/ielts',
    icon: Headphones,
    tone: 'blue',
  },
  {
    title: 'Digital SAT preparation',
    description: 'Build Math and Reading & Writing accuracy with section practice, timing and score review.',
    eyebrow: 'Undergraduate admissions',
    action: 'Open SAT',
    path: '/sat',
    icon: Calculator,
    tone: 'indigo',
  },
  {
    title: 'IELTS mock exams',
    description: 'Run complete timed IELTS simulations when you are ready to measure your current baseline.',
    eyebrow: 'Exam simulation',
    action: 'View IELTS mocks',
    path: '/mock/ielts',
    icon: TimerReset,
    tone: 'rose',
  },
  {
    title: 'SAT mock exams',
    description: 'Practice under test conditions and use the result to choose your next focused study block.',
    eyebrow: 'Exam simulation',
    action: 'View SAT mocks',
    path: '/mock/sat',
    icon: BookOpenCheck,
    tone: 'amber',
  },
  {
    title: 'Writing practice',
    description: 'Work through IELTS writing tasks and receive structured feedback on your own response.',
    eyebrow: 'Skill practice',
    action: 'Open Writing',
    path: '/ielts/writing/tests',
    icon: MessageSquareText,
    tone: 'emerald',
  },
  {
    title: 'Mistake analysis',
    description: 'Review completed work, identify recurring gaps and decide what deserves attention next.',
    eyebrow: 'Progress review',
    action: 'Review mistakes',
    path: '/analyze-mistakes',
    icon: BarChart3,
    tone: 'slate',
  },
]

export default function TestPreparation() {
  return (
    <PillarHub
      eyebrow="Test Preparation"
      title={<>Build the scores your <span className="text-blue-600">university plan</span> requires.</>}
      description="Choose IELTS or SAT, establish a baseline and focus your practice on the skills that matter for your target applications."
      highlights={['IELTS Academic & General Training', 'Digital SAT', 'Timed practice', 'Progress review']}
      cards={CARDS}
      note="Test results are preparation signals, not admission guarantees. Always confirm the required test type and score on each university’s official programme page."
    />
  )
}
