import PillarHub, { type PillarHubCard } from '@/components/journey/PillarHub'

const SKILL_STUDIOS: PillarHubCard[] = [
  {
    title: 'Vocabulary Studio',
    description: 'Turn unfamiliar words from practice and reading into focused, repeatable study activities.',
    eyebrow: 'Language foundation',
    action: 'Build vocabulary',
    path: '/vocabulary',
    tone: 'blue',
    visual: 'vocabulary',
    details: ['Personal word bank', 'Focused revision'],
  },
  {
    title: 'Reading Library',
    description: 'Read structured articles, inspect language in context and build stronger comprehension habits.',
    eyebrow: 'Academic reading',
    action: 'Browse articles',
    path: '/articles',
    tone: 'red',
    visual: 'academic-reading',
    details: ['Curated reading', 'Context learning'],
  },
  {
    title: 'Listening Studio',
    description: 'Train listening comprehension with captions, playback controls and focused repetition.',
    eyebrow: 'Listening fluency',
    action: 'Open podcasts',
    path: '/podcast',
    tone: 'blue',
    visual: 'listening',
    details: ['Active listening', 'Flexible playback'],
  },
  {
    title: 'Shadowing Lab',
    description: 'Repeat spoken English line by line to improve rhythm, pronunciation and listening control.',
    eyebrow: 'Pronunciation',
    action: 'Start shadowing',
    path: '/shadowing-lab',
    tone: 'red',
    visual: 'shadowing',
    details: ['Guided repetition', 'Speech rhythm'],
  },
  {
    title: 'Writing Lab',
    description: 'Practice clear, structured responses and use feedback to revise your own work.',
    eyebrow: 'Academic writing',
    action: 'Open Writing Lab',
    path: '/writing-lab',
    tone: 'blue',
    visual: 'writing',
    details: ['Structured practice', 'Revision feedback'],
  },
  {
    title: 'Speaking Lab',
    description: 'Build confident spoken answers through guided practice, reflection and repeat attempts.',
    eyebrow: 'Academic speaking',
    action: 'Open Speaking Lab',
    path: '/speaking-lab',
    tone: 'red',
    visual: 'speaking',
    details: ['Guided prompts', 'Repeat attempts'],
  },
]

export default function AcademicSkills() {
  return (
    <PillarHub
      eyebrow="Academic skills studio"
      title={
        <>
          Learn with <span className="text-red-600">clarity.</span>{' '}
          Study with <span className="text-blue-600">confidence.</span>
        </>
      }
      description="Develop the English skills behind strong exam performance, clear applications and confident university study."
      highlights={['Read with purpose', 'Listen actively', 'Write clearly', 'Speak confidently']}
      cards={SKILL_STUDIOS}
      showBack={false}
      note="These studios support independent skill development. They complement exam preparation and do not replace a university's official language or academic requirements."
    />
  )
}
