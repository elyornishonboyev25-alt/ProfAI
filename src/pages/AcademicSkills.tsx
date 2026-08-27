import { AudioLines, BookOpenText, Headphones, Languages, Mic2, PenLine } from 'lucide-react'
import PillarHub, { type PillarHubCard } from '@/components/journey/PillarHub'

const CARDS: PillarHubCard[] = [
  {
    title: 'Vocabulary',
    description: 'Turn unfamiliar words from practice and reading into focused, repeatable study activities.',
    eyebrow: 'Language foundation',
    action: 'Build vocabulary',
    path: '/vocabulary',
    icon: Languages,
    tone: 'blue',
  },
  {
    title: 'Reading library',
    description: 'Read structured articles, inspect language in context and build stronger comprehension habits.',
    eyebrow: 'Academic reading',
    action: 'Browse articles',
    path: '/articles',
    icon: BookOpenText,
    tone: 'indigo',
  },
  {
    title: 'English podcasts',
    description: 'Train listening comprehension with captions, playback controls and focused repetition.',
    eyebrow: 'Listening fluency',
    action: 'Open podcasts',
    path: '/podcast',
    icon: Headphones,
    tone: 'amber',
  },
  {
    title: 'Shadowing lab',
    description: 'Repeat spoken English line by line to improve rhythm, pronunciation and listening control.',
    eyebrow: 'Pronunciation',
    action: 'Start shadowing',
    path: '/shadowing-lab',
    icon: AudioLines,
    tone: 'rose',
  },
  {
    title: 'Writing lab',
    description: 'Practice clear, structured responses and use feedback to revise your own work.',
    eyebrow: 'Academic writing',
    action: 'Open Writing Lab',
    path: '/writing-lab',
    icon: PenLine,
    tone: 'emerald',
  },
  {
    title: 'Speaking lab',
    description: 'Build confident spoken answers through guided practice, reflection and repeat attempts.',
    eyebrow: 'Academic speaking',
    action: 'Open Speaking Lab',
    path: '/speaking-lab',
    icon: Mic2,
    tone: 'slate',
  },
]

export default function AcademicSkills() {
  return (
    <PillarHub
      eyebrow="Academic Skills"
      title={<>Build the English skills to <span className="text-blue-600">study with confidence.</span></>}
      description="Strengthen the reading, listening, vocabulary, writing and speaking habits that support both test preparation and university study."
      highlights={['Reading', 'Listening', 'Vocabulary', 'Writing & speaking']}
      cards={CARDS}
      note="These tools support skill development and independent practice. They do not replace a university’s own language, academic or admissions requirements."
    />
  )
}
